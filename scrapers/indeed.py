import time
from typing import List
from urllib.parse import urlencode, urljoin

import requests
from bs4 import BeautifulSoup

from config import SCRAPE_DELAY
from .base import BaseScraper, JobListing

BASE_URL = "https://tr.indeed.com/jobs"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


class IndeedScraper(BaseScraper):
    def build_url(self, page: int) -> str:
        params = {
            "q": self.keywords,
            "l": self.location,
            "start": (page - 1) * 10,
        }
        return BASE_URL + "?" + urlencode(params)

    def parse_listings(self, html: str) -> List[JobListing]:
        soup = BeautifulSoup(html, "lxml")
        jobs: List[JobListing] = []

        for card in soup.select("div.job_seen_beacon, li.css-5lfssm"):
            title_el = card.select_one("h2.jobTitle a span[title], h2.jobTitle a")
            if not title_el:
                continue
            title = title_el.get("title") or title_el.get_text(strip=True)

            link_el = card.select_one("h2.jobTitle a")
            href = link_el.get("href", "") if link_el else ""
            if href and not href.startswith("http"):
                href = urljoin("https://tr.indeed.com", href)

            company_el = card.select_one(
                'span[data-testid="company-name"], .companyName'
            )
            company = company_el.get_text(strip=True) if company_el else "Bilinmiyor"

            location_el = card.select_one(
                'div[data-testid="text-location"], .companyLocation'
            )
            location = location_el.get_text(strip=True) if location_el else None

            date_el = card.select_one(
                'span[data-testid="myJobsStateDate"], .date'
            )
            date_posted = date_el.get_text(strip=True) if date_el else None

            if not href or not title:
                continue

            jobs.append(
                JobListing(
                    title=title,
                    company=company,
                    url=href,
                    source="indeed",
                    location=location,
                    date_posted=date_posted,
                )
            )
        return jobs

    def scrape(self) -> List[JobListing]:
        results: List[JobListing] = []
        seen_urls: set = set()

        for page in range(1, self.max_pages + 1):
            url = self.build_url(page)
            try:
                resp = requests.get(url, headers=HEADERS, timeout=15)
                resp.raise_for_status()
            except requests.RequestException as exc:
                print(f"[indeed] page {page} error: {exc}")
                break

            listings = self.parse_listings(resp.text)
            if not listings:
                break

            for listing in listings:
                if listing.url not in seen_urls:
                    seen_urls.add(listing.url)
                    results.append(listing)

            time.sleep(SCRAPE_DELAY)

        return results
