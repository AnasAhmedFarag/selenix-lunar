"""Optional Neon/PostgreSQL saved analyses, scoped by anonymous per-browser random key.

NASA scientific observations remain in the bundled read-only SQLite snapshot.
No cross-browser synchronization or user accounts. DATABASE_URL must be set on Vercel.
"""
from __future__ import annotations
import hashlib
import os
import re
from contextlib import contextmanager
from fastapi import HTTPException

SQL = """CREATE TABLE IF NOT EXISTS sightline_saved_analyses (
  id BIGSERIAL PRIMARY KEY,
  owner_hash TEXT NOT NULL,
  title TEXT NOT NULL,
  site_id TEXT NOT NULL,
  start_date TEXT NOT NULL,
  days INTEGER NOT NULL,
  solar_percent DOUBLE PRECISION NOT NULL,
  earth_percent DOUBLE PRECISION NOT NULL,
  combined_percent DOUBLE PRECISION NOT NULL,
  model_version TEXT NOT NULL,
  source_sha256 TEXT NOT NULL,
  created_at_utc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sightline_analyses_owner_idx ON sightline_saved_analyses(owner_hash, id DESC);
"""

def owner(token):
    if not token or not re.fullmatch(r'[0-9a-f]{64}', token):
        raise HTTPException(400, 'A valid per-browser owner token is required for cloud saves')
    return hashlib.sha256(token.encode()).hexdigest()

@contextmanager
def db():
    url = os.environ.get('DATABASE_URL')
    if not url:
        raise HTTPException(503, 'Cloud saves require a PostgreSQL DATABASE_URL; NASA analysis still works')
    try:
        import psycopg
        from psycopg.rows import dict_row
        conn = psycopg.connect(url, row_factory=dict_row, connect_timeout=8, autocommit=True)
    except Exception as exc:
        raise HTTPException(503, 'Unable to connect to the cloud database') from exc
    try:
        with conn.cursor() as cur:
            cur.execute(SQL)
        yield conn
    finally:
        conn.close()

def clean(row):
    if row is None: return None
    from database import SITES
    d = dict(row)
    d.pop('owner_hash', None)
    d['site_name'] = SITES[d['site_id']]['name']
    return d

def saved_list(token):
    identity=owner(token)
    with db() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM sightline_saved_analyses WHERE owner_hash=%s ORDER BY id DESC LIMIT 200',(identity,))
            return [clean(r) for r in cur.fetchall()]

def saved_get(record_id, token):
    identity=owner(token)
    with db() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM sightline_saved_analyses WHERE id=%s AND owner_hash=%s',(record_id,identity))
            return clean(cur.fetchone())

def saved_add(title, site_id, start_date, days, solar, earth, joint, token):
    from database import MODEL_VERSION, fingerprint
    identity=owner(token)
    with db() as conn:
        with conn.cursor() as cur:
            cur.execute("""INSERT INTO sightline_saved_analyses
              (owner_hash,title,site_id,start_date,days,solar_percent,earth_percent,combined_percent,model_version,source_sha256,created_at_utc)
              VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')) RETURNING *""",
              (identity,title,site_id,start_date,days,solar,earth,joint,MODEL_VERSION,fingerprint()))
            return clean(cur.fetchone())

def saved_delete(record_id, token):
    identity=owner(token)
    with db() as conn:
        with conn.cursor() as cur:
            cur.execute('DELETE FROM sightline_saved_analyses WHERE id=%s AND owner_hash=%s RETURNING id',(record_id,identity))
            return cur.fetchone() is not None
