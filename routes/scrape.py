from flask import Blueprint, jsonify, render_template, request

from config import DEFAULT_KEYWORDS, DEFAULT_LOCATION, DEFAULT_MAX_PAGES
from database.db import insert_job
from scrapers import run_all_scrapers

bp = Blueprint("scrape", __name__)

ALL_SOURCES = ["kariyer", "indeed", "linkedin"]


@bp.route("/scrape")
def scrape_form():
    return render_template(
        "scrape.html",
        default_keywords=DEFAULT_KEYWORDS,
        default_location=DEFAULT_LOCATION,
        default_max_pages=DEFAULT_MAX_PAGES,
        all_sources=ALL_SOURCES,
    )


@bp.route("/scrape/run", methods=["POST"])
def scrape_run():
    keywords = request.form.get("keywords", DEFAULT_KEYWORDS).strip()
    location = request.form.get("location", DEFAULT_LOCATION).strip()
    sources = request.form.getlist("sources") or ALL_SOURCES
    max_pages = max(1, min(10, int(request.form.get("max_pages", DEFAULT_MAX_PAGES))))

    sources = [s for s in sources if s in ALL_SOURCES]
    if not sources:
        return jsonify({"error": "En az bir kaynak seçmelisin."}), 400

    listings = run_all_scrapers(
        keywords=keywords,
        location=location,
        sources=sources,
        max_pages=max_pages,
    )

    added = 0
    skipped = 0
    errors = []

    for listing in listings:
        try:
            inserted = insert_job(
                {
                    "title": listing.title,
                    "company": listing.company,
                    "location": listing.location,
                    "source": listing.source,
                    "url": listing.url,
                    "description": listing.description,
                    "date_posted": listing.date_posted,
                    "company_size": listing.company_size,
                    "keywords": keywords,
                }
            )
            if inserted:
                added += 1
            else:
                skipped += 1
        except Exception as exc:
            errors.append(str(exc))

    return jsonify(
        {
            "added": added,
            "skipped": skipped,
            "total_found": len(listings),
            "errors": errors[:5],
        }
    )
