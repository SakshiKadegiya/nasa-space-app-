
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from threading import RLock

import numpy as np
import spiceypy as spice

from app.core.config import settings

_spice_lock = RLock()
_kernels_loaded = False

def load_kernels():
    """Load the required SPICE kernels once."""

    global _kernels_loaded

    with _spice_lock:
        if _kernels_loaded:
            return

        kernel_dir = Path(settings.KERNEL_DIR)

        required_kernels = [
            "naif0012.tls",
            "de440s.bsp",
            "pck00011.tpc",
            "moon_pa_de421_1900-2050.bpc",
            "moon_080317.tf",
        ]

        missing = [
            name for name in required_kernels
            if not (kernel_dir / name).is_file()
        ]

        if missing:
            raise FileNotFoundError(
                f"Missing SPICE kernels in {kernel_dir}: {missing}"
            )

        loaded = []

        try:
            for name in required_kernels:
                path = kernel_dir / name
                spice.furnsh(str(path))
                loaded.append(path)

        except Exception:
            spice.kclear()
            raise

        _kernels_loaded = True

def parse_datetime(datetime_utc: str) -> datetime:
    """Parse an ISO-8601 datetime and convert it to UTC."""

    value = datetime_utc.strip()

    if value.endswith("Z"):
        value = value[:-1] + "+00:00"

    parsed = datetime.fromisoformat(value)

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)

def calculate_geometry(
    latitude: float,
    longitude: float,
    datetime_utc: str,
):
    """
    Calculate Sun and Earth azimuth/elevation from a lunar surface site.

    Uses a spherical Moon reference surface. Elevation is geometric,
    not terrain-aware visibility.
    """

    with _spice_lock:
        load_kernels()

        dt = parse_datetime(datetime_utc)
        et = spice.datetime2et(dt.replace(tzinfo=None))

        frame = settings.SPICE_FRAME
        correction = settings.SPICE_CORRECTION

        # Position of the observer on a spherical Moon.
        radius = float(settings.LUNAR_RADIUS_KM)

        lat = np.radians(latitude)
        lon = np.radians(longitude)

        observer = np.array([
            radius * np.cos(lat) * np.cos(lon),
            radius * np.cos(lat) * np.sin(lon),
            radius * np.sin(lat),
        ])

        # Local east, north and up unit vectors.
        east = np.array([
            -np.sin(lon),
            np.cos(lon),
            0.0,
        ])

        north = np.array([
            -np.sin(lat) * np.cos(lon),
            -np.sin(lat) * np.sin(lon),
            np.cos(lat),
        ])

        up = np.array([
            np.cos(lat) * np.cos(lon),
            np.cos(lat) * np.sin(lon),
            np.sin(lat),
        ])

        def calculate_body(body_name: str):
            # Target position relative to Moon centre.
            position, _ = spice.spkpos(
                body_name,
                et,
                "J2000",
                correction,
                "MOON",
            )

            # Transform into lunar body-fixed coordinates.
            rotation = spice.pxform("J2000", frame, et)
            body_position = rotation @ np.asarray(position)

            # Relative position from observer to target.
            relative = body_position - observer

            distance = float(np.linalg.norm(relative))

            if distance == 0:
                raise ValueError(
                    f"Invalid zero distance for {body_name}"
                )

            direction = relative / distance

            east_component = float(np.dot(direction, east))
            north_component = float(np.dot(direction, north))
            up_component = float(np.dot(direction, up))

            azimuth = np.degrees(
                np.arctan2(east_component, north_component)
            ) % 360.0

            elevation = np.degrees(
                np.arcsin(np.clip(up_component, -1.0, 1.0))
            )

            return {
                "azimuth_deg": round(float(azimuth), 3),
                "elevation_deg": round(float(elevation), 3),
                "above_horizon": bool(elevation > 0),
                "distance_km": round(distance, 3),
            }

        return {
            "input": {
                "latitude": latitude,
                "longitude": longitude,
                "datetime_utc": dt.isoformat(),
            },
            "sun": calculate_body("SUN"),
            "earth": calculate_body("EARTH"),
            "method": {
                "ephemeris": "DE440s",
                "frame": frame,
                "correction": correction,
                "lunar_model": "Spherical Moon",
                "horizon": "Geometric; terrain not included",
            },
        }