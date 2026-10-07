"""
Replaces the LLM's travel guesses with real data, and builds the route maps.

The LLM still decides *which* ways to travel make sense; this module swaps in
real road distances and times (OpenRouteService), exact flight distances
(OurAirports) and per-flight emissions (Google TIM). Anything that can't be
looked up keeps the LLM's estimate and says so in its source.
"""

from typing import Optional

import external
from emission_factors import FLIGHT_BANDS
from models import MapPoint, MapRoute, TravelMap, TripOption

ROAD_TYPES = {
    "car_petrol", "car_diesel", "car_hybrid", "car_unknown_fuel", "car_small", "car_large_suv", "car_electric",
    "motorbike", "taxi", "auto_rickshaw", "van_diesel", "bus", "coach", "bus_hired",
}
PRIVATE_ROAD = {t for t in ROAD_TYPES if t.startswith("car_")} | {"motorbike", "taxi", "auto_rickshaw", "van_diesel"}
RAIL_TYPES = {"train", "metro", "tram"}
TIM_CLASS = {"flight_economy": "economy", "flight_business": "business", "flight_first": "first"}
# Buses and coaches stop and run slower than cars on the same road
BUS_SLOWDOWN = 1.2

ATTRIBUTION = ["Routes © openrouteservice.org", "Map data © OpenStreetMap contributors", "Airports: OurAirports"]


def main_leg(activities: list) -> Optional[dict]:
    """The activity carrying the journey: the longest distance among them."""
    legs = [a for a in activities if a.get("type") in ROAD_TYPES | RAIL_TYPES | set(FLIGHT_BANDS) | {"ferry"}]
    return max(legs, key=lambda a: float(a.get("amount") or 0), default=None)


def mode_of(activities: list) -> str:
    leg = main_leg(activities)
    t = leg.get("type") if leg else ""
    if t in ROAD_TYPES:
        return "road"
    if t in RAIL_TYPES:
        return "rail"
    if t in FLIGHT_BANDS:
        return "flight"
    return "other"


def _flight_facts(a: dict, b: dict) -> Optional[dict]:
    ap_a, ap_b = external.nearest_airport(a), external.nearest_airport(b)
    if not (ap_a and ap_b) or ap_a["iata"] == ap_b["iata"]:
        return None
    km = external.haversine_km((ap_a["lat"], ap_a["lon"]), (ap_b["lat"], ap_b["lon"]))
    return {"from": ap_a, "to": ap_b, "km": km}


def _apply_flight(act: dict, flight: dict, tim: Optional[dict]):
    act["amount"] = round(flight["km"], 1)
    act["distance_source"] = f"OurAirports {flight['from']['iata']}→{flight['to']['iata']} great-circle"
    cls = TIM_CLASS.get(act.get("type"))
    if tim and cls and tim.get(cls):
        act["tim_kg"] = tim[cls]
        act["tim_version"] = tim.get("version", "?")


def enrich_trip(trip: dict, region: str, user_km: Optional[float]) -> Optional[dict]:
    """
    Swap real distances, times and flight emissions into each trip option, in place.
    Returns the geocoded geometry for the map, or None if the places couldn't be found.
    """
    country = region if len(region or "") == 2 else None
    a = external.geocode(str(trip.get("from") or ""), country)
    b = external.geocode(str(trip.get("to") or ""), country)
    if not (a and b):
        return None

    road = external.road_route(a, b)
    flight = _flight_facts(a, b)
    tim = None
    if flight:
        tim = external.flight_emissions([(flight["from"]["iata"], flight["to"]["iata"])]).get(
            (flight["from"]["iata"], flight["to"]["iata"]))

    for option in trip.get("options") or []:
        leg = main_leg(option.get("activities") or [])
        if not leg:
            continue
        t = leg.get("type")
        if t in ROAD_TYPES and road:
            if not user_km:  # a distance the user typed always wins
                leg["amount"] = round(road["km"], 1)
                leg["distance_source"] = "OpenRouteService"
            hours = road["hours"] if t in PRIVATE_ROAD else road["hours"] * BUS_SLOWDOWN
            option["in_vehicle_hours"] = round(max(hours, 0.1), 2)
            option["_time_source"] = "OpenRouteService"
        elif t in FLIGHT_BANDS and flight:
            _apply_flight(leg, flight, tim)

    return {"from": {**a, "name": trip.get("from")}, "to": {**b, "name": trip.get("to")}, "road": road, "flight": flight}


def option_source(computed: list) -> str:
    leg = main_leg(computed)
    return leg.get("source", "") if leg else ""


def trip_map(geo: dict, options: list, best: Optional[dict], plan: Optional[dict], to_trip_option) -> TravelMap:
    """One line per way of travelling (road, rail, air), coloured by the best and planned options."""
    a, b = geo["from"], geo["to"]
    points = [
        MapPoint(name=str(a["name"]), lat=a["lat"], lon=a["lon"], kind="origin", detail=a.get("label", "")),
        MapPoint(name=str(b["name"]), lat=b["lat"], lon=b["lon"], kind="destination", detail=b.get("label", "")),
    ]
    groups: dict[str, list] = {}
    for o in options:
        groups.setdefault(mode_of(o.get("activities") or []), []).append(o)

    routes = []
    for mode, opts in groups.items():
        highlight = "best" if best in opts else "plan" if plan in opts else "other"
        if mode == "road":
            coords = geo["road"]["coords"] if geo.get("road") else [[a["lat"], a["lon"]], [b["lat"], b["lon"]]]
            label = f"Road · {geo['road']['km']:.0f} km" if geo.get("road") else "Road"
            approximate = not geo.get("road")
        elif mode == "flight" and geo.get("flight"):
            f = geo["flight"]
            coords = [[f["from"]["lat"], f["from"]["lon"]], [f["to"]["lat"], f["to"]["lon"]]]
            label = f"Flight {f['from']['iata']} → {f['to']['iata']} · {f['km']:.0f} km"
            approximate = False
            for ap in (f["from"], f["to"]):
                points.append(MapPoint(name=f"{ap['iata']} · {ap['name']}", lat=ap["lat"], lon=ap["lon"], kind="airport",
                                       detail=f"{ap['km_from_city']:.0f} km from the city"))
        elif mode == "rail":
            coords = [[a["lat"], a["lon"]], [b["lat"], b["lon"]]]
            label, approximate = "Rail (straight line, not the actual track)", True
        else:
            continue
        routes.append(MapRoute(label=label, mode=mode, coords=coords, highlight=highlight, approximate=approximate,
                               options=[to_trip_option(o) for o in sorted(opts, key=lambda o: o["kg"])]))
    return TravelMap(points=points, routes=routes, attribution=ATTRIBUTION)


# ---------------------------------------------------------------------------
# Meeting point
# ---------------------------------------------------------------------------
def enrich_meeting(groups: dict, venues: list, legs: dict, region: str, norm) -> dict:
    """
    Overwrite the LLM's road and flight facts in `legs` with real data, in place.
    Returns geocoded points by normalised city name, for the map.
    """
    country = region if len(region or "") == 2 else None
    points = {k: external.geocode(g["city"], country) for k, g in groups.items()}
    for v in venues:
        points.setdefault(norm(v), external.geocode(v, country))

    origin_keys = [k for k in groups if points.get(k)]
    venue_keys = [norm(v) for v in venues if points.get(norm(v))]
    matrix = external.road_matrix([points[k] for k in origin_keys], [points[v] for v in venue_keys]) or {}

    flights, pairs = {}, []
    for k in origin_keys:
        for v in venue_keys:
            if k != v:
                f = _flight_facts(points[k], points[v])
                if f:
                    flights[(k, v)] = f
                    pairs.append((f["from"]["iata"], f["to"]["iata"]))
    tims = external.flight_emissions(pairs)

    for i, k in enumerate(origin_keys):
        for j, v in enumerate(venue_keys):
            leg = legs.setdefault((k, v), {})
            if (i, j) in matrix:
                km, hours = matrix[(i, j)]
                leg.update(road_km=round(km, 1), car_hours=round(hours, 2), _road_source="OpenRouteService")
                if leg.get("coach_hours"):
                    leg["coach_hours"] = round(max(float(leg["coach_hours"]), hours * BUS_SLOWDOWN), 2)
            f = flights.get((k, v))
            if f and leg.get("flight_km") is not None:  # only where the LLM confirmed a practical route
                leg["flight_km"] = round(f["km"], 1)
                leg["_flight"] = f
                leg["_tim"] = tims.get((f["from"]["iata"], f["to"]["iata"]))
    return points


def meeting_map(points: dict, groups: dict, best, planned, norm) -> Optional[TravelMap]:
    """Attendee cities joined to the recommended venue, one line per group in its travel mode."""
    venue_pt = points.get(norm(best.city))
    if not venue_pt:
        return None
    pts = [MapPoint(name=best.city, lat=venue_pt["lat"], lon=venue_pt["lon"], kind="venue", highlight="best",
                    detail=f"Lowest carbon · {best.totalKg / 1000:.2f} t")]
    if planned and planned is not best and points.get(norm(planned.city)):
        p = points[norm(planned.city)]
        pts.append(MapPoint(name=planned.city, lat=p["lat"], lon=p["lon"], kind="venue", highlight="plan",
                            detail=f"Planned venue · {planned.totalKg / 1000:.2f} t"))
    routes = []
    for leg in best.legs:
        origin = points.get(norm(leg.fromCity))
        if not origin:
            continue
        people = f"{leg.people} {'person' if leg.people == 1 else 'people'}"
        if leg.kg == 0:
            # Already at the venue: note it on the venue instead of stacking a second dot
            pts[0].detail += f" · {people} already here"
            continue
        pts.append(MapPoint(name=leg.fromCity, lat=origin["lat"], lon=origin["lon"], kind="origin", detail=people))
        mode = "flight" if leg.mode == "Flight" else "rail" if leg.mode == "Train" else "road"
        routes.append(MapRoute(
            label=f"{leg.fromCity} → {best.city} · {leg.mode}",
            mode=mode,
            coords=[[origin["lat"], origin["lon"]], [venue_pt["lat"], venue_pt["lon"]]],
            highlight="best",
            approximate=mode != "flight",
            detail=f"{leg.people} {'person' if leg.people == 1 else 'people'} · {leg.kg:,.1f} kg CO₂e return",
        ))
    return TravelMap(points=pts, routes=routes, attribution=ATTRIBUTION)
