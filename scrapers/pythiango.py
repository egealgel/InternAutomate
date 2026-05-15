import time
from typing import List

import requests
from bs4 import BeautifulSoup

from config import SCRAPE_DELAY
from .base import BaseScraper, JobListing

LISTINGS_URL = "https://www.pythiango.com/ilanlar/"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "tr-TR,tr;q=0.9",
}


class PythiangoScraper(BaseScraper):
    def build_url(self, page: int) -> str:
        # All listings are on a single Elementor page — pagination not supported
        return LISTINGS_URL

    def parse_listings(self, html: str) -> List[JobListing]:
        soup = BeautifulSoup(html, "lxml")
        jobs: List[JobListing] = []

        for card in soup.find_all(
            "div", class_=lambda x: x and "e-child" in x and "e-flex" in x
        ):
            # Only process cards where a heading widget is a DIRECT child
            child_classes = [
                " ".join(c.get("class", []))
                for c in card.children
                if hasattr(c, "get")
            ]
            if not any("elementor-widget-heading" in cls for cls in child_classes):
                continue

            h4 = card.find("h4", class_="elementor-heading-title")
            if not h4:
                continue
            title = h4.get_text(strip=True)
            if not title or len(title) < 3:
                continue

            # Keywords filter (case-insensitive)
            if self.keywords:
                kw = self.keywords.lower()
                if kw not in title.lower():
                    # Looser match: check if any keyword token is in title or company
                    tokens = kw.split()
                    if not any(t in title.lower() for t in tokens):
                        # Still include if no keywords given
                        pass

            paras: List[str] = []
            btn_url = LISTINGS_URL
            for child in card.children:
                if not hasattr(child, "get"):
                    continue
                cls = " ".join(child.get("class", []))
                if "elementor-widget-text-editor" in cls:
                    p = child.find("p")
                    if p:
                        paras.append(p.get_text(strip=True))
                elif "elementor-widget-button" in cls:
                    a = child.find("a", href=True)
                    if a and "panel.pythiango" not in a["href"] and "sign-in" not in a["href"]:
                        btn_url = a["href"]

            company = paras[0] if paras else "Bilinmiyor"
            description = paras[1] if len(paras) > 1 else None

            # Build a stable dedup URL from title + company slug
            slug = (title + company).lower().replace(" ", "-")[:60]
            url = btn_url if btn_url != LISTINGS_URL else f"{LISTINGS_URL}#{slug}"

            jobs.append(
                JobListing(
                    title=title,
                    company=company,
                    url=url,
                    source="pythiango",
                    description=description,
                )
            )
        return jobs

    def scrape(self) -> List[JobListing]:
        try:
            resp = requests.get(LISTINGS_URL, headers=HEADERS, timeout=15)
            resp.raise_for_status()
        except requests.RequestException as exc:
            print(f"[pythiango] error: {exc}")
            return []

        return self.parse_listings(resp.text)
