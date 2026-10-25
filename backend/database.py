"""
PathPilot AI — Unified Database Layer (SQLite + PostgreSQL)
============================================================
Supports PostgreSQL in production (Render / Supabase / Neon)
and SQLite for local development and automated testing.
Uses parameterized queries for 100% SQL injection immunity.
"""

from contextlib import contextmanager
from datetime import datetime
import os
from pathlib import Path
import sqlite3

# Try importing psycopg2 for production PostgreSQL
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False

DEFAULT_DB_FILE = Path(__file__).resolve().parent / "pathpilot.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_FILE.as_posix()}").strip()

# Normalize legacy postgres:// to postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

IS_POSTGRES = DATABASE_URL.startswith("postgresql") and PSYCOPG2_AVAILABLE


def get_raw_connection():
    """Create and return a raw database connection."""
    if IS_POSTGRES:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    else:
        # SQLite
        db_path = DATABASE_URL.replace("sqlite:///", "")
        conn = sqlite3.connect(db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn


@contextmanager
def get_db():
    """
    Context manager that yields an active database connection and cursor helper.
    Automatically commits on normal completion or rolls back on exception.
    """
    conn = get_raw_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def query_all(conn, sql: str, params: tuple = ()) -> list[dict]:
    """Execute a SELECT query and return a list of dictionaries."""
    if IS_POSTGRES:
        pg_sql = sql.replace("?", "%s")
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(pg_sql, params)
            rows = cur.fetchall()
            return [dict(r) for r in rows]
    else:
        cur = conn.cursor()
        cur.execute(sql, params)
        rows = cur.fetchall()
        return [dict(r) for r in rows]


def query_one(conn, sql: str, params: tuple = ()) -> dict | None:
    """Execute a SELECT query and return a single dictionary or None."""
    results = query_all(conn, sql, params)
    return results[0] if results else None


def execute_insert(conn, sql: str, params: tuple = ()) -> int:
    """
    Execute an INSERT statement and return the inserted row ID.
    Works seamlessly across SQLite and PostgreSQL.
    """
    if IS_POSTGRES:
        pg_sql = sql.replace("?", "%s")
        if "RETURNING" not in pg_sql.upper():
            pg_sql = pg_sql.rstrip(";") + " RETURNING id;"
        with conn.cursor() as cur:
            cur.execute(pg_sql, params)
            row_id = cur.fetchone()[0]
            return row_id
    else:
        cur = conn.cursor()
        cur.execute(sql, params)
        return cur.lastrowid


def execute_update(conn, sql: str, params: tuple = ()) -> int:
    """Execute an UPDATE or DELETE statement and return rowcount."""
    if IS_POSTGRES:
        pg_sql = sql.replace("?", "%s")
        with conn.cursor() as cur:
            cur.execute(pg_sql, params)
            return cur.rowcount
    else:
        cur = conn.cursor()
        cur.execute(sql, params)
        return cur.rowcount


def init_db():
    """Initialize all database tables with proper schemas, foreign keys, and indexes."""
    id_type = "SERIAL PRIMARY KEY" if IS_POSTGRES else "INTEGER PRIMARY KEY AUTOINCREMENT"
    bool_type = "BOOLEAN DEFAULT FALSE" if IS_POSTGRES else "INTEGER DEFAULT 0"
    ts_default = "CURRENT_TIMESTAMP"

    schema_sql = f"""
    CREATE TABLE IF NOT EXISTS users (
        id {id_type},
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        hashed_password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT {ts_default},
        updated_at TIMESTAMP DEFAULT {ts_default}
    );

    CREATE TABLE IF NOT EXISTS learning_paths (
        id {id_type},
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        learning_goal TEXT,
        current_level VARCHAR(50),
        target_skill VARCHAR(200) NOT NULL,
        hours_per_week INTEGER DEFAULT 10,
        total_weeks INTEGER DEFAULT 4,
        total_hours INTEGER DEFAULT 40,
        progress_percentage INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT {ts_default},
        updated_at TIMESTAMP DEFAULT {ts_default},
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS modules (
        id {id_type},
        path_id INTEGER NOT NULL,
        week INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        hours INTEGER DEFAULT 5,
        type VARCHAR(50) DEFAULT 'learn',
        resource_id VARCHAR(100),
        resource_title VARCHAR(255),
        resource_url TEXT,
        is_completed {bool_type},
        completed_at TIMESTAMP,
        FOREIGN KEY (path_id) REFERENCES learning_paths(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saved_resources (
        id {id_type},
        user_id INTEGER NOT NULL,
        path_id INTEGER,
        title VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        provider VARCHAR(100),
        resource_type VARCHAR(50),
        description TEXT,
        created_at TIMESTAMP DEFAULT {ts_default},
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (path_id) REFERENCES learning_paths(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS user_activities (
        id {id_type},
        user_id INTEGER NOT NULL,
        path_id INTEGER,
        module_id INTEGER,
        activity_type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        hours_spent INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT {ts_default},
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (path_id) REFERENCES learning_paths(id) ON DELETE SET NULL,
        FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_paths_user ON learning_paths(user_id);
    CREATE INDEX IF NOT EXISTS idx_modules_path ON modules(path_id);
    CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activities(user_id, created_at);
    """

    with get_db() as conn:
        if IS_POSTGRES:
            with conn.cursor() as cur:
                cur.execute(schema_sql)
        else:
            conn.executescript(schema_sql)


# Run schema initialization on module load
try:
    init_db()
except Exception as e:
    print(f"[Database] Warning during init_db: {e}")
