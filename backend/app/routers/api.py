from app.services.terrain_service import get_terrain

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Query

from app.data.sites import get_all_sites, get_site_by_id
from app.services.spice_service import (
    calculate_geometry,
    parse_datetime,
)

from app.services.terrain_sunlight_service import calculate_terrain_sunlight
router = APIRouter(prefix="/api", tags=["Mission Analysis"])


def get_utc_datetime(value: str):
    try:
        return parse_datetime(value)
    except (ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid UTC datetime: {value}"
        ) from exc


def analyze_site(site: dict, datetime_utc: str):
    try:
        geometry = calculate_geometry(
            latitude=site["latitude"],
            longitude=site["longitude"],
            datetime_utc=datetime_utc,
        )

        sun = geometry["sun"]
        earth = geometry["earth"]

        return {
            "site": site,
            "geometry": geometry,
            "mission_indicators": {
                "sunlight_available": sun["above_horizon"],
                "earth_geometrically_visible": earth["above_horizon"],
                "solar_elevation_deg": sun["elevation_deg"],
                "earth_elevation_deg": earth["elevation_deg"],
                "solar_azimuth_deg": sun["azimuth_deg"],
                "earth_azimuth_deg": earth["azimuth_deg"],
            }
        }

    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"SPICE calculation failed for {site['id']}: {exc}"
        ) from exc


@router.get("/sites")
def list_sites():
    return {
        "count": len(get_all_sites()),
        "sites": get_all_sites()
    }


@router.get("/geometry")
def get_geometry(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    datetime_utc: str = Query(...)
):
    try:
        return calculate_geometry(
            latitude=latitude,
            longitude=longitude,
            datetime_utc=datetime_utc
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"SPICE calculation failed: {exc}"
        ) from exc


@router.get("/compare")
def compare_sites(
    datetime_utc: str = Query(...),
    site_ids: str | None = Query(
        default=None,
        description="Optional comma-separated site IDs"
    )
):
    dt = get_utc_datetime(datetime_utc)

    sites = get_all_sites()

    if site_ids:
        requested_ids = [
            item.strip()
            for item in site_ids.split(",")
            if item.strip()
        ]

        unknown = [
            item for item in requested_ids
            if get_site_by_id(item) is None
        ]

        if unknown:
            raise HTTPException(
                status_code=404,
                detail=f"Unknown site IDs: {unknown}"
            )

        sites = [
            get_site_by_id(site_id)
            for site_id in requested_ids
        ]

    results = [
        analyze_site(
            site,
            dt.isoformat().replace("+00:00", "Z")
        )
        for site in sites
    ]

    return {
        "datetime_utc": dt.isoformat(),
        "count": len(results),
        "sites": results,
        "comparison_basis": (
            "Same UTC instant; geometric horizon only"
        )
    }


@router.get("/timeline")
def get_timeline(
    site_id: str = Query(...),
    start_utc: str = Query(...),
    hours: int = Query(default=24, ge=1, le=168)
):
    site = get_site_by_id(site_id)

    if site is None:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown site ID: {site_id}"
        )

    start = get_utc_datetime(start_utc)

    samples = []

    # Include both the beginning and ending sample.
    for hour in range(hours + 1):
        sample_time = start + timedelta(hours=hour)
        sample_utc = (
            sample_time.isoformat().replace("+00:00", "Z")
        )

        result = analyze_site(site, sample_utc)

        indicators = result["mission_indicators"]

        samples.append({
            "datetime_utc": sample_utc,
            "hours_from_start": hour,
            "solar_elevation_deg":
                indicators["solar_elevation_deg"],
            "solar_azimuth_deg":
                indicators["solar_azimuth_deg"],
            "earth_elevation_deg":
                indicators["earth_elevation_deg"],
            "earth_azimuth_deg":
                indicators["earth_azimuth_deg"],
            "sunlight_available":
                indicators["sunlight_available"],
            "earth_geometrically_visible":
                indicators["earth_geometrically_visible"],
        })

    sunlight_hours = sum(
        1 for item in samples[:-1]
        if item["sunlight_available"]
    )

    earth_visible_hours = sum(
        1 for item in samples[:-1]
        if item["earth_geometrically_visible"]
    )

    return {
        "site": site,
        "start_utc": start.isoformat(),
        "end_utc": (
            start + timedelta(hours=hours)
        ).isoformat(),
        "requested_hours": hours,
        "sample_count": len(samples),
        "estimated_sunlit_sample_hours": sunlight_hours,
        "estimated_earth_visible_sample_hours": earth_visible_hours,
        "sampling_interval_hours": 1,
        "sampling_note": (
            "Hourly samples are discrete estimates, not "
            "continuous visibility durations."
        ),
        "samples": samples
    }


@router.get("/terrain/{site_id}")
def get_site_terrain(
    site_id: str,
    grid_size: int = Query(default=128, ge=32, le=256)
):
    """
    Return a downsampled lunar elevation grid
    for the selected candidate site.
    """
    return get_terrain(
        site_id=site_id,
        grid_size=grid_size
    )



@router.get("/terrain-sunlight/{site_id}")
def get_terrain_sunlight(
    site_id: str,
    datetime_utc: str = Query(...)
):
    """
    Calculate terrain-aware sunlight visibility
    using SPICE solar geometry and NASA LOLA terrain.
    """

    # 1. Find the requested candidate site.
    site = get_site_by_id(site_id)

    if site is None:
        raise HTTPException(
            status_code=404,
            detail="Unknown lunar site"
        )

    try:
        # 2. Calculate solar geometry using SPICE.
        geometry = calculate_geometry(
            latitude=site["latitude"],
            longitude=site["longitude"],
            datetime_utc=datetime_utc,
        )

        sun = geometry["sun"]

        # 3. Calculate terrain obstruction.
        terrain_result = calculate_terrain_sunlight(
            site_id=site_id,
            latitude=site["latitude"],
            longitude=site["longitude"],
            solar_azimuth_deg=sun["azimuth_deg"],
            solar_elevation_deg=sun["elevation_deg"],
        )

        # 4. Return combined scientific results.
        return {
            "site": site,

            "datetime_utc": geometry["input"]["datetime_utc"],

            "geometric_sunlight": {
                "azimuth_deg": sun["azimuth_deg"],
                "elevation_deg": sun["elevation_deg"],
                "above_horizon": sun["above_horizon"],
            },

            "terrain_analysis": terrain_result,

            "comparison": {
                "geometric_sunlight": sun["above_horizon"],
                "terrain_aware_sunlight": (
                    terrain_result["sunlight_available"]
                ),
            },

            "method": {
                "ephemeris": "DE440s",
                "terrain_source": "NASA LOLA 5m/pixel DEM",
                "analysis": "Directional terrain horizon obstruction",
            },
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Terrain sunlight API failed: {str(exc)}"
        )


# export const getTerrainSunlight = (siteId, datetimeUTC) => {
#   const params = new URLSearchParams({
#     datetime_utc: datetimeUTC,
#   });

#   return request(
#     `/api/terrain-sunlight/${siteId}?${params}`
#   );
# };
