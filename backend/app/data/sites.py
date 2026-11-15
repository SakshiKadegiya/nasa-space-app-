
SITES = [
    {
        "id": "shackleton-rim",
        "name": "Shackleton Rim",
        "latitude": -89.7668,
"longitude": -171.8700,
        "description": "Illustrative site near the lunar south pole.",
        "coordinate_status": "illustrative",
        "region": "South Pole"
    },
    {
        "id": "malapert-massif",
        "name": "Malapert Massif",
       "latitude": -85.9948,
"longitude": -0.23578,
        "description": "Illustrative elevated south-polar location.",
        "coordinate_status": "illustrative",
        "region": "South Pole"
    },
    {
        "id": "leibnitz-plateau",
        "name": "Leibnitz Plateau",
       "latitude": -85.4266,
"longitude": 31.74276,
        "description": "Illustrative lunar south-polar location.",
        "coordinate_status": "illustrative",
        "region": "South Pole"
    }
]


def get_all_sites():
    return SITES


def get_site_by_id(site_id: str):
    for site in SITES:
        if site["id"] == site_id:
            return site

    return None
