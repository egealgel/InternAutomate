import sqlite3
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from config import DATABASE_PATH
from database.models import CREATE_JOBS_TABLE, CREATE_INDEXES


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_db() as conn:
        conn.execute(CREATE_JOBS_TABLE)
        for stmt in CREATE_INDEXES:
            conn.execute(stmt)
        conn.commit()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def insert_job(job: Dict[str, Any]) -> bool:
    """Returns True if the job was inserted (new), False if it was a duplicate."""
    sql = """
        INSERT OR IGNORE INTO jobs
            (title, company, location, source, url, description,
             date_posted, company_size, keywords, status, deadline, date_found, date_updated)
        VALUES
            (:title, :company, :location, :source, :url, :description,
             :date_posted, :company_size, :keywords, 'New', :deadline, :date_found, :date_updated)
    """
    now = _now()
    job.setdefault("date_found", now)
    job.setdefault("date_updated", now)
    job.setdefault("description", None)
    job.setdefault("date_posted", None)
    job.setdefault("company_size", None)
    job.setdefault("location", None)
    job.setdefault("keywords", None)
    job.setdefault("deadline", None)
    with get_db() as conn:
        cursor = conn.execute(sql, job)
        conn.commit()
        return cursor.rowcount > 0


def get_jobs(
    status: Optional[str] = None,
    source: Optional[str] = None,
    q: Optional[str] = None,
    date_from: Optional[str] = None,
    hide_expired: bool = True,
    page: int = 1,
    per_page: int = 50,
) -> Dict[str, Any]:
    conditions: List[str] = []
    params: List[Any] = []

    if status:
        conditions.append("status = ?")
        params.append(status)
    if source:
        conditions.append("source = ?")
        params.append(source)
    if q:
        conditions.append("(title LIKE ? OR company LIKE ? OR location LIKE ?)")
        like = f"%{q}%"
        params.extend([like, like, like])
    if date_from:
        conditions.append("date_found >= ?")
        params.append(date_from)
    if hide_expired:
        today = datetime.now(timezone.utc).date().isoformat()
        # deadline varsa ve geçmişse gizle
        # deadline yoksa linkedin için 60 günden eski ilanları gizle
        conditions.append(
            "(deadline >= ? "
            " OR (deadline IS NULL AND (source != 'linkedin' OR date_posted IS NULL OR date_posted >= date(?, '-60 days')))"
            ")"
        )
        params.extend([today, today])

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    count_sql = f"SELECT COUNT(*) FROM jobs {where}"
    data_sql = f"""
        SELECT * FROM jobs {where}
        ORDER BY date_found DESC
        LIMIT ? OFFSET ?
    """
    offset = (page - 1) * per_page

    with get_db() as conn:
        total = conn.execute(count_sql, params).fetchone()[0]
        rows = conn.execute(data_sql, params + [per_page, offset]).fetchall()

    return {
        "jobs": [dict(r) for r in rows],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": max(1, (total + per_page - 1) // per_page),
    }


def get_job(job_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    return dict(row) if row else None


def update_status(job_id: int, status: str) -> None:
    with get_db() as conn:
        conn.execute(
            "UPDATE jobs SET status = ?, date_updated = ? WHERE id = ?",
            (status, _now(), job_id),
        )
        conn.commit()


def update_notes(job_id: int, notes: str) -> None:
    with get_db() as conn:
        conn.execute(
            "UPDATE jobs SET notes = ?, date_updated = ? WHERE id = ?",
            (notes, _now(), job_id),
        )
        conn.commit()


def delete_job(job_id: int) -> None:
    with get_db() as conn:
        conn.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
        conn.commit()


def get_status_counts(
    source: Optional[str] = None,
    q: Optional[str] = None,
    date_from: Optional[str] = None,
    hide_expired: bool = True,
) -> Dict[str, int]:
    conditions: List[str] = []
    params: List[Any] = []
    if source:
        conditions.append("source = ?")
        params.append(source)
    if q:
        conditions.append("(title LIKE ? OR company LIKE ? OR location LIKE ?)")
        like = f"%{q}%"
        params.extend([like, like, like])
    if date_from:
        conditions.append("date_found >= ?")
        params.append(date_from)
    if hide_expired:
        today = datetime.now(timezone.utc).date().isoformat()
        conditions.append(
            "(deadline >= ? "
            " OR (deadline IS NULL AND (source != 'linkedin' OR date_posted IS NULL OR date_posted >= date(?, '-60 days')))"
            ")"
        )
        params.extend([today, today])
    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    with get_db() as conn:
        rows = conn.execute(
            f"SELECT status, COUNT(*) as cnt FROM jobs {where} GROUP BY status", params
        ).fetchall()
    return {r["status"]: r["cnt"] for r in rows}


def get_all_jobs_for_export(
    status: Optional[str] = None,
    source: Optional[str] = None,
) -> List[Dict[str, Any]]:
    conditions: List[str] = []
    params: List[Any] = []
    if status:
        conditions.append("status = ?")
        params.append(status)
    if source:
        conditions.append("source = ?")
        params.append(source)
    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    with get_db() as conn:
        rows = conn.execute(
            f"SELECT * FROM jobs {where} ORDER BY date_found DESC", params
        ).fetchall()
    return [dict(r) for r in rows]
