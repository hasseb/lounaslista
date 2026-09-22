# Lounaslista

Lunch menus from seven restaurants in Helsinki, collected onto one page.

The menus are scraped **on a schedule by GitHub Actions**, not in the browser.
The scraper commits `data/menus.json`, and the page just reads that file. This
sidesteps CORS entirely (none of the seven sites send permissive CORS headers),
keeps the page fast, and means one visit per restaurant per run instead of one
per visitor.

## Restaurants

| Restaurant | Area | Source |
|---|---|---|
| Factory Pitäjänmäki | Pitäjänmäki | [ravintolafactory.com](https://ravintolafactory.com/lounasravintolat/ravintolat/helsinki-pitajanmaki/) |
| Lasihelmi | Helsinki | [compass-group.fi](https://www.compass-group.fi/ravintolat-ja-ruokalistat/foodco/kaupungit/helsinki/lasihelmi/) |
| Lounasravintola Herkkuhetki | Pitäjänmäki | [herkkuhetkitali.fi](https://herkkuhetkitali.fi/) |
| Pitäjänmäen Osuusruokala | Pitäjänmäki | [por.fi](https://por.fi/menu/) |
| Ravintola 911 | Kumpula | [ravintola911.fi](https://ravintola911.fi/karvaamokuja-4-lounaslista/) |
| Ravintola Faundori | Pitäjänmäki | [ravintolapalvelut.iss.fi](https://ravintolapalvelut.iss.fi/ravintola-faundori/) |
| Tellus | Pitäjänmäki | [compass-group.fi](https://www.compass-group.fi/ravintolat-ja-ruokalistat/foodco/kaupungit/helsinki/tellus/) |

The restaurants expose their menus through server-rendered HTML, feeds, or
structured data, and all allow this in `robots.txt`.
## Running it locally

No dependencies — Python 3.11+ standard library only.

```bash
python3 -m scrape          # fetch all seven, write data/menus.json
python3 -m http.server 8000   # then open http://localhost:8000
```

Useful flags while developing a parser:

```bash
python3 -m scrape --only por         # just one restaurant
python3 -m scrape --offline saved/   # reparse saved <id>.html, no network
```

## How the parsing works

There are no per-site CSS selectors. `scrape/core.py` flattens the HTML to text
lines and then finds the lines that *start* with a Finnish weekday, treating
everything between one weekday and the next as that day's food. A site can
restyle its markup completely and the parser keeps working, as long as it still
prints "Maanantai" above Monday's list.

Three details make that hold up in practice:

- **Picking the right run of weekdays.** Pages name weekdays in navigation and
  opening hours too, so the headings are split wherever the weekday stops
  advancing, and the longest Mon-to-Fri run wins.
- **Bounding the last day.** Friday has no following heading, so it tends to
  swallow the page footer. The other four days establish how long a day is
  here, and Friday is trimmed to match.
- **Rejoining split dishes.** A dish broken across markup lines (`"... &"`) is
  glued back together.

`scrape/restaurants.py` holds the list of sites and a small `opts` dict each.
Adding a restaurant usually means adding one entry there and nothing else.

## When a site breaks

Scrapers rot; sites get redesigned. Two things limit the damage:

- A restaurant that fails keeps its **previous menu**, flagged `stale` in the
  JSON and badged "Vanha tieto" on the page. One broken site never blanks the
  others.
- Each run writes a summary to the Actions run page listing every restaurant
  and its status, so a break is visible without reading logs.

## Commits, and what "stale" means

A run only commits when the **menus** change. `generatedAt` is deliberately
carried over from the previous run when the scraped content is identical, so
the file stays byte-identical and produces no commit — otherwise the moving
timestamp alone would mean two empty commits a day, every day.

That makes the timestamp mean "when the food last changed" rather than "when
we last looked", so the page does not use it to judge staleness. It compares
`weekStart` against the current week instead: menus sitting unchanged for days
is normal, whereas a `weekStart` from a week already gone means this week's
list was never collected. That is the case worth warning about, and the page
says so.

To investigate, save the page and iterate offline:

```bash
curl -sL https://por.fi/menu/ -o saved/por.html
python3 -m scrape --offline saved/ --only por
```

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. **Settings → Pages → Source: Deploy from a branch**, branch `main`, folder
   `/ (root)`.
3. **Settings → Actions → General → Workflow permissions**: *Read and write*,
   so the scheduled run can commit `data/menus.json`.

The workflow runs at 06:10 and 10:00 Helsinki time on weekdays, and can be run
by hand from the Actions tab.

GitHub cron is UTC only, so those times drift an hour when Finland leaves
EEST at the end of October — 05:10 and 09:00 local through the winter. Both
are still comfortably before lunch, so the schedule is left alone rather than
chasing daylight saving.

Note that the workflow does **not** need the repository's "Workflow
permissions" set to read/write: `update.yml` declares `permissions: contents:
write` for itself, which takes precedence over the repo-wide default.

Two things worth knowing about scheduled Actions: GitHub **disables cron
workflows in repos with no pushes for 60 days** (it emails first — any commit
re-arms it), and scheduled runs can lag the requested time by 10–20 minutes
under load. Neither matters much for lunch.

## Layout

```
scrape/core.py          fetching, HTML flattening, weekday extraction
scrape/restaurants.py   the seven sites
scrape/__main__.py      runner; writes data/menus.json
data/menus.json         scraper output, committed
index.html assets/      the page: no build step, no dependencies
```
