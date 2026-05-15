import re
import time
from typing import List
from urllib.parse import urlencode

import requests
from bs4 import BeautifulSoup

from config import SCRAPE_DELAY
from .base import BaseScraper, JobListing

BASE = "https://youthall.com"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "tr-TR,tr;q=0.9",
}

JOB_URL_RE = re.compile(r"youthall\.com/tr/[^/]+/[^/]+-?\d+/?$")


class YouthallScraper(BaseScraper):
    def build_url(self, page: int) -> str:
        params: dict = {"query": self.keywords}
        if page > 1:
            params["page"] = page
        return f"{BASE}/tr/jobs/?{urlencode(params)}"

    def parse_listings(self, html: str) -> List[JobListing]:
        soup = BeautifulSoup(html, "lxml")
        jobs: List[JobListing] = []

        for card in soup.select("div.jobs"):
            link_el = card.find("a", href=True)
            if not link_el:
                continue
            href = link_el["href"]
            if not href.startswith("http"):
                href = BASE + href
            if not JOB_URL_RE.search(href):
                continue

            title_el = card.select_one("h5")
            title = title_el.get_text(strip=True) if title_el else None
            if not title:
                continue

            logo = card.select_one("img.jobs-content-logo")
            company = logo.get("alt", "").replace(" logo", "") if logo else "Bilinmiyor"

            location = None
            deadline_raw = None
            for tag in card.select(".jobs-tag"):
                icon = tag.find("i")
                if not icon:
                    continue
                icon_cls = " ".join(icon.get("class", []))
                text = tag.get_text(strip=True)
                if "map-marker" in icon_cls:
                    location = text
                elif "clock" in icon_cls:
                    deadline_raw = text  # format: DD.MM.YYYY

            # DD.MM.YYYY → YYYY-MM-DD
            deadline = None
            if deadline_raw and len(deadline_raw) == 10 and deadline_raw[2] == ".":
                parts = deadline_raw.split(".")
                deadline = f"{parts[2]}-{parts[1]}-{parts[0]}"

            desc_el = card.select_one(".jobs-content-desc")
            description = desc_el.get_text(strip=True) if desc_el else None

            jobs.append(
                JobListing(
                    title=title,
                    company=company,
                    url=href,
                    source="youthall",
                    location=location,
                    description=description,
                    deadline=deadline,
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
                print(f"[youthall] page {page} error: {exc}")
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
