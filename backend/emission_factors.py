"""
Emission factors and the deterministic carbon engine.

All values are kg CO2e per unit. The LLM never does carbon math: it only maps a
free-text activity onto the activity keys below, and this module computes the result.

Sources:
  DESNZ  - UK Government GHG Conversion Factors for Company Reporting 2024
           (flights include radiative forcing, as DESNZ recommends)
  GRID   - Ember / IEA electricity generation carbon intensity, 2023
  P&N    - Poore & Nemecek (2018), Science; global mean values per kg of product,
           as published by Our World in Data
  LCA    - typical manufacturer product life-cycle assessments (wide range)
  AR5    - IPCC Fifth Assessment Report 100-year global warming potentials
  CHSB   - Cornell Hotel Sustainability Benchmarking (global average room-night)
  IEA    - IEA analysis of video streaming energy use (2020)
  ICE    - Inventory of Carbon and Energy v3 (University of Bath / Circular Ecology)
"""

import re
from dataclasses import dataclass
from typing import Optional

import external
from models import ActivityCategory

T, B, E, Q, R = (
    ActivityCategory.transport,
    ActivityCategory.building,
    ActivityCategory.electricity,
    ActivityCategory.equipment,
    ActivityCategory.resources,
)


@dataclass(frozen=True)
class Factor:
    label: str
    unit: str
    kg_per_unit: float
    category: ActivityCategory
    source: str
    # Grid-powered activities store kWh per unit here; kg_per_unit is then ignored
    kwh_per_unit: Optional[float] = None


# kg CO2e per kWh of electricity generated
GRID_INTENSITY = {
    "WORLD": 0.48,
    "IN": 0.71,
    "US": 0.37,
    "GB": 0.21,
    "EU": 0.24,
    "DE": 0.38,
    "FR": 0.05,
    "CN": 0.58,
    "JP": 0.48,
    "KR": 0.43,
    "AU": 0.55,
    "CA": 0.13,
    "BR": 0.10,
    "ZA": 0.71,
    "SG": 0.47,
}

FACTORS: dict[str, Factor] = {
    # --- Road vehicles, per vehicle-km (split between passengers yourself) ---
    "car_petrol": Factor("Petrol car (average size)", "vehicle-km", 0.164, T, "DESNZ"),
    "car_diesel": Factor("Diesel car (average size)", "vehicle-km", 0.168, T, "DESNZ"),
    "car_hybrid": Factor("Hybrid car", "vehicle-km", 0.120, T, "DESNZ"),
    "car_unknown_fuel": Factor("Car (average, unknown fuel)", "vehicle-km", 0.166, T, "DESNZ"),
    "car_small": Factor("Small petrol car", "vehicle-km", 0.140, T, "DESNZ"),
    "car_large_suv": Factor("Large car / SUV", "vehicle-km", 0.255, T, "DESNZ"),
    "car_electric": Factor("Electric car", "vehicle-km", 0, T, "GRID", kwh_per_unit=0.19),
    "motorbike": Factor("Motorbike / scooter (petrol)", "vehicle-km", 0.113, T, "DESNZ"),
    "taxi": Factor("Taxi / ride-hail car", "vehicle-km", 0.170, T, "DESNZ"),
    "auto_rickshaw": Factor("Auto-rickshaw (CNG)", "vehicle-km", 0.070, T, "approximate, ICCT"),
    "van_diesel": Factor("Diesel van (average)", "vehicle-km", 0.250, T, "DESNZ"),
    # ~40 L diesel per 100 km x DESNZ diesel 2.51 kg/L
    "bus_hired": Factor("Hired bus / coach for a group", "vehicle-km", 1.00, T, "approximate, from DESNZ diesel"),
    # --- Shared transport, per passenger-km ---
    "bus": Factor("Local bus", "passenger-km", 0.102, T, "DESNZ"),
    "coach": Factor("Long-distance coach", "passenger-km", 0.027, T, "DESNZ"),
    "train": Factor("National rail", "passenger-km", 0.035, T, "DESNZ"),
    "metro": Factor("Metro / underground", "passenger-km", 0.028, T, "DESNZ"),
    "tram": Factor("Tram / light rail", "passenger-km", 0.029, T, "DESNZ"),
    "ferry": Factor("Ferry (foot passenger)", "passenger-km", 0.019, T, "DESNZ"),
    # Flights: the engine picks the haul band from the distance
    "flight_economy": Factor("Flight, economy", "passenger-km", 0, T, "DESNZ"),
    "flight_business": Factor("Flight, business class", "passenger-km", 0, T, "DESNZ"),
    "flight_first": Factor("Flight, first class", "passenger-km", 0, T, "DESNZ"),
    # --- Zero / near-zero transport ---
    "bicycle": Factor("Bicycle", "km", 0.0, T, "no direct emissions"),
    "walking": Factor("Walking", "km", 0.0, T, "no direct emissions"),
    "e_bike": Factor("E-bike / e-scooter", "km", 0, T, "GRID", kwh_per_unit=0.012),
    # --- Electricity and fuels ---
    "electricity": Factor("Grid electricity", "kWh", 0, E, "GRID", kwh_per_unit=1.0),
    "appliance_kw": Factor("Electric appliance", "kW", 0, E, "GRID", kwh_per_unit=1.0),
    "natural_gas_kwh": Factor("Natural gas", "kWh", 0.183, B, "DESNZ"),
    "natural_gas_m3": Factor("Natural gas", "m³", 2.04, B, "DESNZ"),
    "lpg_kg": Factor("LPG (cooking / heating gas)", "kg", 2.94, B, "DESNZ"),
    "lpg_litre": Factor("LPG", "litre", 1.56, B, "DESNZ"),
    "heating_oil_litre": Factor("Heating oil", "litre", 2.54, B, "DESNZ"),
    "petrol_litre": Factor("Petrol burned", "litre", 2.09, T, "DESNZ"),
    "diesel_litre": Factor("Diesel burned", "litre", 2.51, T, "DESNZ"),
    "coal_kg": Factor("Coal burned", "kg", 2.40, B, "DESNZ (approximate)"),
    # ~0.3 L diesel per kWh x 2.51 kg/L
    "diesel_generator_kwh": Factor("Diesel generator (DG set) output", "kWh", 0.75, E, "DESNZ diesel, approximate"),
    # --- Refrigerant leaks (AC, fridges), per kg of gas released ---
    "refrigerant_r32_kg": Factor("Refrigerant R-32 leaked", "kg", 677, B, "AR5"),
    "refrigerant_r410a_kg": Factor("Refrigerant R-410A leaked", "kg", 1924, B, "AR5"),
    "refrigerant_r22_kg": Factor("Refrigerant R-22 leaked", "kg", 1760, B, "AR5"),
    "refrigerant_r134a_kg": Factor("Refrigerant R-134a leaked", "kg", 1300, B, "AR5"),
    # --- Freight, per tonne-km of goods moved ---
    "freight_truck": Factor("Road freight (truck)", "tonne-km", 0.107, T, "DESNZ"),
    "freight_van": Factor("Delivery van freight", "tonne-km", 0.600, T, "DESNZ"),
    "freight_rail": Factor("Rail freight", "tonne-km", 0.028, T, "DESNZ"),
    "freight_ship": Factor("Container ship freight", "tonne-km", 0.016, T, "DESNZ"),
    "freight_air": Factor("Air freight", "tonne-km", 1.130, T, "DESNZ (incl. radiative forcing)"),
    # --- Accommodation and digital ---
    "hotel_night": Factor("Hotel stay", "room-night", 25.0, B, "CHSB (approximate global average)"),
    "video_streaming_hour": Factor("Video streaming / video call", "hour", 0.036, E, "IEA"),
    # --- Food, per kg of product (litre for drinks) ---
    "beef": Factor("Beef (beef herd)", "kg", 99.5, R, "P&N"),
    "beef_dairy_herd": Factor("Beef (dairy herd)", "kg", 33.3, R, "P&N"),
    "lamb": Factor("Lamb / mutton", "kg", 39.7, R, "P&N"),
    "cheese": Factor("Cheese", "kg", 23.9, R, "P&N"),
    "chocolate": Factor("Dark chocolate", "kg", 46.7, R, "P&N"),
    "coffee": Factor("Coffee (beans)", "kg", 28.5, R, "P&N"),
    "prawns": Factor("Prawns (farmed)", "kg", 26.9, R, "P&N"),
    "fish_farmed": Factor("Fish (farmed)", "kg", 13.6, R, "P&N"),
    "pork": Factor("Pork", "kg", 12.3, R, "P&N"),
    "poultry": Factor("Chicken / poultry", "kg", 9.9, R, "P&N"),
    "eggs": Factor("Eggs", "kg", 4.7, R, "P&N"),
    "rice": Factor("Rice", "kg", 4.5, R, "P&N"),
    "milk": Factor("Dairy milk", "litre", 3.2, R, "P&N"),
    "tofu": Factor("Tofu", "kg", 3.2, R, "P&N"),
    "sugar": Factor("Cane sugar", "kg", 3.2, R, "P&N"),
    "tomatoes": Factor("Tomatoes", "kg", 2.1, R, "P&N"),
    "pulses": Factor("Pulses / lentils / beans", "kg", 1.8, R, "P&N"),
    "wine": Factor("Wine", "litre", 1.8, R, "P&N"),
    "maize": Factor("Maize / corn", "kg", 1.7, R, "P&N"),
    "wheat_bread": Factor("Wheat / bread / pasta", "kg", 1.6, R, "P&N"),
    "fruit": Factor("Fruit (average)", "kg", 1.05, R, "P&N"),
    "plant_milk": Factor("Soy / oat milk", "litre", 0.95, R, "P&N"),
    "vegetables": Factor("Vegetables (average)", "kg", 0.53, R, "P&N"),
    "potatoes": Factor("Potatoes", "kg", 0.46, R, "P&N"),
    "nuts": Factor("Nuts", "kg", 0.43, R, "P&N"),
    # --- Waste, per kg disposed ---
    "waste_landfill": Factor("Mixed waste to landfill", "kg", 0.497, R, "DESNZ"),
    "food_waste_landfill": Factor("Food waste to landfill", "kg", 0.700, R, "DESNZ"),
    "waste_incinerated": Factor("Waste incinerated (energy recovery)", "kg", 0.021, R, "DESNZ"),
    "waste_recycled": Factor("Waste recycled", "kg", 0.021, R, "DESNZ"),
    "waste_composted": Factor("Waste composted", "kg", 0.009, R, "DESNZ"),
    # --- Water and materials ---
    "water_m3": Factor("Tap water (supply + treatment)", "m³", 0.34, R, "DESNZ"),
    "paper": Factor("Paper / cardboard", "kg", 0.92, R, "DESNZ"),
    "plastic": Factor("Plastic (average)", "kg", 3.1, R, "DESNZ"),
    "steel": Factor("Steel", "kg", 1.9, R, "worldsteel"),
    "aluminium": Factor("Aluminium", "kg", 9.1, R, "DESNZ"),
    "concrete": Factor("Concrete", "kg", 0.13, R, "ICE database"),
    "clothing": Factor("New clothing / textiles", "kg", 22.3, R, "DESNZ"),
    # ~5 g per A4 sheet x paper factor
    "printed_pages": Factor("Printed A4 pages", "page", 0.0046, R, "DESNZ paper, approximate"),
    # --- Construction materials, cradle-to-gate per kg (or per unit) ---
    "cement_opc": Factor("Cement, OPC", "kg", 0.91, R, "ICE v3"),
    "cement_ppc": Factor("Cement, PPC (fly-ash blended)", "kg", 0.66, R, "ICE v3, approximate"),
    "cement_psc": Factor("Cement, PSC / slag blended", "kg", 0.45, R, "ICE v3, approximate"),
    "concrete_m3": Factor("Ready-mix concrete (M20-M25)", "m³", 300, R, "ICE v3, approximate"),
    "concrete_low_carbon_m3": Factor("Low-carbon concrete (30-50% fly ash / GGBS)", "m³", 200, R, "ICE v3, approximate"),
    "steel_rebar": Factor("Steel rebar (blast-furnace)", "kg", 1.99, R, "ICE v3 / worldsteel"),
    "steel_recycled": Factor("Steel, recycled (electric arc furnace)", "kg", 0.70, R, "worldsteel, approximate"),
    # ~3 kg Indian standard brick
    "brick_clay": Factor("Fired clay brick", "brick", 0.70, R, "ICE v3 x 3 kg brick, approximate"),
    "brick_flyash": Factor("Fly-ash brick", "brick", 0.25, R, "approximate"),
    "aac_block_m3": Factor("AAC blocks", "m³", 170, R, "ICE v3 x 600 kg/m³, approximate"),
    "sand": Factor("Sand", "kg", 0.005, R, "ICE v3"),
    "aggregate": Factor("Coarse aggregate / gravel", "kg", 0.005, R, "ICE v3"),
    "timber": Factor("Sawn timber", "kg", 0.30, R, "ICE v3 (fossil only)"),
    "glass": Factor("Glass", "kg", 1.44, R, "ICE v3"),
    "ceramic_tiles": Factor("Ceramic / vitrified tiles", "kg", 0.78, R, "ICE v3"),
    "paint": Factor("Paint", "kg", 2.50, R, "ICE v3, approximate"),
    "copper": Factor("Copper (wiring, pipes)", "kg", 2.71, R, "ICE v3"),
    # --- Construction machinery, per operating hour (typical diesel burn x 2.51 kg/L) ---
    "backhoe_loader_hour": Factor("Backhoe loader (JCB), ~7 L/h", "hour", 17.6, B, "DESNZ diesel, approximate"),
    "excavator_hour": Factor("Excavator 20 t, ~15 L/h", "hour", 37.7, B, "DESNZ diesel, approximate"),
    "mobile_crane_hour": Factor("Mobile crane, ~12 L/h", "hour", 30.1, B, "DESNZ diesel, approximate"),
    "concrete_mixer_hour": Factor("Diesel concrete mixer, ~3 L/h", "hour", 7.5, B, "DESNZ diesel, approximate"),
    "road_roller_hour": Factor("Road roller, ~8 L/h", "hour", 20.1, B, "DESNZ diesel, approximate"),
    # --- Equipment, embodied emissions per new device ---
    "smartphone_new": Factor("New smartphone", "device", 70, Q, "LCA"),
    "laptop_new": Factor("New laptop", "device", 250, Q, "LCA"),
    "tablet_new": Factor("New tablet", "device", 100, Q, "LCA"),
    "desktop_pc_new": Factor("New desktop PC", "device", 400, Q, "LCA"),
}

# Flight factors by haul band (kg CO2e per passenger-km, DESNZ 2024 incl. radiative forcing)
FLIGHT_BANDS = {
    #                  domestic (<500 km), short-haul (<3700 km), long-haul
    "flight_economy": (0.246, 0.151, 0.148),
    "flight_business": (0.246, 0.227, 0.429),
    "flight_first": (0.246, 0.227, 0.592),
}


# GHG Protocol scopes, from the point of view of whoever owns the vehicle/building:
# 1 = fuel burned or gas leaked directly, 2 = purchased electricity, 3 = everything else
# (travel on others' vehicles, food, goods, waste, freight, hotels).
SCOPE_1 = {
    "car_petrol", "car_diesel", "car_hybrid", "car_unknown_fuel", "car_small", "car_large_suv",
    "motorbike", "van_diesel", "bus_hired", "natural_gas_kwh", "natural_gas_m3", "lpg_kg", "lpg_litre",
    "heating_oil_litre", "petrol_litre", "diesel_litre", "coal_kg", "diesel_generator_kwh",
    "refrigerant_r32_kg", "refrigerant_r410a_kg", "refrigerant_r22_kg", "refrigerant_r134a_kg",
    "backhoe_loader_hour", "excavator_hour", "mobile_crane_hour", "concrete_mixer_hour", "road_roller_hour",
}


def scope_for(activity_type: str, category: ActivityCategory) -> int:
    if activity_type in SCOPE_1:
        return 1
    f = FACTORS.get(activity_type)
    if (f and f.kwh_per_unit is not None) or (activity_type == "custom" and category == ActivityCategory.electricity):
        return 2
    return 3


PEOPLE_WORDS = re.compile(
    r"passenger|people|person|student|staff|employee|occupant|rider|friend|traveller|traveler|attendee|member|guest|colleague|pupil|kid|child",
    re.I,
)


def grid_intensity(region: Optional[str]) -> tuple[str, float, str]:
    """(region label, kg CO2e per kWh, source): official/live data first, built-in table as fallback."""
    key = (region or "").upper()
    live = external.grid_factor(key) if key and key != "WORLD" else None
    if live:
        return key, live[0], live[1]
    if key in GRID_INTENSITY:
        return key, GRID_INTENSITY[key], "Ember/IEA 2023 (built-in)"
    return "WORLD", GRID_INTENSITY["WORLD"], "Ember/IEA 2023 world average (built-in)"


# Readable names for the short source codes in FACTORS
SOURCE_NAMES = {
    "DESNZ": "UK DESNZ 2024",
    "P&N": "Poore & Nemecek 2018",
    "LCA": "manufacturer LCAs",
    "AR5": "IPCC AR5",
    "CHSB": "Cornell Hotel Benchmarking",
    "IEA": "IEA",
}


def _source_name(code: str) -> str:
    for short, name in SOURCE_NAMES.items():
        if code.startswith(short):
            return code.replace(short, name, 1)
    return code


def factor_for(activity_type: str, amount: float, region: str) -> tuple[float, str, str]:
    """Return (kg CO2e per unit, human-readable basis, source) for one activity."""
    f = FACTORS[activity_type]
    if f.kwh_per_unit is not None:
        grid_region, intensity, source = grid_intensity(region)
        kg = f.kwh_per_unit * intensity
        basis = f"{intensity} kg/kWh ({grid_region} grid)"
        if f.unit not in ("kWh", "kW"):
            basis = f"{f.kwh_per_unit:g} kWh/{f.unit} × {basis}"
        return kg, basis, source
    if activity_type in FLIGHT_BANDS:
        domestic, short, long = FLIGHT_BANDS[activity_type]
        source = "UK DESNZ 2024 (incl. non-CO₂ warming)"
        if amount < 500:
            return domestic, f"{domestic} kg/passenger-km (domestic-length flight)", source
        if amount < 3700:
            return short, f"{short} kg/passenger-km (short-haul)", source
        return long, f"{long} kg/passenger-km (long-haul)", source
    return f.kg_per_unit, f"{f.kg_per_unit:g} kg/{f.unit}", _source_name(f.source)


def compute_activity(activity: dict, region: str) -> dict:
    """
    Compute one validated activity. Adds kg, factor, a readable working line and its sources.

    Optional live-data fields on the activity (set by main.py when APIs answered):
      tim_kg          Google TIM kg CO2e per passenger for one flight (replaces the DESNZ band)
      tim_version     TIM model version
      distance_source where `amount` came from, e.g. "OpenRouteService"
    """
    amount = float(activity["amount"])
    multipliers = activity.get("multipliers") or []
    product = 1.0
    for m in multipliers:
        product *= float(m["value"])

    if activity["type"] == "custom":
        per_unit = float(activity["custom_kg_per_unit"])
        unit = activity.get("unit") or "unit"
        basis = f"{per_unit:g} kg/{unit} (estimated)"
        source = "AI estimate"
        label = activity.get("label") or "Other activity"
        category = ActivityCategory(activity.get("category") or "resources")
    else:
        # The local-bus factor reflects short urban trips and the coach factor long full
        # coaches, so pick by distance whichever the LLM chose
        if activity["type"] == "bus" and amount >= 50:
            activity = {**activity, "type": "coach"}
        elif activity["type"] == "coach" and amount < 50:
            activity = {**activity, "type": "bus"}
        f = FACTORS[activity["type"]]
        tim_kg = activity.get("tim_kg")
        per_flight = activity["type"] in FLIGHT_BANDS and bool(tim_kg) and amount > 0
        if per_flight:
            per_unit = float(tim_kg) / amount
            basis = f"{float(tim_kg):.1f} kg per passenger per flight (Google TIM, {amount:,.0f} km)"
            source = f"Google Travel Impact Model v{activity.get('tim_version', '?')} (CO₂e from fuel; excludes contrail warming)"
        else:
            per_unit, basis, source = factor_for(activity["type"], amount, region)
        unit = f.unit
        # Per-vehicle factors already cover everyone on board; never scale them by headcount
        if unit == "vehicle-km":
            multipliers = [m for m in multipliers if not PEOPLE_WORDS.search(str(m["meaning"]))]
            product = 1.0
            for m in multipliers:
                product *= float(m["value"])
        label = f.label
        category = f.category

    kg = amount * product * per_unit
    # "1 hour × 3 hours" reads oddly; when a multiplier already counts the unit, drop the 1
    unit_word = unit.split("-")[-1].rstrip("s").lower()
    repeats_unit = amount == 1 and any(
        str(m["meaning"]).lower().lstrip("0123456789. ").startswith(unit_word) for m in multipliers
    )
    # Google TIM figures are per flight, so the distance is shown in the basis instead
    per_flight = activity.get("type") in FLIGHT_BANDS and bool(activity.get("tim_kg"))
    parts = [] if repeats_unit or per_flight else [f"{amount:g} {unit}"]
    for m in multipliers:
        if float(m["value"]) == 1:
            continue
        # The LLM sometimes repeats the number in the meaning ("1 burger"); keep just the words
        meaning = re.sub(r"^[\d.\s]+", "", str(m["meaning"]))
        parts.append(f"{float(m['value']):g} {meaning}")
    parts = parts or (["1 passenger"] if per_flight else [f"{amount:g} {unit}"])
    working = f"{label}: {' × '.join(parts)} × {basis} = {kg:.2f} kg"
    sources = [f"Factor: {source}"]
    if activity.get("distance_source"):
        sources.append(f"Distance: {activity['distance_source']}")
    return {
        **activity, "kg": kg, "label": label, "category": category, "working": working,
        "scope": scope_for(activity["type"], category),
        "quantity": amount * product, "unit": unit,
        "source": " · ".join(sources),
    }


def validate_activity(a: dict) -> Optional[str]:
    """Return an error message if the LLM's activity is malformed, else None."""
    t = a.get("type")
    if t != "custom" and t not in FACTORS:
        return f"unknown activity type '{t}'"
    try:
        if float(a.get("amount")) < 0:
            return f"negative amount for '{t}'"
        for m in a.get("multipliers") or []:
            if float(m["value"]) < 0 or not m.get("meaning"):
                return f"bad multiplier for '{t}'"
        if t == "custom":
            float(a["custom_kg_per_unit"])
            ActivityCategory(a.get("category") or "resources")
    except (TypeError, ValueError, KeyError):
        return f"missing or non-numeric field for '{t}'"
    return None


def factor_catalogue() -> str:
    """One line per activity key, for the LLM prompt."""
    return "\n".join(f"{key} ({f.unit})" for key, f in FACTORS.items())
