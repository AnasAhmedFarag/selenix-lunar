"""SIGHTLINE lunar site visibility API (2028 data-backed research prototype).

Data: user-provided JPL Horizons apparent Sun and Earth azimuth/elevation
from four Moon-centered topocentric observers, plus user-provided LOLA-derived
local 10-km terrain horizon masks sampled at 10-degree azimuth intervals.
Sun, Earth, and joint visibility are sampled hourly, NOT flight-qualified.
No mission suitability score is calculated: mission constraints and weights
have not been specified. No claim of reliable relay communications is made.
"""
import math
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path
from typing import Annotated
from pydantic import BaseModel, Field
try:
    from . import database
except ImportError:
    import database

from fastapi import FastAPI, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware

SITE_META = {
    key: {"name": site["name"], "lat": site["lat"], "lon": site["lon"],
          "imagePosition": site["image_position"]}
    for key, site in database.SITES.items()
}


app = FastAPI(title="SIGHTLINE Sun + Earth lunar visibility", version="0.5.0")
app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:8443", "http://127.0.0.1:8443", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST", "DELETE"], allow_headers=["*"])


@lru_cache(maxsize=1)
def load_data():
    """Read imported observation/horizon data from SQLite, NEVER source CSVs."""
    return database.read_data()


class SaveAnalysisRequest(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    siteId: str = Field(min_length=1, max_length=30)
    startDate: str = Field(pattern=r'^2028-\d{2}-\d{2}$')
    days: int = Field(ge=1, le=7)


def validate_period(start: datetime, days: int) -> datetime:
    start = start.replace(tzinfo=timezone.utc) if start.tzinfo is None else start.astimezone(timezone.utc)
    if (start.year != 2028 or not 1 <= start.day <= 7 or start.hour or start.minute
            or start.second or start.microsecond or start.day + days > 8):
        raise HTTPException(status_code=422, detail="Sun and Earth samples cover the first seven days of each month in 2028, 00:00–23:00 UTC. Choose a range within those dates.")
    return start


def horizon_at(azimuth, angles):
    """Interpolate local horizon from 10° angular bins, wrapping 350° → 0°."""
    pos = (azimuth % 360.0) / 10.0
    left = math.floor(pos)
    delta = pos - left
    return angles[left % 36] * (1 - delta) + angles[(left + 1) % 36] * delta


def percent(flags):
    return round(100 * sum(flags) / len(flags), 1) if flags else 0.0


def longest_run(flags):
    best = current = start = best_start = 0
    for i, value in enumerate(flags):
        if value:
            if not current:
                start = i
            current += 1
            if current > best:
                best, best_start = current, start
        else:
            current = 0
    return best, best_start if best else None


def duration(hours):
    return f"{hours:02d}h 00m"


def positive_elevation_summary(points, label, flag):
    values = [p[label] for p in points if p[flag]]
    return (round(sum(values)/len(values), 2), round(max(values), 2)) if values else (None, None)


@app.get("/api/health")
def health():
    db_info = database.dataset_info()
    return {"ok": True, "storage": "SQLite NASA snapshot" if database.CLOUD_MODE else "SQLite", "model": database.MODEL_VERSION,
            "recordsPerSite": db_info["counts"]["observations"] // len(SITE_META),
            "earthRecordsPerSite": db_info["counts"]["observations"] // len(SITE_META),
            "earthVisibilityAvailable": True,
            "windows": "first 7 days of each 2028 month"}


@app.get("/api/database/status")
def database_status():
    return database.dataset_info()


@app.get("/api/sites")
def sites():
    return [{"id": key, "name": site["name"], "lat": site["lat"], "lon": site["lon"]} for key, site in SITE_META.items()]


@app.get("/api/available-periods")
def available_periods():
    return {"year": 2028, "dates": [f"2028-{m:02d}-01" for m in range(1, 13)],
            "daysPerPeriod": 7, "timezone": "UTC"}


@app.get("/api/compare")
def compare(start: datetime = Query(default=datetime(2028, 1, 1, tzinfo=timezone.utc)),
            days: int = Query(default=7, ge=1, le=7),
            step_hours: int = Query(default=1, ge=1, le=6)):
    start = validate_period(start, days)
    cache_key = f"{start:%Y-%m-%d}|{days}|{step_hours}"
    cached = database.read_cached(cache_key)
    if cached is not None:
        return cached

    sun, earth, horizons = load_data()
    samples = [start + timedelta(hours=h) for h in range(0, days * 24, step_hours)]
    results = []
    for key, site in SITE_META.items():
        points, sun_flags, earth_flags, joint_flags = [], [], [], []
        horizon = horizons[key]
        for timestamp in samples:
            if timestamp not in sun[key] or timestamp not in earth[key]:
                raise HTTPException(status_code=422, detail=f"Missing observer sample {timestamp.isoformat()} for {site['name']}")
            sun_el, sun_az = sun[key][timestamp]
            earth_el, earth_az = earth[key][timestamp]
            sun_horizon = horizon_at(sun_az, horizon)
            earth_horizon = horizon_at(earth_az, horizon)
            sun_visible = sun_el > sun_horizon
            earth_visible = earth_el > earth_horizon
            both_visible = sun_visible and earth_visible
            sun_flags.append(sun_visible)
            earth_flags.append(earth_visible)
            joint_flags.append(both_visible)
            points.append({
                "time": timestamp.isoformat().replace("+00:00", "Z"),
                "solarElevation": round(sun_el, 3), "sunAzimuth": round(sun_az, 3),
                "terrainHorizon": round(sun_horizon, 3),
                "earthElevation": round(earth_el, 3), "earthAzimuth": round(earth_az, 3),
                "earthTerrainHorizon": round(earth_horizon, 3),
                "solarVisible": sun_visible, "earthVisible": earth_visible,
                "combinedVisible": both_visible,
            })
        sun_long, _ = longest_run(sun_flags)
        earth_long, _ = longest_run(earth_flags)
        joint_long, joint_start = longest_run(joint_flags)
        sun_avg, sun_max = positive_elevation_summary(points, "solarElevation", "solarVisible")
        earth_avg, earth_max = positive_elevation_summary(points, "earthElevation", "earthVisible")
        joint_start_stamp = points[joint_start]["time"] if joint_start is not None else None
        results.append({
            "id": key, "name": site["name"],
            "coords": f'{abs(site["lat"]):.4f}° S · {abs(site["lon"]):.4f}° {"E" if site["lon"] >= 0 else "W"}',
            "imagePosition": site["imagePosition"], "score": None,
            "horizonProfile": horizon,
            "status": "Sun + Earth line-of-sight estimates",
            "solar": percent(sun_flags), "earth": percent(earth_flags), "combined": percent(joint_flags),
            "horizon": "LOLA local 10 km terrain horizon", "obstruction": round(max(horizon), 2),
            "solarWindow": duration(sun_long * step_hours),
            "earthWindow": duration(earth_long * step_hours),
            "operationalWindow": duration(joint_long * step_hours),
            "jointWindowStart": joint_start_stamp,
            "solarAverageElevation": sun_avg, "solarMaximumElevation": sun_max,
            "earthAverageElevation": earth_avg, "earthMaximumElevation": earth_max,
            "points": points,
        })

    result = {
        "start": start.isoformat().replace("+00:00", "Z"), "days": days,
        "stepHours": step_hours,
        "model": database.MODEL_VERSION,
        "disclaimer": "Data from supplied JPL Horizons airless apparent Sun/Earth angles and NASA GSFC LOLA-derived local terrain horizon (10-km maximum rays, 10-degree azimuth bins). Hourly sample-based estimates; finite local-horizon extent and DEM coverage limit confidence. Earth line of sight does not verify an RF link budget, antenna pointing, or reliable communications. Simultaneous Sun+Earth visibility is not a mission suitability score. Only days 1–7 of each month in 2028 are sampled.",
        "earthDataAvailable": True,
        "sites": results,
    }
    database.write_cached(cache_key, result)
    return result


@app.get("/api/saved-analyses")
def list_saved_analyses(x_sightline_owner_token: str | None = Header(default=None)):
    return {"items": database.saved_list(x_sightline_owner_token)}


@app.get("/api/saved-analyses/{record_id}")
def get_saved_analysis(record_id: int, x_sightline_owner_token: str | None = Header(default=None)):
    saved = database.saved_get(record_id, x_sightline_owner_token)
    if saved is None:
        raise HTTPException(status_code=404, detail="Saved analysis not found")
    return saved


@app.post("/api/saved-analyses", status_code=201)
def save_analysis(payload: SaveAnalysisRequest, x_sightline_owner_token: str | None = Header(default=None)):
    if payload.siteId not in SITE_META:
        raise HTTPException(status_code=422, detail="Unknown lunar site")
    try:
        start = datetime.strptime(payload.startDate, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid start date")
    validate_period(start, payload.days)
    response = compare(start=start, days=payload.days, step_hours=1)
    site = next(s for s in response["sites"] if s["id"] == payload.siteId)
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="Title must not be blank")
    return database.saved_add(title, payload.siteId, payload.startDate, payload.days,
                              site["solar"], site["earth"], site["combined"], x_sightline_owner_token)


@app.delete("/api/saved-analyses/{record_id}")
def delete_saved_analysis(record_id: int, x_sightline_owner_token: str | None = Header(default=None)):
    if not database.saved_delete(record_id, x_sightline_owner_token):
        raise HTTPException(status_code=404, detail="Saved analysis not found")
    return {"deleted": True, "id": record_id}
