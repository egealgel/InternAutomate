CREATE_JOBS_TABLE = """
CREATE TABLE IF NOT EXISTS jobs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT NOT NULL,
    company      TEXT NOT NULL,
    location     TEXT,
    source       TEXT NOT NULL,
    url          TEXT NOT NULL UNIQUE,
    description  TEXT,
    date_posted  TEXT,
    company_size TEXT,
    keywords     TEXT,
    status       TEXT NOT NULL DEFAULT 'New',
    notes        TEXT,
    deadline     TEXT,
    date_found   TEXT NOT NULL,
    date_updated TEXT NOT NULL
);
"""

CREATE_INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);",
    "CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);",
    "CREATE INDEX IF NOT EXISTS idx_jobs_date   ON jobs(date_found);",
]
