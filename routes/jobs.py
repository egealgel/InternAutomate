import csv
import io
from datetime import datetime, timedelta, timezone

from flask import (
    Blueprint,
    abort,
    jsonify,
    redirect,
    render_template,
    request,
    Response,
    url_for,
)

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

bp = Blueprint("jobs", __name__)


def _date_from_filter(date_filter: str | None) -> str | None:
    if not date_filter:
        return None
    days_map = {"1d": 1, "3d": 3, "7d": 7, "30d": 30}
    days = days_map.get(date_filter)
    if days is None:
        return None
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    return cutoff.isoformat()


@bp.route("/")
def index():
    status = request.args.get("status") or None
    source = request.args.get("source") or None
    q = request.args.get("q") or None
    date_filter = request.args.get("date_filter") or None
    page = max(1, int(request.args.get("page", 1)))

    date_from = _date_from_filter(date_filter)

    result = get_jobs(
        status=status,
        source=source,
        q=q,
        date_from=date_from,
        page=page,
    )
    status_counts = get_status_counts()

    return render_template(
        "index.html",
        jobs=result["jobs"],
        total=result["total"],
        page=result["page"],
        pages=result["pages"],
        status_counts=status_counts,
        statuses=STATUSES,
        status_colors=STATUS_COLORS,
        source_colors=SOURCE_COLORS,
        current_status=status,
        current_source=source,
        current_q=q or "",
        current_date_filter=date_filter or "",
    )


@bp.route("/jobs/<int:job_id>")
def job_detail(job_id: int):
    job = get_job(job_id)
    if not job:
        abort(404)
    return render_template(
        "job_detail.html",
        job=job,
        statuses=STATUSES,
        status_colors=STATUS_COLORS,
        source_colors=SOURCE_COLORS,
    )


@bp.route("/jobs/<int:job_id>/status", methods=["POST"])
def update_job_status(job_id: int):
    new_status = request.form.get("status")
    if new_status not in STATUSES:
        abort(400)
    update_status(job_id, new_status)
    return redirect(url_for("jobs.job_detail", job_id=job_id))


@bp.route("/jobs/<int:job_id>/notes", methods=["POST"])
def update_job_notes(job_id: int):
    notes = request.form.get("notes", "")
    update_notes(job_id, notes)
    return redirect(url_for("jobs.job_detail", job_id=job_id))


@bp.route("/jobs/<int:job_id>/delete", methods=["POST"])
def delete_job_route(job_id: int):
    delete_job(job_id)
    return jsonify({"ok": True})


@bp.route("/export")
def export_csv():
    status = request.args.get("status") or None
    source = request.args.get("source") or None
    jobs = get_all_jobs_for_export(status=status, source=source)

    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=[
            "id", "title", "company", "location", "source", "url",
            "date_posted", "company_size", "status", "notes", "date_found",
        ],
    )
    writer.writeheader()
    for job in jobs:
        writer.writerow({k: job.get(k, "") for k in writer.fieldnames})

    filename = f"staj_ilanlari_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
