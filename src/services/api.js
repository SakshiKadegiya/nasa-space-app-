
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `API Error ${response.status}: ${message}`
    );
  }

  return response.json();
}

export const getHealth = () => request("/health");

// Always return an array of sites.
export const getSites = async () => {
  const data = await request("/api/sites");

  if (Array.isArray(data)) return data;

  if (data && Array.isArray(data.sites)) {
    return data.sites;
  }

  throw new Error("Invalid sites response from backend.");
};

// Calculate geometry for one selected site.
export const getGeometry = ({
  latitude,
  longitude,
  datetimeUTC,
}) => {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    datetime_utc: datetimeUTC,
  });

  return request(`/api/geometry?${params.toString()}`);
};

// Calculate geometry for ALL candidate sites.
export const getComparison = (datetimeUTC, siteIds = []) => {
  const params = new URLSearchParams({
    datetime_utc: datetimeUTC,
  });

  if (siteIds.length > 0) {
    params.set("site_ids", siteIds.join(","));
  }

  return request(`/api/compare?${params.toString()}`);
};

// Calculate the timeline for one site.
export const getTimeline = ({
  siteId,
  startUTC,
  hours = 24,
}) => {
  const params = new URLSearchParams({
    site_id: siteId,
    start_utc: startUTC,
    hours: String(hours),
  });

  return request(`/api/timeline?${params.toString()}`);
};

export const getTerrain = (siteId, gridSize = 128) => {
  const params = new URLSearchParams({
    grid_size: String(gridSize),
  });

  return request(`/api/terrain/${siteId}?${params}`);
};

export const getTerrainSunlight = (siteId, datetimeUTC) => {
  const params = new URLSearchParams({
    datetime_utc: datetimeUTC,
  });

  return request(`/api/terrain-sunlight/${siteId}?${params}`);
};