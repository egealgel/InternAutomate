import time
from typing import List
from urllib.parse import quote, urljoin

import requests
from bs4 import BeautifulSoup

from config import SCRAPE_DELAY
from .base import BaseScraper, JobListing

BASE = "https://www.kariyer.net"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
}


def _slugify(text: str) -> str:
    """Turkish-aware slugifier for Kariyer.net URL paths."""
    mapping = str.maketrans({
        "ı": "i", "İ": "i", "ş": "s", "Ş": "s", "ğ": "g", "Ğ": "g",
        "ü": "u", "Ü": "u", "ö": "o", "Ö": "o", "ç": "c", "Ç": "c",
        " ": "-",
    })
    return text.translate(mapping).lower().strip("-")


class KariyerScraper(BaseScraper):
    def build_url(self, page: int) -> str:
        keyword_slug = _slugify(self.keywords) or "stajyer"
        location_slug = _slugify(self.location) if self.location else ""
        path = f"/is-ilanlari/{quote(keyword_slug)}"
        if location_slug:
            path += f"/{quote(location_slug)}"
        if page > 1:
            path += f"?cp={page}"
        return BASE + path

    def parse_listings(self, html: str) -> List[JobListing]:
        soup = BeautifulSoup(html, "lxml")
        jobs: List[JobListing] = []

        for card in soup.select("div.job-list-card-item"):
            title = card.get("positionname")
            location = card.get("cityname")
            date_posted = card.get("time")
            worktype = card.get("worktypetext") or ""
            workmodel = card.get("workmodeltext") or ""

            link_el = card.select_one("a.k-ad-card")
            if not link_el:
                continue
            href = link_el.get("href", "")
            if href and not href.startswith("http"):
                href = urljoin(BASE, href)

            logo = card.select_one('img[data-test="company-image"]')
            company = (logo.get("alt") if logo else None) or "Bilinmiyor"

            extras = " · ".join(filter(None, [worktype, workmodel]))

            if not href or not title:
                continue

            jobs.append(
                JobListing(
                    title=title.strip(),
                    company=company.strip(),
                    url=href,
                    source="kariyer",
                    location=location.strip() if location else None,
                    date_posted=date_posted,
                    description=extras or None,
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
                resp.raise_for_status()
            except requests.RequestException as exc:
                print(f"[kariyer] page {page} error: {exc}")
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
