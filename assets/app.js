/* Renders data/menus.json. No build step, no dependencies. */
(() => {
  "use strict";

  // Allergen codes as the restaurants write them, trailing the dish.
  const TAGS = /(?:^|[\s(])((?:VL|VE|MU|LL|[LGMVA])(?:\s*[,/]\s*(?:VL|VE|MU|LL|[LGMVA]))*)\s*$/;
  const PRICE = /(\d{1,2}[,.]\d{2})\s*€?\s*$/;

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  /** Split "Lihapullia L, G 12,50€" into text + price + allergen chips. */
  function dish(line) {
    const li = el("li");
    let rest = line;
    let price = null, tags = null;

    const p = rest.match(PRICE);
    if (p) { price = p[1].replace(".", ",") + " €"; rest = rest.slice(0, p.index).trim(); }

    const t = rest.match(TAGS);
    if (t) { tags = t[1].split(/\s*[,/]\s*/); rest = rest.slice(0, t.index).trim(); }

    li.appendChild(document.createTextNode(rest.replace(/[\s,]+$/, "")));
    if (price) { li.appendChild(document.createTextNode(" ")); li.appendChild(el("span", "price", price)); }
    if (tags) {
      const box = el("span", "tags");
      tags.forEach(t => box.appendChild(el("span", "tag", t)));
      li.appendChild(box);
    }
    return li;
  }

  function card(r, weekday) {
    const c = el("article", "card");

    const h = el("h2");
    const a = el("a", null, r.name);
    a.href = r.url; a.target = "_blank"; a.rel = "noopener noreferrer";
    h.appendChild(a);
    c.appendChild(h);

    const meta = el("p", "meta");
    [r.area, r.hours].filter(Boolean).forEach((bit, i) => {
      if (i) meta.appendChild(el("span", "dot", "·"));
      meta.appendChild(document.createTextNode(bit));
    });
    c.appendChild(meta);

    if (r.status === "stale") c.appendChild(el("span", "badge stale", "Vanha tieto"));
    if (r.status === "error" || r.status === "empty") c.appendChild(el("span", "badge error", "Ei saatavilla"));

    const day = (r.days || []).find(d => d.weekday === weekday);
    if (day && day.items && day.items.length) {
      if (day.items.length > 9) c.classList.add("compact");
      if (day.items.length > 12) c.classList.add("extra-compact");
      const ul = el("ul", "dishes");
      day.items.forEach(i => ul.appendChild(dish(i)));
      c.appendChild(ul);
    } else {
      c.appendChild(el("p", "note",
        r.status === "ok" ? "Ei listaa tälle päivälle." : "Listaa ei saatu haettua — katso ravintolan sivu."));
    }
    return c;
  }

  function render(data, weekday) {
    const grid = document.getElementById("grid");
    grid.textContent = "";
    data.restaurants.forEach(r => grid.appendChild(card(r, weekday)));
    grid.hidden = false;
    document.getElementById("loading").hidden = true;
  }

  function updateFooter(data) {
    const updated = new Date(data.generatedAt).toLocaleString("fi-FI", {
      day: "numeric", month: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    document.getElementById("updated").textContent = `Päivitetty ${updated}`;
  }

  async function init() {
    let data;
    try {
      const res = await fetch("data/menus.json", { cache: "no-cache" });
      if (!res.ok) throw new Error(res.status);
      data = await res.json();
    } catch (err) {
      document.getElementById("loading").textContent =
        "Listojen lataus epäonnistui. Yritä päivittää sivu.";
      return;
    }

    // Monday on weekends - nobody is reading this for Saturday.
    const wd = new Date().getDay();
    const active = wd === 0 || wd === 6 ? 0 : wd - 1;
    render(data, active);
    updateFooter(data);
  }

  init();
})();
