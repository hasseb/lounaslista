"""One entry per restaurant.

`opts` tunes the generic weekday extractor in core.py. Add a `prepare`
callable only when a page needs narrowing before the generic pass.
"""
from __future__ import annotations

import re

RESTAURANTS = [
    {
        "id": "factory-pitajanmaki",
        "name": "Factory Pitäjänmäki",
        "url": "https://ravintolafactory.com/lounasravintolat/ravintolat/helsinki-pitajanmaki/",
        "area": "Pitäjänmäki",
        "hours": "ma-pe 10:00-14:00",
        "opts": {"max_items": 8},
    },
    {
        "id": "herkkuhetki",
        "name": "Lounasravintola Herkkuhetki",
        "url": "https://herkkuhetkitali.fi/",
        "scrape_url": "https://herkkuhetkitali.fi/lounas/",
        "area": "Pitäjänmäki",
        "hours": "ma-pe 10:00-14:00",
        "opts": {"max_items": 12},
    },
    {
        "id": "por",
        "name": "Pitäjänmäen Osuusruokala",
        "url": "https://por.fi/menu/",
        "area": "Pitäjänmäki",
        "hours": "ma-pe 10:15-13:00",
        "opts": {"max_items": 6},
    },
    {
        "id": "911",
        "name": "Ravintola 911",
        "url": "https://ravintola911.fi/karvaamokuja-4-lounaslista/",
        "scrape_url": "https://lounas.app/lounaslista/911-karvaamokuja",
        "area": "Pitäjänmäki",
        "hours": "ma-pe 09:30-14:30",
        "opts": {"max_items": 12},
    },
    {
        "id": "faundori",
        "name": "Ravintola Faundori",
        "url": "https://ravintolapalvelut.iss.fi/ravintola-faundori/",
        "area": "Pitäjänmäki",
        "hours": "ma-pe 10:30-13:00",
        "opts": {"max_items": 6},
    },
    {
        "id": "tellus",
        "name": "Tellus",
        "url": "https://www.compass-group.fi/ravintolat-ja-ruokalistat/foodco/kaupungit/helsinki/tellus/",
        "scrape_url": "https://www.compass-group.fi/menuapi/feed/rss/current-day?costNumber=3105&language=fi",
        "area": "Pitäjänmäki",
        "hours": "ma-pe 10:30-13:15",
        "opts": {"max_items": 12},
    },
]


def by_id(rid: str) -> dict:
    for r in RESTAURANTS:
        if r["id"] == rid:
            return r
    raise KeyError(rid)
