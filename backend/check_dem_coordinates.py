
from pathlib import Path

import rasterio
from pyproj import CRS, Transformer

from app.data.sites import get_all_sites

terrain_dir = Path("data/terrain")

files = {
    "shackleton-rim": "Site04_final_adj_5mpp_surf.tif",
    "leibnitz-plateau": "Site20_final_adj_5mpp_surf.tif",
    "malapert-massif": "Site23_final_adj_5mpp_surf.tif",
}

# Moon-centered geographic coordinates.
# This is a spherical lunar model, not Earth's EPSG:4326.
moon_geographic = CRS.from_proj4(
    "+proj=longlat +R=1737400 +no_defs +type=crs"
)

sites = get_all_sites()

print("\n========== LUNAR DEM COORDINATE VALIDATION ==========")

for site in sites:
    site_id = site["id"]
    latitude = site["latitude"]
    longitude = site["longitude"]

    filename = files[site_id]
    path = terrain_dir / filename

    with rasterio.open(path) as src:

        transformer = Transformer.from_crs(
            moon_geographic,
            src.crs,
            always_xy=True,
            allow_ballpark=True
        )

        x, y = transformer.transform(longitude, latitude)

        bounds = src.bounds

        inside = (
            bounds.left <= x <= bounds.right
            and bounds.bottom <= y <= bounds.top
        )

        print(f"\nSite: {site_id}")
        print(f"Latitude: {latitude}")
        print(f"Longitude: {longitude}")
        print(f"Projected X: {x:.2f} m")
        print(f"Projected Y: {y:.2f} m")
        print(f"DEM bounds: {bounds}")
        print(f"Inside DEM: {inside}")

print("\n========== VALIDATION COMPLETE ==========")
