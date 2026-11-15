
from pathlib import Path

import rasterio
import numpy as np

from pyproj import CRS, Transformer


BASE_DIR = Path(__file__).resolve().parent

terrain_file = (
    BASE_DIR
    / "data"
    / "terrain"
    / "Site20_final_adj_5mpp_surf.tif"
)

latitude = -85.4266
longitude = 31.74276

MOON_GEOGRAPHIC = CRS.from_proj4(
    "+proj=longlat +R=1737400 +no_defs +type=crs"
)

with rasterio.open(terrain_file) as src:

    transformer = Transformer.from_crs(
        MOON_GEOGRAPHIC,
        src.crs,
        always_xy=True,
        allow_ballpark=True
    )

    x, y = transformer.transform(
        longitude,
        latitude
    )

    row, col = src.index(x, y)

    print("\nLEIBNITZ DEM INSPECTION")
    print("-----------------------")

    print("Raster size:", src.width, src.height)
    print("Pixel size:", src.res)
    print("Observer row:", row)
    print("Observer column:", col)

    window = src.read(
        1,
        window=(
            (row - 3, row + 4),
            (col - 3, col + 4)
        ),
        masked=True
    )

    print("\n7 x 7 elevation window (metres):")

    print(
        np.array2string(
            window.filled(np.nan),
            precision=2,
            suppress_small=True
        )
    )

    observer_elevation = float(
        src.read(
            1,
            window=((row, row + 1), (col, col + 1))
        )[0, 0]
    )

    print("\nObserver elevation:", observer_elevation)

    print(
        "Local minimum:",
        float(window.min())
    )

    print(
        "Local maximum:",
        float(window.max())
    )

