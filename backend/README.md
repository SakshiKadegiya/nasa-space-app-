
# CLPS Lunar Mission Browser — Backend

FastAPI backend for calculating lunar south-pole
Sun and Earth geometry using SpiceyPy.

## Requirements

- Python 3.10+
- FastAPI
- SpiceyPy
- NumPy
- NASA/JPL SPICE kernels

## Installation

Create a virtual environment:

python -m venv venv

Activate it, then install:

pip install -r requirements.txt

Copy environment configuration:

cp .env.example .env

On Windows PowerShell:

Copy-Item .env.example .env

## Kernel setup

Place these files in the kernels directory:

- naif0012.tls
- de440s.bsp
- pck00011.tpc
- moon_pa_de421_1900-2050.bpc

Check that all kernel files are present and valid.

## Start the API

From the backend directory:

uvicorn app.main:app --reload

API:

http://127.0.0.1:8000

Swagger documentation:

http://127.0.0.1:8000/docs

## Endpoints

GET /health

GET /api/sites

GET /api/geometry

GET /api/compare

GET /api/timeline

## Geometry assumptions

- SPICE aberration correction: NONE
- Ephemeris: DE440s
- Lunar frame: MOON_PA_DE421
- Lunar surface: spherical reference radius
- Terrain obstruction: not included

Geometric horizon visibility does not guarantee
actual visibility above lunar terrain.
Candidate site coordinates must be independently
verified before scientific use.
