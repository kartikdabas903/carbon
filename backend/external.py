"""
Live data sources: road routing, airports, flight emissions and electricity grids.

Every public function returns None (or leaves values unchanged) on any failure,
missing key or timeout, so callers always fall back to the built-in data.
Results are cached in memory; the airport list is cached on disk.

  OpenRouteService     geocoding, road routes, distance matrix   (OPENROUTESERVICE_API_KEY)
  OurAirports          airport coordinates, public domain        (no key)
  Google TIM           per-flight emissions, as on Google Flights (GOOGLE_TRAVEL_IMPACT_API_KEY)
  Ember                yearly grid intensity by country          (EMBER_API_KEY)
  Electricity Maps     live + last-24h grid intensity, one zone  (ELECTRICITYMAPS_API_KEY, ELECTRICITYMAPS_ZONE)
  CEA                  India's official grid factor (static constant, updated per CEA release)
"""

import csv
import io
import json
import math
import os
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path
from typing import Callable, Optional

TIMEOUT = 8  # seconds per request; a slow service must not stall a prediction
USER_AGENT = "CarbonShift/1.0 (carbon decision engine)"
DATA_DIR = Path(__file__).parent / "data"

# India's official grid factor: CEA CO2 Baseline Database v22.0 (Aug 2026),
# weighted average for FY 2025-26 including renewables, tCO2/MWh = kg/kWh
CEA_INDIA = (0.675, "CEA CO₂ Baseline Database v22 (FY 2025-26)")

# ISO 3166 alpha-2 -> alpha-3 for Ember country codes
ISO3 = {
    "IN": "IND", "US": "USA", "GB": "GBR", "DE": "DEU", "FR": "FRA", "CN": "CHN", "JP": "JPN", "KR": "KOR",
    "AU": "AUS", "CA": "CAN", "BR": "BRA", "ZA": "ZAF", "SG": "SGP", "AE": "ARE", "PK": "PAK", "BD": "BGD",
    "LK": "LKA", "NP": "NPL", "ID": "IDN", "MY": "MYS", "TH": "THA", "VN": "VNM", "PH": "PHL", "IT": "ITA",
    "ES": "ESP", "NL": "NLD", "SE": "SWE", "NO": "NOR", "PL": "POL", "TR": "TUR", "SA": "SAU", "MX": "MEX",
    "NZ": "NZL", "EG": "EGY", "NG": "NGA", "KE": "KEN", "RU": "RUS",
}

# Fixed UTC offsets for showing live-grid hours in local time
UTC_OFFSET_HOURS = {"IN": 5.5, "GB": 0, "DE": 1, "FR": 1}

_cache: dict = {}
_lock = threading.Lock()


def _cached(key, ttl: float, fn: Callable):
    now = time.time()
    with _lock:
        hit = _cache.get(key)
        if hit and now - hit[0] < ttl:
            return hit[1]
    value = fn()
    if value is not None:
        with _lock:
            _cache[key] = (now, value)
    return value


def _http_json(url: str, headers: Optional[dict] = None, body: Optional[dict] = None, timeout: float = TIMEOUT):
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"User-Agent": USER_AGENT, "Content-Type": "application/json", **(headers or {})},
        method="POST" if body is not None else "GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.load(r)
    except (urllib.error.URLError, TimeoutError, ValueError, OSError) as e:
        # Log the endpoint only, never the key in the query string
        print(f"[external] {url.split('?')[0]} failed: {type(e).__name__} {getattr(e, 'code', '')}")
        return None


def haversine_km(a: tuple, b: tuple) -> float:
    lat1, lon1, lat2, lon2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(h))


# ---------------------------------------------------------------------------
# OpenRouteService: geocoding and roads
# ---------------------------------------------------------------------------
def _ors_key() -> str:
    return os.getenv("OPENROUTESERVICE_API_KEY", "").strip()


def geocode(place: str, country: Optional[str] = None) -> Optional[dict]:
    """{'lat', 'lon', 'label'} for a city or place name."""
    key = _ors_key()
    if not key or not place.strip():
        return None
    country = (country or "").upper()

    def fetch():
        params = {"api_key": key, "text": place, "size": 1, "layers": "locality,localadmin,county,region"}
        if len(country) == 2:
            params["boundary.country"] = country
        data = _http_json("https://api.openrouteservice.org/geocode/search?" + urllib.parse.urlencode(params))
        try:
            f = data["features"][0]
            lon, lat = f["geometry"]["coordinates"]
            return {"lat": lat, "lon": lon, "label": f["properties"].get("label", place)}
        except (TypeError, KeyError, IndexError):
            return None

    return _cached(("geo", place.strip().lower(), country), 7 * 86400, fetch)


def _thin(coords: list, max_points: int = 200) -> list:
    """Downsample a route for the map; keeps both ends."""
    if len(coords) <= max_points:
        return coords
    step = len(coords) / (max_points - 1)
    return [coords[int(i * step)] for i in range(max_points - 1)] + [coords[-1]]


def road_route(a: dict, b: dict) -> Optional[dict]:
    """Driving route between two geocoded points: {'km', 'hours', 'coords': [[lat, lon], ...]}."""
    key = _ors_key()
    if not key or not a or not b:
        return None

    def fetch():
        data = _http_json("https://api.openrouteservice.org/v2/directions/driving-car/geojson",
                          headers={"Authorization": key},
                          body={"coordinates": [[a["lon"], a["lat"]], [b["lon"], b["lat"]]]})
        try:
            f = data["features"][0]
            s = f["properties"]["summary"]
            coords = [[lat, lon] for lon, lat in f["geometry"]["coordinates"]]
            return {"km": s["distance"] / 1000, "hours": s["duration"] / 3600, "coords": _thin(coords)}
        except (TypeError, KeyError, IndexError):
            return None

    return _cached(("route", round(a["lat"], 3), round(a["lon"], 3), round(b["lat"], 3), round(b["lon"], 3)), 86400, fetch)


def road_matrix(origins: list, destinations: list) -> Optional[dict]:
    """{(i, j): (km, hours)} for every origin i and destination j (geocoded points)."""
    key = _ors_key()
    if not key or not origins or not destinations:
        return None
    locations = [[p["lon"], p["lat"]] for p in origins + destinations]
    data = _http_json("https://api.openrouteservice.org/v2/matrix/driving-car",
                      headers={"Authorization": key},
                      body={"locations": locations, "sources": list(range(len(origins))),
                            "destinations": list(range(len(origins), len(locations))),
                            "metrics": ["distance", "duration"], "units": "km"})
    try:
        out = {}
        for i, (row_d, row_t) in enumerate(zip(data["distances"], data["durations"])):
            for j, (km, secs) in enumerate(zip(row_d, row_t)):
                if km is not None and secs is not None:
                    out[(i, j)] = (km, secs / 3600)
        return out
    except (TypeError, KeyError):
        return None


# ---------------------------------------------------------------------------
# OurAirports: nearest scheduled-service airport
# ---------------------------------------------------------------------------
_airports: Optional[list] = None
_airports_lock = threading.Lock()


def _load_airports() -> list:
    """Large/medium airports with scheduled service and an IATA code; cached on disk."""
    global _airports
    with _airports_lock:
        if _airports is not None:
            return _airports
        cache = DATA_DIR / "airports.json"
        if cache.exists() and time.time() - cache.stat().st_mtime < 30 * 86400:
            _airports = json.loads(cache.read_text(encoding="utf-8"))
            return _airports
        try:
            req = urllib.request.Request("https://davidmegginson.github.io/ourairports-data/airports.csv",
                                         headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=60) as r:
                text = r.read().decode("utf-8")
            rows = [
                {"iata": row["iata_code"], "name": row["name"], "lat": float(row["latitude_deg"]),
                 "lon": float(row["longitude_deg"]), "country": row["iso_country"], "large": row["type"] == "large_airport"}
                for row in csv.DictReader(io.StringIO(text))
                if row["type"] in ("large_airport", "medium_airport") and row["scheduled_service"] == "yes" and row["iata_code"]
            ]
            DATA_DIR.mkdir(exist_ok=True)
            cache.write_text(json.dumps(rows), encoding="utf-8")
            _airports = rows
        except (urllib.error.URLError, TimeoutError, OSError, ValueError, KeyError) as e:
            print(f"[external] airports download failed: {type(e).__name__}")
            _airports = json.loads(cache.read_text(encoding="utf-8")) if cache.exists() else []
        return _airports


def nearest_airport(point: dict, max_km: float = 150) -> Optional[dict]:
    """Closest scheduled airport within max_km, preferring large airports when nearly as close."""
    if not point:
        return None
    best = None
    for ap in _load_airports():
        d = haversine_km((point["lat"], point["lon"]), (ap["lat"], ap["lon"]))
        score = d - (25 if ap["large"] else 0)  # a big hub 25 km further away is usually the real choice
        if d <= max_km and (best is None or score < best[0]):
            best = (score, d, ap)
    if not best:
        return None
    return {**best[2], "km_from_city": round(best[1], 1)}


def preload_airports():
    """Fetch the airport list in the background so the first prediction isn't slowed."""
    threading.Thread(target=_load_airports, daemon=True).start()


# ---------------------------------------------------------------------------
# Google Travel Impact Model: typical per-passenger flight emissions
# ---------------------------------------------------------------------------
def flight_emissions(pairs: list) -> dict:
    """{(origin_iata, dest_iata): {'economy': kg, 'premiumEconomy': kg, 'business': kg, 'first': kg, 'version': str}}"""
    key = os.getenv("GOOGLE_TRAVEL_IMPACT_API_KEY", "").strip()
    pairs = list(dict.fromkeys((o, d) for o, d in pairs if o and d and o != d))
    if not key or not pairs:
        return {}
    out, missing = {}, []
    for p in pairs:
        hit = _cache.get(("tim", p))
        if hit and time.time() - hit[0] < 86400:
            out[p] = hit[1]
        else:
            missing.append(p)
    if missing:
        data = _http_json(
            "https://travelimpactmodel.googleapis.com/v1/flights:computeTypicalFlightEmissions?key=" + key,
            body={"markets": [{"origin": o, "destination": d} for o, d in missing]},
        )
        if data:
            v = data.get("modelVersion", {})
            version = f"{v.get('major', '?')}.{v.get('minor', 0)}"
            for item in data.get("typicalFlightEmissions", []):
                m, grams = item.get("market", {}), item.get("emissionsGramsPerPax")
                if not grams:
                    continue
                value = {cls: grams[cls] / 1000 for cls in ("economy", "premiumEconomy", "business", "first") if cls in grams}
                value["version"] = version
                pair = (m.get("origin"), m.get("destination"))
                out[pair] = value
                with _lock:
                    _cache[("tim", pair)] = (time.time(), value)
    return out


# ---------------------------------------------------------------------------
# Electricity grids
# ---------------------------------------------------------------------------
def grid_factor(iso2: str) -> Optional[tuple]:
    """(kg CO2e per kWh, source) from the best available official/open data, else None."""
    iso2 = (iso2 or "").upper()
    if iso2 == "IN":
        return CEA_INDIA
    key = os.getenv("EMBER_API_KEY", "").strip()
    code = ISO3.get(iso2)
    if not key or not code:
        return None

    def fetch():
        start = datetime.now().year - 3
        data = _http_json(f"https://api.ember-energy.org/v1/carbon-intensity/yearly?entity_code={code}&start_date={start}&api_key={key}")
        rows = [r for r in (data or {}).get("data", []) if r.get("emissions_intensity_gco2_per_kwh") is not None]
        if not rows:
            return None
        latest = max(rows, key=lambda r: str(r["date"]))
        return (round(latest["emissions_intensity_gco2_per_kwh"] / 1000, 3), f"Ember {latest['date']} ({latest['entity']})")

    return _cached(("ember", iso2), 86400, fetch)


def live_grid(iso2: str) -> Optional[dict]:
    """Current and last-24h grid intensity for the configured Electricity Maps zone, if it covers iso2."""
    key = os.getenv("ELECTRICITYMAPS_API_KEY", "").strip()
    zone = os.getenv("ELECTRICITYMAPS_ZONE", "").strip()
    iso2 = (iso2 or "").upper()
    if not key or not zone or zone.split("-")[0].upper() != iso2:
        return None

    def fetch():
        data = _http_json(f"https://api.electricitymap.org/v3/carbon-intensity/history?zone={zone}",
                          headers={"auth-token": key})
        points = [(p["datetime"], p["carbonIntensity"]) for p in (data or {}).get("history", [])
                  if p.get("carbonIntensity") is not None]
        if not points:
            return None
        offset = timedelta(hours=UTC_OFFSET_HOURS.get(iso2, 0))

        def local(iso: str) -> str:
            h = (datetime.fromisoformat(iso.replace("Z", "+00:00")) + offset).hour
            return f"{h % 12 or 12} {'am' if h < 12 else 'pm'}"

        lo, hi = min(points, key=lambda p: p[1]), max(points, key=lambda p: p[1])
        return {
            "zone": zone,
            "nowG": points[-1][1],
            "cleanestHour": local(lo[0]), "cleanestG": lo[1],
            "dirtiestHour": local(hi[0]), "dirtiestG": hi[1],
            "timezone": "IST" if iso2 == "IN" else ("UTC" if iso2 not in UTC_OFFSET_HOURS else f"UTC{UTC_OFFSET_HOURS[iso2]:+g}"),
            "source": "Electricity Maps (last 24 h)",
        }

    return _cached(("live", zone), 15 * 60, fetch)

