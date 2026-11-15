
from pathlib import Path
import math

import numpy as np
import rasterio

from pyproj import CRS, Geod, Transformer

from fastapi import HTTPException


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]
TERRAIN_DIR = BASE_DIR / "data" / "terrain"

LUNAR_RADIUS_M = 1_737_400.0

MAX_DISTANCE_M = 5_000.0
SAMPLE_STEP_M = 5.0

TERRAIN_FILES = {
    "shackleton-rim": "Site04_final_adj_5mpp_surf.tif",
    "leibnitz-plateau": "Site20_final_adj_5mpp_surf.tif",
    "malapert-massif": "Site23_final_adj_5mpp_surf.tif",
}


# Lunar geographic coordinate system.
MOON_GEOGRAPHIC = CRS.from_proj4(
    "+proj=longlat +R=1737400 +no_defs +type=crs"
)

MOON_GEOD = Geod(
    a=LUNAR_RADIUS_M,
    b=LUNAR_RADIUS_M
)


# --------------------------------------------------
# MAIN TERRAIN SUNLIGHT CALCULATION
# --------------------------------------------------

def calculate_terrain_sunlight(
    site_id: str,
    latitude: float,
    longitude: float,
    solar_azimuth_deg: float,
    solar_elevation_deg: float,
):
    """
    Determine whether local lunar terrain obstructs sunlight.

    Solar azimuth:
        Degrees clockwise from local north.

    Solar elevation:
        Degrees above local geometric horizon.

    DEM:
        Native-resolution NASA LOLA terrain data.

    Returns:
        Terrain-aware sunlight visibility and
        horizon obstruction information.
    """

    filename = TERRAIN_FILES.get(site_id)

    if filename is None:
        raise HTTPException(
            status_code=404,
            detail="Unknown terrain site"
        )

    terrain_path = TERRAIN_DIR / filename

    if not terrain_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Terrain file not found: {filename}"
        )

    if not (
        -90 <= latitude <= 90
        and -180 <= longitude <= 180
    ):
        raise HTTPException(
            status_code=422,
            detail="Invalid lunar coordinates"
        )

    if not (
        math.isfinite(solar_azimuth_deg)
        and math.isfinite(solar_elevation_deg)
    ):
        raise HTTPException(
            status_code=422,
            detail="Invalid solar geometry"
        )

    solar_azimuth_deg %= 360.0

    if solar_elevation_deg < -90 or solar_elevation_deg > 90:
        raise HTTPException(
            status_code=422,
            detail="Solar elevation must be between -90 and 90 degrees"
        )

    # No direct sunlight when the Sun is below
    # the geometric horizon.
    if solar_elevation_deg <= 0:

        return {
            "site_id": site_id,
            "sunlight_status": "night",
            "terrain_blocked": False,
            "sunlight_available": False,
            "solar_azimuth_deg": round(solar_azimuth_deg, 3),
            "solar_elevation_deg": round(solar_elevation_deg, 3),
            "observer_elevation_m": None,
            "max_horizon_angle_deg": None,
            "horizon_peak_distance_m": None,
            "horizon_peak_terrain_elevation_m": None,
            "blocking_distance_m": None,
            "blocking_terrain_elevation_m": None,
            "sample_step_m": SAMPLE_STEP_M,
            "max_distance_m": MAX_DISTANCE_M,
            "valid_samples": 0,
            "coverage_complete": False,
            "message": "Sun is below the geometric horizon."
        }

    try:

        with rasterio.open(terrain_path) as src:

            # --------------------------------------
            # TRANSFORM OBSERVER COORDINATES
            # --------------------------------------

            transformer = Transformer.from_crs(
                MOON_GEOGRAPHIC,
                src.crs,
                always_xy=True,
                allow_ballpark=True
            )

            observer_x, observer_y = transformer.transform(
                longitude,
                latitude
            )

            row, col = src.index(
                observer_x,
                observer_y
            )

            if not (
                0 <= row < src.height
                and 0 <= col < src.width
            ):
                raise HTTPException(
                    status_code=422,
                    detail="Observer location is outside the terrain DEM"
                )

            observer_data = src.read(
                1,
                window=((row, row + 1), (col, col + 1)),
                masked=True
            )

            observer_value = observer_data[0, 0]

            if np.ma.is_masked(observer_value):
                raise HTTPException(
                    status_code=422,
                    detail="Observer location has no valid elevation data"
                )

            observer_elevation = float(observer_value)

            if not math.isfinite(observer_elevation):
                raise HTTPException(
                    status_code=422,
                    detail="Observer elevation is invalid"
                )

            # --------------------------------------
            # CREATE TERRAIN SAMPLING DISTANCES
            # --------------------------------------

            distances = np.arange(
                SAMPLE_STEP_M,
                MAX_DISTANCE_M + SAMPLE_STEP_M,
                SAMPLE_STEP_M
            )

            # --------------------------------------
            # PROJECT SUNLIGHT DIRECTION
            # --------------------------------------

            sample_lons, sample_lats, _ = MOON_GEOD.fwd(
                np.full(len(distances), longitude),
                np.full(len(distances), latitude),
                np.full(len(distances), solar_azimuth_deg),
                distances
            )

            sample_x, sample_y = transformer.transform(
                sample_lons,
                sample_lats
            )

            # --------------------------------------
            # SAMPLE THE DEM
            # --------------------------------------

            coordinates = list(zip(sample_x, sample_y))

            terrain_samples = list(
                src.sample(
                    coordinates,
                    indexes=1,
                    masked=True
                )
            )

            max_horizon_angle = -90.0

            # Highest terrain horizon sample, whether
            # or not it actually blocks the Sun.
            horizon_peak_distance = None
            horizon_peak_elevation = None

            # Actual obstruction information.
            blocking_distance = None
            blocking_elevation = None

            valid_samples = 0
            coverage_complete = True

            for distance, x, y, sample in zip(
                distances,
                sample_x,
                sample_y,
                terrain_samples
            ):

                # Check DEM coverage.
                if not (
                    src.bounds.left <= x <= src.bounds.right
                    and src.bounds.bottom <= y <= src.bounds.top
                ):
                    coverage_complete = False
                    break

                terrain_value = sample[0]

                if np.ma.is_masked(terrain_value):
                    coverage_complete = False
                    continue

                terrain_elevation = float(terrain_value)

                if not math.isfinite(terrain_elevation):
                    coverage_complete = False
                    continue

                valid_samples += 1

                # ----------------------------------
                # LUNAR CURVATURE CORRECTION
                # ----------------------------------

                curvature_drop = (
                    distance ** 2
                    / (2.0 * LUNAR_RADIUS_M)
                )

                relative_height = (
                    terrain_elevation
                    - observer_elevation
                    - curvature_drop
                )

                horizon_angle = math.degrees(
                    math.atan2(
                        relative_height,
                        distance
                    )
                )

                # Record the highest terrain horizon.
                if horizon_angle > max_horizon_angle:

                    max_horizon_angle = horizon_angle

                    horizon_peak_distance = float(distance)

                    horizon_peak_elevation = terrain_elevation

            # --------------------------------------
            # DETERMINE SUNLIGHT VISIBILITY
            # --------------------------------------

            if valid_samples == 0:

                return {
                    "site_id": site_id,
                    "sunlight_status": "insufficient_coverage",
                    "terrain_blocked": None,
                    "sunlight_available": None,
                    "solar_azimuth_deg": round(solar_azimuth_deg, 3),
                    "solar_elevation_deg": round(solar_elevation_deg, 3),
                    "observer_elevation_m": round(observer_elevation, 3),
                    "max_horizon_angle_deg": None,
                    "horizon_peak_distance_m": None,
                    "horizon_peak_terrain_elevation_m": None,
                    "blocking_distance_m": None,
                    "blocking_terrain_elevation_m": None,
                    "sample_step_m": SAMPLE_STEP_M,
                    "max_distance_m": MAX_DISTANCE_M,
                    "valid_samples": 0,
                    "coverage_complete": False,
                    "message": (
                        "No valid terrain samples along the solar direction."
                    )
                }

            terrain_blocked = (
                max_horizon_angle >= solar_elevation_deg
            )

            # Only report a blocking location when
            # the highest horizon actually obstructs the Sun.
            if terrain_blocked:

                blocking_distance = horizon_peak_distance

                blocking_elevation = horizon_peak_elevation

            # --------------------------------------
            # DETERMINE FINAL STATUS
            # --------------------------------------

            if terrain_blocked:

                status = "blocked"
                sunlight_available = False

            elif coverage_complete:

                status = "visible"
                sunlight_available = True

            else:

                status = "insufficient_coverage"
                sunlight_available = None

            # --------------------------------------
            # RETURN RESULTS
            # --------------------------------------

            return {
                "site_id": site_id,

                "sunlight_status": status,

                "terrain_blocked": (
                    terrain_blocked
                    if status != "insufficient_coverage"
                    or terrain_blocked
                    else None
                ),

                "sunlight_available": sunlight_available,

                "solar_azimuth_deg": round(
                    solar_azimuth_deg, 3
                ),

                "solar_elevation_deg": round(
                    solar_elevation_deg, 3
                ),

                "observer_elevation_m": round(
                    observer_elevation, 3
                ),

                "max_horizon_angle_deg": round(
                    max_horizon_angle, 3
                ),

                # Highest horizon sample, not necessarily
                # an obstruction.
                "horizon_peak_distance_m": (
                    round(horizon_peak_distance, 2)
                    if horizon_peak_distance is not None
                    else None
                ),

                "horizon_peak_terrain_elevation_m": (
                    round(horizon_peak_elevation, 3)
                    if horizon_peak_elevation is not None
                    else None
                ),

                # Actual blocking location only.
                "blocking_distance_m": (
                    round(blocking_distance, 2)
                    if blocking_distance is not None
                    else None
                ),

                "blocking_terrain_elevation_m": (
                    round(blocking_elevation, 3)
                    if blocking_elevation is not None
                    else None
                ),

                "sample_step_m": SAMPLE_STEP_M,

                "max_distance_m": MAX_DISTANCE_M,

                "valid_samples": valid_samples,

                "coverage_complete": coverage_complete,

                "message": (
                    "Terrain obstructs direct sunlight."
                    if terrain_blocked
                    else (
                        "Sunlight reaches the observer within the "
                        "analyzed terrain coverage."
                        if status == "visible"
                        else (
                            "Terrain coverage is insufficient to "
                            "confirm visibility."
                        )
                    )
                )
            }

    except HTTPException:
        raise

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Terrain sunlight calculation failed: {str(exc)}"
        )
