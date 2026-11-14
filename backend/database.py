"""SIGHTLINE persistent SQLite storage, source CSV importer, and analysis cache.

No external database dependency. Read-only NASA source CSVs are imported once
into backend/storage/sightline.sqlite3. Reimport via `python -m backend.import_data
--force`; keeps previously saved user analyses and invalidates cached results.
"""
from __future__ import annotations

import csv
import hashlib
import json
import math
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'data'
DB_PATH = ROOT / 'storage' / 'sightline.sqlite3'
CLOUD_MODE = bool(os.getenv("VERCEL") or os.getenv("SIGHTLINE_CLOUD"))
SCHEMA_VERSION = 1
MODEL_VERSION = 'JPL_SUN_EARTH_LOLA_LOCAL_HORIZON_SAMPLED_v1'

SITES = {
    'haworth': {'name':'Haworth', 'lat':-86.768, 'lon':-20.514, 'csv':'Haworth', 'image_position':'25% 38%'},
    'malapert': {'name':'Malapert Massif', 'lat':-85.942, 'lon':-0.944, 'csv':'Malapert_Massif', 'image_position':'58% 46%'},
    'nobile': {'name':'Nobile Rim 1', 'lat':-85.295, 'lon':36.917, 'csv':'Nobile_Rim_1', 'image_position':'78% 62%'},
    'gerlache': {'name':'de Gerlache Rim 2', 'lat':-88.389, 'lon':-68.865, 'csv':'de_Gerlache_Rim_2', 'image_position':'42% 72%'},
}

SCHEMA = '''
CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY, value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sites (
    id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE,
    latitude_deg REAL NOT NULL, longitude_deg REAL NOT NULL,
    image_position TEXT NOT NULL,
    CHECK(latitude_deg BETWEEN -90 AND 90),
    CHECK(longitude_deg BETWEEN -180 AND 180)
);
CREATE TABLE IF NOT EXISTS observations (
    site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    timestamp_utc TEXT NOT NULL,
    sun_elevation_deg REAL NOT NULL,
    sun_azimuth_deg REAL NOT NULL,
    sun_distance_au REAL NOT NULL,
    earth_elevation_deg REAL NOT NULL,
    earth_azimuth_deg REAL NOT NULL,
    earth_distance_au REAL NOT NULL,
    PRIMARY KEY (site_id, timestamp_utc)
);
CREATE INDEX IF NOT EXISTS idx_observations_timestamp ON observations(timestamp_utc);
CREATE TABLE IF NOT EXISTS horizon_samples (
    site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    azimuth_deg INTEGER NOT NULL CHECK(azimuth_deg BETWEEN 0 AND 350 AND azimuth_deg % 10 = 0),
    elevation_deg REAL NOT NULL,
    coverage_km REAL NOT NULL,
    PRIMARY KEY (site_id, azimuth_deg)
);
CREATE TABLE IF NOT EXISTS analysis_cache (
    key TEXT PRIMARY KEY,
    source_sha256 TEXT NOT NULL,
    model_version TEXT NOT NULL,
    response_json TEXT NOT NULL,
    cached_at_utc TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS saved_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 120),
    site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
    start_date TEXT NOT NULL,
    days INTEGER NOT NULL CHECK(days BETWEEN 1 AND 7),
    solar_percent REAL NOT NULL,
    earth_percent REAL NOT NULL,
    combined_percent REAL NOT NULL,
    model_version TEXT NOT NULL,
    source_sha256 TEXT NOT NULL,
    created_at_utc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_saved_analyses_created_at ON saved_analyses(created_at_utc DESC);
'''


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')


@contextmanager
def connection(db_path: Path = DB_PATH) -> Iterator[sqlite3.Connection]:
    if CLOUD_MODE and db_path == DB_PATH:
        db = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True, timeout=20)
    else:
        db_path.parent.mkdir(parents=True, exist_ok=True)
        db = sqlite3.connect(db_path, timeout=20)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA foreign_keys = ON')
    db.execute('PRAGMA busy_timeout = 20000')
    try:
        yield db
        db.commit()
    except BaseException:
        db.rollback()
        raise
    finally:
        db.close()


def source_files() -> list[Path]:
    return [DATA / 'Horizon_Masks.csv'] + [
        DATA / f'{site["csv"]}_2028_{suffix}ephemeris.csv'
        for site in SITES.values() for suffix in ('', 'earth_')
    ]


def fingerprint() -> str:
    digest = hashlib.sha256()
    for source in source_files():
        digest.update(source.name.encode('utf-8'))
        with source.open('rb') as file:
            for block in iter(lambda: file.read(256*1024), b''):
                digest.update(block)
    return digest.hexdigest()


def _read_ephemeris(source: Path, prefix: str) -> dict[str, tuple[float, float, float]]:
    with source.open(encoding='utf-8-sig', newline='') as file:
        reader = csv.DictReader(file)
        rows: dict[str, tuple[float, float, float]] = {}
        for row in reader:
            stamp = datetime.strptime(row['Timestamp_UTC'], '%Y-%m-%d %H:%M:%S UTC')
            if not (stamp.year == 2028 and 1 <= stamp.day <= 7 and stamp.minute == stamp.second == 0):
                raise ValueError(f'Outside supported time grid in {source.name}: {stamp}')
            key = stamp.strftime('%Y-%m-%dT%H:%M:%SZ')
            if key in rows:
                raise ValueError(f'Duplicate timestamp in {source.name}: {key}')
            values = (
                float(row[f'{prefix}_Elevation_deg']),
                float(row[f'{prefix}_Azimuth_deg']),
                float(row['Sun_Moon_Distance_AU'] if prefix == 'Sun' else row['Earth_Distance_AU']),
            )
            if not all(math.isfinite(v) for v in values):
                raise ValueError(f'Non-finite value in {source.name} at {key}')
            rows[key] = values
    if len(rows) != 2016:
        raise ValueError(f'{source.name}: expected 2016 observations, got {len(rows)}')
    return rows


def import_sources(db_path: Path = DB_PATH, force: bool = False) -> dict:
    """Atomically validate all input files and replace source data, not user saves."""
    sha = fingerprint()
    with connection(db_path) as db:
        db.executescript(SCHEMA)
        previous = db.execute("SELECT value FROM metadata WHERE key='source_sha256'").fetchone()
        count = db.execute('SELECT COUNT(*) FROM observations').fetchone()[0]
        if not force and previous and previous['value'] == sha and count == 8064:
            return {'imported': False, 'observations': count, 'sha256': sha}
        if not force and previous and previous['value'] != sha:
            raise RuntimeError('Source CSVs changed. Back up your database, then explicitly run: python -m backend.import_data --force')
        with (DATA / 'Horizon_Masks.csv').open(encoding='utf-8-sig', newline='') as file:
            horizons = list(csv.DictReader(file))
        if len(horizons) != 36:
            raise ValueError(f'Expected 36 horizon rows, found {len(horizons)}')
        observations = []
        horizon_values = []
        for site_id, site in SITES.items():
            sun = _read_ephemeris(DATA / f'{site["csv"]}_2028_ephemeris.csv', 'Sun')
            earth = _read_ephemeris(DATA / f'{site["csv"]}_2028_earth_ephemeris.csv', 'Earth')
            if sun.keys() != earth.keys():
                raise ValueError(f'Sun/Earth time grids differ for {site_id}')
            observations.extend((site_id, key, *sun[key], *earth[key]) for key in sorted(sun))
            for index, row in enumerate(horizons):
                az = int(float(row['Azimuth_deg_clockwise_from_North']))
                if az != index*10:
                    raise ValueError(f'Invalid horizon bin {az} for {site_id}')
                elevation = float(row[site['name'] + '_horizon_elevation_deg'])
                coverage = float(row[site['name'] + '_DEM_ray_coverage_km'])
                if not all(math.isfinite(v) for v in (elevation, coverage)) or coverage <= 0:
                    raise ValueError(f'Invalid horizon values for {site_id} azimuth {az}')
                horizon_values.append((site_id, az, elevation, coverage))
        # Validate complete monthly 7-day grids before writing anything.
        for site_id in SITES:
            keys = [row[1] for row in observations if row[0] == site_id]
            for month in range(1, 13):
                subset = [stamp for stamp in keys if stamp.startswith(f'2028-{month:02d}-')]
                if len(subset) != 168:
                    raise ValueError(f'{site_id} {month}: expected 168 observations, got {len(subset)}')
        db.execute('BEGIN IMMEDIATE')
        for site_id, site in SITES.items():
            db.execute('INSERT INTO sites(id,name,latitude_deg,longitude_deg,image_position) VALUES (?,?,?,?,?) '
                       'ON CONFLICT(id) DO UPDATE SET name=excluded.name,latitude_deg=excluded.latitude_deg,'
                       'longitude_deg=excluded.longitude_deg,image_position=excluded.image_position',
                       (site_id,site['name'],site['lat'],site['lon'],site['image_position']))
        db.execute('DELETE FROM observations')
        db.execute('DELETE FROM horizon_samples')
        db.executemany('INSERT INTO observations VALUES (?,?,?,?,?,?,?,?)', observations)
        db.executemany('INSERT INTO horizon_samples VALUES (?,?,?,?)', horizon_values)
        db.execute('DELETE FROM analysis_cache')
        for key, value in {
            'source_sha256': sha,
            'imported_at_utc': utc_now(),
            'schema_version': str(SCHEMA_VERSION),
            'source_description': 'Supplied 2028 JPL Horizons Sun/Earth and NASA GSFC LOLA local horizon CSVs',
        }.items():
            db.execute('INSERT OR REPLACE INTO metadata(key,value) VALUES(?,?)', (key,value))
        return {'imported': True, 'observations': len(observations), 'horizons': len(horizon_values), 'sha256': sha}


def ensure_database(db_path: Path = DB_PATH) -> None:
    with connection(db_path) as db:
        if not CLOUD_MODE:
            db.executescript(SCHEMA)
        ready = db.execute("SELECT value FROM metadata WHERE key='source_sha256'").fetchone()
        count = db.execute('SELECT COUNT(*) FROM observations').fetchone()[0]
    if not ready or count != 8064:
        if CLOUD_MODE:
            raise RuntimeError("Bundled NASA read-only dataset is missing or incomplete")
        import_sources(db_path)


def dataset_info(db_path: Path = DB_PATH) -> dict:
    ensure_database(db_path)
    with connection(db_path) as db:
        counts = {t: db.execute(f'SELECT COUNT(*) FROM {t}').fetchone()[0] for t in
                  ('sites','observations','horizon_samples','analysis_cache','saved_analyses')}
        metadata = dict((r['key'],r['value']) for r in db.execute('SELECT key,value FROM metadata'))
        return {'engine':'SQLite','filename':db_path.name,'counts':counts,'sourceSha256': metadata.get('source_sha256'),
                'importedAtUtc':metadata.get('imported_at_utc'),'modelVersion':MODEL_VERSION}


def read_data(db_path: Path = DB_PATH):
    ensure_database(db_path)
    sun,earth,horizons = {},{},{}
    with connection(db_path) as db:
        for site_id in SITES:
            rows = db.execute('SELECT timestamp_utc,sun_elevation_deg,sun_azimuth_deg,earth_elevation_deg,earth_azimuth_deg '
                              'FROM observations WHERE site_id=? ORDER BY timestamp_utc',(site_id,)).fetchall()
            sun[site_id] = {datetime.strptime(r['timestamp_utc'],'%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc):
                            (r['sun_elevation_deg'],r['sun_azimuth_deg']) for r in rows}
            earth[site_id] = {datetime.strptime(r['timestamp_utc'],'%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc):
                              (r['earth_elevation_deg'],r['earth_azimuth_deg']) for r in rows}
            profile=db.execute('SELECT azimuth_deg,elevation_deg FROM horizon_samples WHERE site_id=? ORDER BY azimuth_deg',
                               (site_id,)).fetchall()
            horizons[site_id]=[r['elevation_deg'] for r in profile]
    return sun, earth, horizons


def read_cached(key: str) -> dict | None:
    if CLOUD_MODE:
        return None
    ensure_database()
    with connection() as db:
        row = db.execute('SELECT response_json FROM analysis_cache WHERE key=? AND model_version=? AND '
                         "source_sha256=(SELECT value FROM metadata WHERE key='source_sha256')",
                         (key,MODEL_VERSION)).fetchone()
    return json.loads(row['response_json']) if row else None


def write_cached(key: str, value: dict) -> None:
    if CLOUD_MODE:
        return
    with connection() as db:
        sha=db.execute("SELECT value FROM metadata WHERE key='source_sha256'").fetchone()['value']
        db.execute('INSERT OR REPLACE INTO analysis_cache(key,source_sha256,model_version,response_json,cached_at_utc) '
                   'VALUES(?,?,?,?,?)',(key,sha,MODEL_VERSION,json.dumps(value,ensure_ascii=False,separators=(',',':')),utc_now()))


def saved_list(owner_token: str | None = None) -> list[dict]:
    if CLOUD_MODE:
        from cloud_saved import saved_list as cloud_list
        return cloud_list(owner_token)
    ensure_database()
    with connection() as db:
        records=db.execute('''SELECT a.*,s.name AS site_name FROM saved_analyses a JOIN sites s ON s.id=a.site_id
                              ORDER BY a.created_at_utc DESC, a.id DESC''').fetchall()
    return [dict(record) for record in records]


def saved_get(record_id: int, owner_token: str | None = None) -> dict | None:
    if CLOUD_MODE:
        from cloud_saved import saved_get as cloud_get
        return cloud_get(record_id, owner_token)
    ensure_database()
    with connection() as db:
        record=db.execute('''SELECT a.*,s.name AS site_name FROM saved_analyses a JOIN sites s ON s.id=a.site_id
                             WHERE a.id=?''',(record_id,)).fetchone()
    return dict(record) if record else None


def saved_add(title: str, site_id: str, start_date: str, days: int, solar: float, earth: float, joint: float, owner_token: str | None = None) -> dict:
    if CLOUD_MODE:
        from cloud_saved import saved_add as cloud_add
        return cloud_add(title, site_id, start_date, days, solar, earth, joint, owner_token)
    ensure_database()
    with connection() as db:
        sha=db.execute("SELECT value FROM metadata WHERE key='source_sha256'").fetchone()['value']
        cursor=db.execute('''INSERT INTO saved_analyses
            (title,site_id,start_date,days,solar_percent,earth_percent,combined_percent,model_version,source_sha256,created_at_utc)
            VALUES (?,?,?,?,?,?,?,?,?,?)''',
            (title,site_id,start_date,days,solar,earth,joint,MODEL_VERSION,sha,utc_now()))
        record_id=cursor.lastrowid
    return saved_get(record_id)


def saved_delete(record_id: int, owner_token: str | None = None) -> bool:
    if CLOUD_MODE:
        from cloud_saved import saved_delete as cloud_delete
        return cloud_delete(record_id, owner_token)
    ensure_database()
    with connection() as db:
        return db.execute('DELETE FROM saved_analyses WHERE id=?',(record_id,)).rowcount > 0
