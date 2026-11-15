
from pathlib import Path

import rasterio
from pyproj import CRS, Transformer

terrain_dir = Path("data/terrain")

files = {
    "shackleton-rim": "Site04_final_adj_5mpp_surf.tif",
    "leibnitz-plateau": "Site20_final_adj_5mpp_surf.tif",
    "malapert-massif": "Site23_final_adj_5mpp_surf.tif",
}

moon_geographic = CRS.from_proj4(
    "+proj=longlat +R=1737400 +no_defs +type=crs"
)

print("\n========== DEM CENTER INSPECTION ==========")

for site_id, filename in files.items():

    path = terrain_dir / filename

    with rasterio.open(path) as src:

        center_x = (src.bounds.left + src.bounds.right) / 2
        center_y = (src.bounds.bottom + src.bounds.top) / 2

        inverse_transformer = Transformer.from_crs(
            src.crs,
            moon_geographic,
            always_xy=True,
            allow_ballpark=True
        )

        longitude, latitude = inverse_transformer.transform(
            center_x,
            center_y
        )

        row, col = src.index(center_x, center_y)

        elevation = src.read(1, window=((row, row + 1), (col, col + 1)))[0, 0]

        print(f"\nSite: {site_id}")
        print(f"File: {filename}")
        print(f"Center X: {center_x:.2f} m")
        print(f"Center Y: {center_y:.2f} m")
        print(f"Latitude: {latitude:.6f}")
        print(f"Longitude: {longitude:.6f}")
        print(f"Center elevation: {elevation:.2f} m")
        print(f"CRS: {src.crs}")

print("\n========== INSPECTION COMPLETE ==========")
