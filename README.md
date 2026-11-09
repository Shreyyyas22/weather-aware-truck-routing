# Weather-Aware Truck Routing

A full-stack web application built for the **Spotter Full Stack Developer Assessment**. It helps truck drivers compare three alternative routes and select the safest option based on real-time weather forecasts at arrival ETAs, truck load weight, and travel time.

![Project Status](https://img.shields.io/badge/Status-Complete-emerald?style=flat-square)
![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Django%20REST-blue?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-36%20Passing-success?style=flat-square)

---

## Architecture & Technology Stack

```
weather-aware-truck-routing/
├── backend/                  # Django + Django REST Framework API
│   ├── config/               # Project settings, URLs, CORS configuration
│   └── routing/              # Truck routing & weather risk domain
│       ├── services/         # TomTom routing & Open-Meteo weather services
│       ├── utils/            # Risk calculator, checkpoints, ETAs, recommendations
│       └── test_suite/       # 36 unit and integration test cases
├── frontend/                 # React 19 + Vite + Tailwind CSS v4
│   └── src/
│       ├── components/       # TripForm, RouteComparison, CheckpointList, MapView, HeatmapControl
│       └── utils/            # Formatters, constants, risk configurations
└── docs/
    └── assumptions.md        # Explicit product and business logic assumptions
```

- **Frontend:** React 19, Vite, Tailwind CSS v4, Leaflet + `leaflet.heat`, Lucide Icons
- **Backend:** Python 3.12, Django 6.1, Django REST Framework, django-cors-headers
- **Routing & Geocoding:** TomTom Routing API (truck mode, up to 3 alternative paths)
- **Weather Forecast:** Open-Meteo API (hourly forecasts in mph and inches/hr, 0–48 hour timeline)

---

## Key Features

1. **Trip Planning Form (Phase 9)**
   - Enter Origin, Destination, Departure Date/Time, and Truck Load Weight (lb).
   - Configurable checkpoint intervals: **10, 25, or 50 miles**.
   - 1-click test haul presets (e.g. *New York → Philadelphia*, *New York → Chicago*, *Dallas → Denver*).
   - Quick weight buttons for testing load-specific threshold rules (15k, 32k, 45k lb).

2. **Route Comparison & Recommendation Engine (Phase 10)**
   - Generates up to 3 alternative truck routes.
   - Summarizes **Severe miles**, **High-risk miles**, **Average risk score**, and **Estimated duration**.
   - Highlights the **RECOMMENDED** route with clear human-readable explanations of why it won.
   - Prohibits and flags routes containing **No Travel** conditions.
   - Evaluates recommendation priority in strict order:
     1. Fewest Severe miles
     2. Fewest High miles
     3. Lowest average risk score
     4. Shortest travel time

3. **Checkpoint Inspector Table (Phase 10)**
   - Inspect individual checkpoints along the route.
   - Shows mile progression, estimated arrival time (ETA), wind speed (mph), rain rate (in/hr), snow rate (in/hr), and individual condition risks.
   - Filter chips to quickly isolate High, Severe, or No Travel segments.
   - One-click "Locate" action to focus and open popups on the map.

4. **Interactive Map Visualization (Phase 11)**
   - Interactive Leaflet map with custom dark/voyager styling.
   - Distinct color-coded route polylines; recommended route is emphasized with glow styling.
   - Checkpoint markers color-coded by overall risk (Low: Green, Moderate: Amber, High: Orange, Severe: Red, No Travel: Purple).
   - Interactive popups with complete weather breakdown and load-rule violation details.
   - Origin and Destination pins with automatic bounds fitting.

5. **Trip Corridor Weather Heatmap & 0–48 Hour Forecast Slider (Phase 12)**
   - Spatial weather heatmap along the trip corridor.
   - Interactive **0 to 48 hour timeline slider** (1-hour step resolution).
   - **Play / Pause simulation** button to animate forecast changes across the 48 hours.
   - Switchable heatmap modes:
     - **Composite Risk:** Safety hazard intensity (Low to No Travel)
     - **Wind Speed:** Wind speed gradient (mph)
     - **Precipitation:** Combined rain and snow intensity (in/hr)
   - Real-time corridor condition summary showing peak wind, rain, snow, and hazard tier.

---

## Assessment Risk Rules & Load Rules

### Condition Thresholds

| Condition | Low | Moderate | High | Severe | No Travel |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Wind** | &lt;25 mph | 25–34 mph | 35–44 mph | 45–54 mph | **&ge;55 mph** |
| **Rain** | &lt;0.10 in/hr | 0.10–0.25 | 0.25–0.50 | 0.50–1.00 | **&gt;1.00 in/hr** |
| **Snow** | &lt;0.5 in/hr | 0.5–1.0 | 1.0–2.0 | 2.0–3.0 | **&gt;3.0 in/hr** |

### Truck Load Rules
- **Wind &ge;55 mph:** &rarr; **No Travel** for *any* load weight.
- **Wind 45–54 mph AND load &gt;30,000 lb:** &rarr; **No Travel** (escalated from Severe).
- **Wind 35–44 mph AND load &gt;40,000 lb:** &rarr; **Severe** (escalated from High).

---

## Getting Started Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- A TomTom API Key (free tier available at [developer.tomtom.com](https://developer.tomtom.com/))

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your TomTom API key
cat <<EOF > .env
TOMTOM_API_KEY="your_tomtom_api_key_here"
EOF

# Run database migrations
python manage.py migrate

# Run backend test suite (36 tests)
python manage.py test routing

# Start the Django development server
python manage.py runserver 8000
```

The backend API will run at `http://localhost:8000/api/`.
- Health check: `GET http://localhost:8000/api/health/`
- Trip planner: `POST http://localhost:8000/api/routes/plan/`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# (Optional) configure custom API URL via .env
# echo "VITE_API_URL=http://localhost:8000/api" > .env

# Run development server
npm run dev
```

The frontend will start at `http://localhost:5173`.

---

## Running the Automated Test Suite

The test suite covers risk thresholds, load rules, recommendation ordering, checkpoint interpolation, ETA calculations, weather integration, and API endpoints:

```bash
cd backend
python manage.py test routing
```

Result:
```text
Found 36 test(s).
....................................
----------------------------------------------------------------------
Ran 36 tests in 0.022s

OK
```

Frontend build verification:
```bash
cd frontend
npm run build
```

---

## Loom Walkthrough Guide (5–10 Minutes)

When recording your assessment walkthrough, follow this structured outline:

1. **Introduction (1 min):**
   - Introduce the project goal: Weather-aware truck routing comparing 3 alternative options by ETA-specific weather risk, load rules, and travel time.
   - Mention the tech stack: React + Vite + Tailwind CSS on the frontend, Django + DRF on the backend.
2. **Trip Form & Inputs (1 min):**
   - Demonstrate entering Origin (*New York, NY*), Destination (*Philadelphia, PA* or *Chicago, IL*), departure date/time, and load weight (*35,000 lb*).
   - Show the quick preset hauls and the checkpoint interval selection (10, 25, 50 miles).
3. **Route Comparison & Recommendation (2 min):**
   - Click "Plan & Compare 3 Routes".
   - Show the 3 generated route cards.
   - Point out the **RECOMMENDED** route badge and explain the winning rationale (fewest severe miles, fewest high miles, lowest average risk, shortest time).
   - Show how the metrics matrix compares distance, time, severe miles, and average risk.
4. **Checkpoint Inspection (1.5 min):**
   - Switch to the "Checkpoints" tab.
   - Explain how weather is sampled at the truck's exact estimated arrival time (ETA), not current time.
   - Demonstrate filtering checkpoints by risk (High/Severe, No Travel).
   - Click "Locate" on a checkpoint to zoom and open its popup on the map.
5. **Interactive Map (1.5 min):**
   - Show the 3 distinct route lines.
   - Click on Route 2 or Route 3 to make it active on the map.
   - Click checkpoint markers to inspect wind, rain, snow, and overall risk levels.
6. **Corridor Weather Heatmap & 0–48h Forecast Slider (1.5 min):**
   - Click the "Play" button on the 0–48 hour slider.
   - Watch the weather intensity sweep across the trip corridor over time.
   - Switch heatmap modes: *Composite Risk*, *Wind Speed*, *Precipitation*.
   - Point out the live corridor stats (Peak Wind, Peak Rain, Hazard tier).
7. **Code & Architecture Highlights (1 min):**
   - Briefly show backend test suite (36 tests passing in 20ms).
   - Point out separation of concerns: routing service, weather service, pure risk calculation engine, recommendation priority logic.

---

## Assumptions & Design Decisions

For full details on boundary conditions, mileage attribution, and No Travel exclusions, see [docs/assumptions.md](docs/assumptions.md).
