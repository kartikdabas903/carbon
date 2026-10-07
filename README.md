# CarbonShift

**Predict the carbon footprint of a decision before you make it, and shift to the lower-carbon choice.**

Most carbon tools measure emissions after they happen. CarbonShift is a *carbon decision engine*: you
describe a plan in plain words ("going from Mohali to Delhi", "building a 2 storey house", "team offsite in
Goa"), and it predicts the emissions, compares realistic alternatives, and helps you choose and track the
lower-carbon option. Built for the hackathon theme **Net Zero AI Architecture**.

Stack: **Next.js 16 (React 19, TypeScript, Tailwind CSS 4)** frontend + **Python FastAPI** backend +
**Groq** LLM (`openai/gpt-oss-120b`) + live open data APIs.

---

## Core principle: the AI never invents a number

The LLM only *reads* the user's description and turns it into structured activities and quantities
(e.g. `car_petrol, 307 km`). Every kg of CO₂e is then calculated **deterministically** in Python from
published emission factors, and real-world facts (road distances, flight emissions, grid intensity) come
from APIs. Every line of every result records its source, and the UI shows it.

Keep this split when changing code: **LLM = interpretation, engine = arithmetic, APIs = facts.**

---

## Features

| Area | What it does | Page |
|---|---|---|
| **Predict a decision** | Free text (or voice) → predicted kg CO₂e, confidence, cost estimate, bill of quantities ("What we counted"), 2-3 lower-carbon alternatives with real savings, "add these details for more accuracy" | `/ai` |
| **Trips** | For journeys between places: every realistic mode (train, coach, car, flight) with door-to-door time, CO₂ and cost; picks the *most viable* (lowest CO₂ within 1.5× the fastest time + 1 h); route map; booking links (Google Maps, IRCTC, redBus, Google Flights) | `/ai` |
| **Construction** | Estimates materials (cement bags, steel, bricks, sand, aggregate, tiles, paint) and machinery hours from minimal input using Indian RCC thumb rules; separate rules for renovation and roads; swaps like PPC cement, fly-ash/AAC blocks, recycled steel | `/ai` |
| **Meeting point** | Attendee cities + headcounts → compares venues by everyone's real journeys + hotel nights, recommends the lowest-carbon venue, shows a map | `/meeting` |
| **Calculator** | Exact calculation for any of 110 activity types, with the working and source | `/calculate` |
| **Dashboard** | Stat tiles, monthly carbon budget, cumulative "as planned vs with recommendations" chart, category and GHG scope breakdowns, reduction-target planner; filterable | `/dashboard` |
| **History** | Every prediction/calculation with its recommendations; "Which will you do?" choice picker (tracks *actually avoided* CO₂); sort/filter; print one | `/result` |
| **Recommendations** | Best changes across all decisions, ranked by savings × ease; sort/filter | `/recommendations` |
| **Ghost You** | You vs a "ghost" who always took the best recommendation, projected to 2030 | `/ghost` |
| **Net-zero plan** | Marginal abatement cost curve (₹ per tonne, cheapest first) and a year-by-year pathway to a target | `/net-zero` |
| **Report** | Printable/PDF report: all, selected, or one decision; GHG Protocol Scope 1/2/3; sources | `/report` |

Also: live grid "timing tips" (cleanest hour in the last 24 h), Scope 1/2/3 classification on every line,
offset-cost estimate, everyday equivalents (km driven, trees, days of a 1.5 °C budget).

---

## Architecture

```
Browser (Next.js, client components)
  │  Supabase Auth session; transient chat turns stay in memory
  │
  ▼  REST (JSON)
FastAPI backend (backend/main.py)
  ├─ LLM (Groq): prediction extraction + grounded follow-up chat; revisions use the emission engine
  ├─ Supabase Auth: verifies bearer tokens; PostgreSQL stores user-owned predictions, recommendations, choices, goals and budgets
  ├─ travel.py: swaps LLM guesses for real data (distances, airports, flight emissions), builds maps
  ├─ external.py: API clients with caching, timeouts and fallbacks
  └─ emission_factors.py: factor table + deterministic engine (compute_activity)
```

### Prediction pipeline (`POST /api/ai/predict`)
1. `_extract_activities` sends `PREDICT_PROMPT` (factor catalogue + rules) to Groq; output is validated
  (`validate_activity`, double-count guard `_double_count_error`), retried once with the error, then
  advances through the configured backup models if the call or output fails.
2. For trips, `travel.enrich_trip` geocodes the places and replaces road distance/time (OpenRouteService), 
   flight distance (OurAirports) and flight emissions (Google Travel Impact Model).
3. `_evaluate` → `compute_activity` for every line: kg, scope, working text, source.
4. Trip options are ranked; `_most_viable` picks the recommendation if the user didn't choose a mode.
5. Alternatives are recalculated by the engine (as full lists or `swaps`), filtered (< 5% savings dropped,
   high-effort only if fewer than 2 easier ones), ranked by savings × effort weight, top 3 kept.
6. Response (`AIPrediction`) includes breakdown, scopes, trip options, map, live grid, cost, missing info.

### Engine rules worth knowing (`emission_factors.py`, `main.py`)
- Per-vehicle factors (`vehicle-km`) are never multiplied by headcount (`PEOPLE_WORDS` guard). 
- `bus` ≥ 50 km becomes `coach`, `coach` < 50 km becomes `bus`.
- Flights: Google TIM per-passenger figure when available (CO₂e from fuel, excludes contrail warming);
  otherwise DESNZ factors by distance band (include radiative forcing). The UI explains the ~1.7× difference.
- India grid = CEA v22 (0.675 kg/kWh); other countries = Ember latest year; else built-in table.
- Door-to-door time = in-vehicle time + fixed access time (`ACCESS_HOURS`: flight 2.5 h, train 1 h, coach 0.75 h).
- Ready-mix concrete already includes cement; listing both is rejected.
- Never suggest reducing structural sizes (safety) or cancelling the activity.


## Project structure

```
run.ps1 / run.cmd          one-command setup + run (backend :8000, frontend :3000)
backend/
  main.py                  FastAPI app: endpoints, LLM prompts, prediction + meeting logic
  emission_factors.py      110 emission factors, scopes, compute_activity (the engine)
  external.py              OpenRouteService, OurAirports, Google TIM, Ember, Electricity Maps, CEA constant
  travel.py                real distances/flights into trip options and meetings; map building
  models.py                Pydantic request/response models
  requirements.txt         fastapi, uvicorn, pydantic, openai (Groq-compatible client), python-dotenv
  .env.example             all keys, documented
  data/                    cached airport list (gitignored, downloaded on first use)
  test_*.py                manual API/LLM probe scripts (not an automated suite)
frontend/src/
  app/                     pages: / ai meeting calculate dashboard result recommendations ghost net-zero report
  components/ai/           prediction UI (input, result, trip options, breakdown table, choice picker...)
  components/charts/       dependency-free SVG charts (bar, cumulative, ghost, MACC) + axis helpers
  components/map/          Leaflet route map (MapTiler tiles), booking links
  components/dashboard/    stat tiles, budget meter, target planner
  components/ui/           design system: Card, Button, PageHeader, Sidebar, Logo, Icon, loader, CountUp...
  lib/                     API clients, database-backed history and budget with in-memory view caches, stats, filters, ghost, macc, utils
  types/                   TypeScript types mirroring backend models
```


## API

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/ai/predict` | Main prediction. Body: `{ prompt, distanceKm? }` → `AIPrediction` |
| POST | `/api/meeting` | Meeting point. Body: `{ attendees: [{city, count}], nights, candidates?, plannedCity? }` |
| POST | `/api/calculate` | Exact calculation. Body: `{ activityType, amount, unit, category, region? }` |
| GET | `/api/factors` | All activity types (key, label, unit, category, kg/unit, source, scope) |
| GET | `/api/ai/recommendations` | Legacy generic tips (not used by the current UI) |
| GET | `/api/dashboard` | Legacy mock data (not used; the dashboard is built from local history) |

Errors use FastAPI `{ "detail": "..." }`; the frontend shows `detail` to the user.


## Data sources

  Cornell Hotel Benchmarking (hotels), IEA (streaming)

Every external call is cached and has a short timeout; if a key is missing or a service fails, the engine
falls back to its built-in factors and the line's source says so.


## Frontend conventions

  `sprout`, `sage`, `clay`, `paper`, `surface`, `line`). Headings use Fraunces (`font-display`), body Geist.
  Use `Card`, `Button`, `PageHeader` and the `.field` class for inputs instead of ad-hoc styles.
  colour-blind separation; don't change them casually. Charts are hand-written SVG with hover tooltips.
  using `useSyncExternalStore` (lint forbids setState inside effects). No user accounts or database.
  `prefers-reduced-motion`.
  `frontend/.env.local` sets it to `false` to use the real backend.


## Getting started

Requires Python 3.11+ and Node.js 20+. Run one command from the project folder:

```powershell
.\run.cmd
```

(or `.\run.ps1` in PowerShell, or double-click `run.cmd`)

It sets everything up on the first run and then starts the app:

Press **Ctrl+C** to stop both. Options: `-Reload` (restart the backend when Python files change),
`-NoBrowser` (don't open the browser).

### Keys

AI predictions need a Groq API key: set `GROQ_API_KEY` in `backend\.env`.

Optional keys make the numbers more accurate (see `backend\.env.example` for where to get each one).
Without them the app falls back to its built-in data:
  (flight emissions as shown on Google Flights), `EMBER_API_KEY` (grid intensity by country),
  `ELECTRICITYMAPS_API_KEY` + `ELECTRICITYMAPS_ZONE` (live grid for timing tips), `DEFAULT_REGION`
  (e.g. `IN`; country used when a description doesn't say), `GROQ_MODEL` (model override)
  domains in the MapTiler dashboard). Without it the map uses OpenStreetMap's own tiles.

Never commit `backend\.env` or `frontend\.env.local` (both are gitignored).

### Manual setup
1. **Backend:** `cd backend` → `.\venv\Scripts\uvicorn main:app --port 8000`
2. **Frontend:** `cd frontend` → `npm run dev`

### Checks


## Known limitations

  Heavy demo use hits the limit (the UI shows "busy, try again").
