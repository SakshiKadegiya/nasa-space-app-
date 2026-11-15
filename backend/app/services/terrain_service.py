
from pathlib import Path

import numpy as np
import rasterio
from rasterio.enums import Resampling
from fastapi import HTTPException


BASE_DIR = Path(__file__).resolve().parents[2]
TERRAIN_DIR = BASE_DIR / "data" / "terrain"

TERRAIN_FILES = {
    "shackleton-rim": "Site04_final_adj_5mpp_surf.tif",
    "leibnitz-plateau": "Site20_final_adj_5mpp_surf.tif",
    "malapert-massif": "Site23_final_adj_5mpp_surf.tif",
}




def get_terrain(site_id: str, grid_size: int = 128):
    import traceback
    from pathlib import Path

    import numpy as np
    import rasterio
    from rasterio.enums import Resampling
    from fastapi import HTTPException

    filename = TERRAIN_FILES.get(site_id)

    if filename is None:
        raise HTTPException(status_code=404, detail="Unknown terrain site")

    file_path = TERRAIN_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Terrain file not found")

    try:
        with rasterio.open(file_path) as src:
            print("TERRAIN FILE:", file_path)
            print("RASTER SIZE:", src.width, src.height)

            elevation = src.read(
                1,
                out_shape=(grid_size, grid_size),
                resampling=Resampling.average
            )

            print("DOWNSAMPLE SUCCESS:", elevation.shape)

            valid = np.isfinite(elevation)

            if not valid.any():
                raise HTTPException(
                    status_code=422,
                    detail="No valid elevation data"
                )

            mean_elevation = float(np.nanmean(elevation))
            safe_values = np.where(
                valid,
                elevation,
                mean_elevation
            )

            return {
                "site_id": site_id,
                "filename": filename,
                "width": src.width,
                "height": src.height,
                "grid_width": grid_size,
                "grid_height": grid_size,
                "crs": src.crs.to_string() if src.crs else None,
                "resolution_m": list(src.res),
                "bounds_m": {
                    "left": src.bounds.left,
                    "bottom": src.bounds.bottom,
                    "right": src.bounds.right,
                    "top": src.bounds.top
                },
                "elevation_unit": "metres",
                "elevation_min_m": float(np.nanmin(elevation)),
                "elevation_max_m": float(np.nanmax(elevation)),
                "elevation_mean_m": mean_elevation,
                "elevations": safe_values.tolist(),
                "valid_mask": valid.tolist()
            }

    except HTTPException:
        raise

    except Exception as exc:
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=f"Terrain diagnostic failed: {repr(exc)}"
        )