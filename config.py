import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.getenv("DATABASE_PATH", os.path.join(BASE_DIR, "jobs.db"))

DEFAULT_KEYWORDS = os.getenv("DEFAULT_KEYWORDS", "stajyer")
DEFAULT_LOCATION = os.getenv("DEFAULT_LOCATION", "İstanbul")
DEFAULT_MAX_PAGES = int(os.getenv("DEFAULT_MAX_PAGES", "3"))

SCRAPE_DELAY = float(os.getenv("SCRAPE_DELAY", "1.5"))

STATUSES = ["New", "Applied", "Interview", "Rejected", "Offer"]

STATUS_COLORS = {
    "New": "secondary",
    "Applied": "primary",
    "Interview": "warning",
    "Rejected": "danger",
    "Offer": "success",
}

SOURCE_COLORS = {
    "linkedin": "indigo",
    "indeed": "purple",
    "kariyer": "teal",
}
