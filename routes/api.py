import csv
import io
from datetime import datetime, timedelta, timezone

from flask import Blueprint, abort, jsonify, request, Response

from config import STATUSES, STATUS_COLORS, SOURCE_COLORS
from database.db import (
    delete_job,
    get_all_jobs_for_export,
    get_job,
    get_jobs,
    get_status_counts,
    update_notes,
    update_status,
)

bp = Blueprint("api", __name__, url_prefix="/api")


def _date_from_filter(date_filter: str | None) -> str | None:
    days_map = {"1d": 1, "3d": 3, "7d": 7, "30d": 30}
    days = days_map.get(date_filter or "")
    if days is None:
        return None
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()


@bp.route("/jobs")
def jobs_list():
    result = get_jobs(
        status=request.args.get("status") or None,
        source=request.args.get("source") or None,
        q=request.args.get("q") or None,
        date_from=_date_from_filter(request.args.get("date_filter")),
        page=max(1, int(request.args.get("page", 1))),
        per_page=int(request.args.get("per_page", 50)),
    )
    result["status_counts"] = get_status_counts(
        source=request.args.get("source") or None,
        q=request.args.get("q") or None,
        date_from=_date_from_filter(request.args.get("date_filter")),
    )
    result["statuses"] = STATUSES
    return jsonify(result)


@bp.route("/jobs/<int:job_id>")
def job_detail(job_id: int):
    job = get_job(job_id)
    if not job:
        abort(404)
    return jsonify(job)


@bp.route("/jobs/<int:job_id>/status", methods=["PATCH"])
def update_job_status(job_id: int):
    data = request.get_json(force=True)
    new_status = data.get("status")
    if new_status not in STATUSES:
        return jsonify({"error": "Geçersiz durum"}), 400
    update_status(job_id, new_status)
    return jsonify({"ok": True})


@bp.route("/jobs/<int:job_id>/notes", methods=["PATCH"])
def update_job_notes(job_id: int):
    data = request.get_json(force=True)
    update_notes(job_id, data.get("notes", ""))
    return jsonify({"ok": True})


@bp.route("/jobs/<int:job_id>", methods=["DELETE"])
def delete_job_route(job_id: int):
    delete_job(job_id)
    return jsonify({"ok": True})


@bp.route("/export")
def export_csv():
    jobs = get_all_jobs_for_export(
        status=request.args.get("status") or None,
        source=request.args.get("source") or None,
    )
    output = io.StringIO()
    fields = ["id", "title", "company", "location", "source", "url",
              "date_posted", "company_size", "status", "notes", "date_found"]
    writer = csv.DictWriter(output, fieldnames=fields)
    writer.writeheader()
    for job in jobs:
        writer.writerow({k: job.get(k, "") for k in fields})
    filename = f"staj_ilanlari_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@bp.route("/scrape/run", methods=["POST"])
def scrape_run():
    from config import DEFAULT_KEYWORDS, DEFAULT_LOCATION, DEFAULT_MAX_PAGES
    from database.db import insert_job
    from scrapers import run_all_scrapers

    ALL_SOURCES = ["linkedin", "youthall", "pythiango", "kariyer", "indeed"]
    data = request.get_json(force=True)

    keywords = (data.get("keywords") or DEFAULT_KEYWORDS).strip()
    location = (data.get("location") or DEFAULT_LOCATION).strip()
    sources = [s for s in (data.get("sources") or ALL_SOURCES) if s in ALL_SOURCES]
    max_pages = max(1, min(10, int(data.get("max_pages", DEFAULT_MAX_PAGES))))

    if not sources:
        return jsonify({"error": "En az bir kaynak seçmelisin."}), 400

    listings = run_all_scrapers(keywords=keywords, location=location,
                                sources=sources, max_pages=max_pages)
    added = skipped = 0
    errors = []

    for listing in listings:
        try:
            inserted = insert_job({
                "title": listing.title, "company": listing.company,
                "location": listing.location, "source": listing.source,
                "url": listing.url, "description": listing.description,
                "date_posted": listing.date_posted, "company_size": listing.company_size,
                "keywords": keywords,
            })
            if inserted:
                added += 1
            else:
                skipped += 1
        except Exception as exc:
            errors.append(str(exc))

    return jsonify({"added": added, "skipped": skipped,
                    "total_found": len(listings), "errors": errors[:5]})
