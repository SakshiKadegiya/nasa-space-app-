
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getGeometry,
  getHealth,
  getSites,
  getComparison,
} from "../services/api";

export function useMissionData() {
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");

  const [datetime, setDatetime] = useState(
    "2028-03-15T14:00:00Z"
  );

  const [geometry, setGeometry] = useState(null);
  const [comparison, setComparison] = useState([]);

  const [health, setHealth] = useState({
    status: "checking",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestId = useRef(0);

  const selectedSite =
    sites.find((site) => String(site.id) === String(siteId)) ||
    sites[0] ||
    null;

  // Load candidate sites and backend health.
  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        const response = await getSites();

        const siteList = Array.isArray(response)
          ? response
          : response?.sites;

        if (!Array.isArray(siteList)) {
          throw new Error("Invalid candidate sites response.");
        }

        const normalizedSites = siteList.map((site, index) => ({
          ...site,
          id: String(site.id ?? `site_${index}`),
        }));

        if (!active) return;

        setSites(normalizedSites);

        if (normalizedSites.length > 0) {
          setSiteId(normalizedSites[0].id);
        } else {
          setError("No candidate sites were returned.");
        }
      } catch (err) {
        if (active) {
          setError(
            `Unable to load candidate sites: ${err.message}`
          );
        }
      }

      try {
        const result = await getHealth();

        if (active) {
          setHealth(result);
        }
      } catch {
        if (active) {
          setHealth({ status: "offline" });
        }
      }
    }

    loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  // Load selected-site geometry AND all-site comparison.
  const refresh = useCallback(async () => {
    if (!selectedSite) return;

    const currentRequest = ++requestId.current;

    setLoading(true);
    setError("");

    try {
      const date = new Date(datetime);

      if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid observation date and time.");
      }

      const utc = date.toISOString();

      const [geometryResult, comparisonResult] =
        await Promise.all([
          getGeometry({
            latitude: selectedSite.latitude,
            longitude: selectedSite.longitude,
            datetimeUTC: utc,
          }),

          getComparison(utc),
        ]);

      if (currentRequest !== requestId.current) return;

      if (!geometryResult?.sun || !geometryResult?.earth) {
        throw new Error("Invalid geometry response.");
      }

      if (!Array.isArray(comparisonResult?.sites)) {
        throw new Error(
          "Comparison API did not return a sites array."
        );
      }

      setGeometry(geometryResult);
      setComparison(comparisonResult.sites);
    } catch (err) {
      if (currentRequest !== requestId.current) return;

      setGeometry(null);
      setComparison([]);
      setError(
        `Unable to load mission geometry: ${err.message}`
      );
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }, [
    selectedSite?.id,
    selectedSite?.latitude,
    selectedSite?.longitude,
    datetime,
  ]);

  // Recalculate when site or observation time changes.
  useEffect(() => {
    refresh();

    return () => {
      requestId.current += 1;
    };
  }, [refresh]);

  return {
    sites,
    selectedSite,
    siteId,
    setSiteId,
    datetime,
    setDatetime,
    geometry,
    comparison,
    health,
    loading,
    error,
    refresh,
  };
}
