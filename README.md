# PolarView — CLPS Lunar Mission Browser (React frontend)

A React + Vite dashboard for exploring lunar South Pole Sun/Earth geometry. It is designed to connect to the team's FastAPI backend.

## Requirements
- Node.js 18.18+ (Node 20 LTS recommended)
- npm
- Backend running locally at `http://127.0.0.1:8000`

## Setup
```bash
npm install
cp .env.example .env
npm run dev
```
On Windows PowerShell, use:
```powershell
Copy-Item .env.example .env
```
Open http://localhost:5173.

## Backend connection
Set `VITE_API_BASE_URL` in `.env`:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_ENABLE_DEMO_FALLBACK=false
```

The frontend currently expects:
- `GET /health`
- `GET /api/sites` returning `{ "sites": [{ "id", "name", "latitude", "longitude" }] }`
- `GET /api/geometry?latitude=...&longitude=...&datetime_utc=...`

Optional future endpoints:
- `GET /api/compare?datetime_utc=...`
- `GET /api/timeline?latitude=...&longitude=...&start_utc=...&hours=24&step_minutes=60`

The current timeline panel is intentionally labelled as a **snapshot**, not a computed forecast. The comparison table uses the selected site's real geometry and prompts selection of other sites until the compare endpoint is implemented.

## Demo fallback
Only set `VITE_ENABLE_DEMO_FALLBACK=true` when intentionally presenting a UI-only demo without the API. Demo geometry is synthetic and clearly labelled in the interface. Never present demo fallback values as NASA/JPL calculations.

## Build
```bash
npm run build
npm run preview
```

## Project structure
- `src/components/` reusable UI sections
- `src/hooks/` mission data state and API lifecycle
- `src/services/api.js` all HTTP calls and optional demo fallback
- `src/utils/format.js` formatting helpers
- `src/App.jsx` dashboard composition
- `src/styles.css` visual system and responsive layout

## Scientific caveat
The interface displays geometric azimuth/elevation and above/below geometric horizon from the backend. It does not claim terrain-unobstructed visibility, power-generation duration, or a guaranteed communications window. Those require validated time-series calculations, lunar terrain horizon profiles, and mission-specific constraints.
