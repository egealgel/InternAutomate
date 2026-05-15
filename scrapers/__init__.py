from typing import List
from .base import JobListing
from .kariyer import KariyerScraper
from .indeed import IndeedScraper
from .linkedin import LinkedInScraper
from .youthall import YouthallScraper
from .pythiango import PythiangoScraper


def run_all_scrapers(
    keywords: str,
    location: str,
    sources: List[str],
    max_pages: int = 3,
) -> List[JobListing]:
    scraper_map = {
        "kariyer": KariyerScraper,
        "indeed": IndeedScraper,
        "linkedin": LinkedInScraper,
        "youthall": YouthallScraper,
        "pythiango": PythiangoScraper,
    }
    results: List[JobListing] = []
    for source in sources:
        cls = scraper_map.get(source)
        if cls is None:
            continue
        scraper = cls(keywords=keywords, location=location, max_pages=max_pages)
        try:
            results.extend(scraper.scrape())
        except Exception as exc:
            print(f"[{source}] scraper error: {exc}")
    return results
