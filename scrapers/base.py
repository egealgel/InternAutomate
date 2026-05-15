from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class JobListing:
    title: str
    company: str
    url: str
    source: str
    location: Optional[str] = None
    description: Optional[str] = None
    date_posted: Optional[str] = None
    company_size: Optional[str] = None


class BaseScraper(ABC):
    def __init__(self, keywords: str, location: str, max_pages: int = 3):
        self.keywords = keywords
        self.location = location
        self.max_pages = max_pages
        self.results: List[JobListing] = []

    @abstractmethod
    def build_url(self, page: int) -> str:
        ...

    @abstractmethod
    def parse_listings(self, content) -> List[JobListing]:
        ...

    @abstractmethod
    def scrape(self) -> List[JobListing]:
        ...
