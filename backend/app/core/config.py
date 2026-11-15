
import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BACKEND_DIR / ".env")


class Settings:
    APP_NAME = os.getenv(
        "APP_NAME",
        "CLPS Lunar Mission Browser API"
    )

    APP_VERSION = os.getenv("APP_VERSION", "1.0.0")

    KERNEL_DIR = (
        BACKEND_DIR / os.getenv("KERNEL_DIR", "kernels")
    ).resolve()

    # KERNEL_DIR = Path(
    #     os.getenv("KERNEL_DIR", "kernels")
    # )

    if not KERNEL_DIR.is_absolute():
        KERNEL_DIR = BACKEND_DIR / KERNEL_DIR

    LUNAR_RADIUS_KM = float(
        os.getenv("LUNAR_RADIUS_KM", "1737.4")
    )

    SPICE_FRAME = os.getenv(
        "SPICE_FRAME",
        "MOON_PA_DE421"
    )

    SPICE_CORRECTION = os.getenv(
        "SPICE_CORRECTION",
        "NONE"
    )

    CORS_ORIGINS = [
        item.strip()
        for item in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173"
        ).split(",")
        if item.strip()
    ]


settings = Settings()
