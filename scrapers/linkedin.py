import time
from typing import List
from urllib.parse import urlencode

import requests
from bs4 import BeautifulSoup

from config import SCRAPE_DELAY
from .base import BaseScraper, JobListing

GUEST_API = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
}

# LinkedIn geoId mapping for common Turkish locations.
# Falls back to Türkiye country-level filter when the city isn't recognized.
GEO_IDS = {
    "türkiye": "102105699",
    "turkey": "102105699",
    "istanbul": "102105699",
    "İstanbul": "102105699",
    "ankara": "102105699",
    "izmir": "102105699",
    "bursa": "102105699",
    "uzaktan": "102105699",
    "remote": "92000000",
}


def _resolve_geo_id(location: str) -> str:
    key = (location or "").strip().lower()
    return GEO_IDS.get(key, "102105699")


class LinkedInScraper(BaseScraper):
    PAGE_SIZE = 25

    def build_url(self, page: int) -> str:
        params = {
            "keywords": self.keywords,
            "location": self.location or "Türkiye",
            "geoId": _resolve_geo_id(self.location),
            "start": (page - 1) * self.PAGE_SIZE,
        }
        return GUEST_API + "?" + urlencode(params)

    def parse_listings(self, html: str) -> List[JobListing]:
        soup = BeautifulSoup(html, "lxml")
        jobs: List[JobListing] = []

        for card in soup.select("li, div.base-card"):
            title_el = card.select_one(".base-search-card__title")
            if not title_el:
                continue
            title = title_el.get_text(strip=True)

            company_el = card.select_one(".base-search-card__subtitle a, .base-search-card__subtitle")
            company = company_el.get_text(strip=True) if company_el else "Bilinmiyor"

            location_el = card.select_one(".job-search-card__location")
            location = location_el.get_text(strip=True) if location_el else None

            date_el = card.select_one("time")
            date_posted = date_el.get("datetime") if date_el else None

            link_el = card.select_one("a.base-card__full-link, a.base-search-card__full-link, a")
            href = ""
            if link_el and link_el.get("href"):
                href = link_el["href"].split("?")[0]

            if not href or not title or "/jobs/view/" not in href:
                continue

            jobs.append(
                JobListing(
                    title=title,
                    company=company,
                    url=href,
                    source="linkedin",
                    location=location,
                    date_posted=date_posted,
                )
            )
        return jobs

    def scrape(self) -> List[JobListing]:
        results: List[JobListing] = []
        seen: set = set()

        for page in range(1, self.max_pages + 1):
            url = self.build_url(page)
            try:
                resp = requests.get(url, headers=HEADERS, timeout=15)
                if resp.status_code == 404:
                    break
                resp.raise_for_status()
            except requests.RequestException as exc:
                print(f"[linkedin] page {page} error: {exc}")
                break

            listings = self.parse_listings(resp.text)
            if not listings:
                break

            new_count = 0
            for listing in listings:
                if listing.url not in seen:
                    seen.add(listing.url)
                    results.append(listing)
                    new_count += 1
            if new_count == 0:
                break

            time.sleep(SCRAPE_DELAY)

        return results
