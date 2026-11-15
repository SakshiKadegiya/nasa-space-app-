
import { useEffect, useState } from "react";

import {
  getSites,
  getComparison,
  getTimeline,
} from "../services/api";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import "./MissionAnalysis.css";

// Safely handle either an array or an object containing an array.
function extractArray(data, property) {
  if (Array.isArray(data)) return data;

  if (data && Array.isArray(data[property])) {
    return data[property];
  }

  return [];
}

function toUTC(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid observation date and time.");
  }

  return date.toISOString();
}

function formatHour(value) {
  return `${String(value).padStart(2, "0")}:00`;
}

export default function MissionAnalysis() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");

  const [datetime, setDatetime] = useState(
    "2028-03-15T14:00"
  );

  const [comparison, setComparison] = useState(null);
  const [timeline, setTimeline] = useState(null);

  const [loadingSites, setLoadingSites] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const [error, setError] = useState("");

  // Load candidate sites.
  useEffect(() => {
    let cancelled = false;

    async function loadSites() {
      try {
        setLoadingSites(true);
        setError("");

        const result = await getSites();

        // Supports both:
        // { count: 3, sites: [...] }
        // and [...]
        const siteList = extractArray(result, "sites");

        if (!cancelled) {
          setSites(siteList);

          if (siteList.length > 0) {
            setSelectedSite(siteList[0].id);
          } else {
            setError("The API returned no candidate sites.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(`Unable to load candidate sites: ${err.message}`);
        }
      } finally {
        if (!cancelled) {
          setLoadingSites(false);
        }
      }
    }

    loadSites();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load comparison and timeline.
  useEffect(() => {
    if (!selectedSite || !datetime) return;

    let cancelled = false;

    async function loadAnalysis() {
      try {
        setLoadingAnalysis(true);
        setError("");

        const utc = toUTC(datetime);

        const [comparisonResult, timelineResult] =
          await Promise.all([
            getComparison(utc),
            getTimeline({
              siteId: selectedSite,
              startUTC: utc,
              hours: 24,
            }),
          ]);

        // Validate comparison response.
        const comparisonSites = extractArray(
          comparisonResult,
          "sites"
        );

        if (!comparisonSites.length) {
          throw new Error(
            "Comparison API did not return a valid sites array."
          );
        }

        // Validate timeline response.
        const timelineSamples = extractArray(
          timelineResult,
          "samples"
        );

        if (!timelineSamples.length) {
          throw new Error(
            "Timeline API did not return valid samples."
          );
        }

        if (!cancelled) {
          setComparison({
            ...comparisonResult,
            sites: comparisonSites,
          });

          setTimeline({
            ...timelineResult,
            samples: timelineSamples,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            `Unable to load mission geometry: ${err.message}`
          );

          setComparison(null);
          setTimeline(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingAnalysis(false);
        }
      }
    }

    loadAnalysis();

    return () => {
      cancelled = true;
    };
  }, [selectedSite, datetime]);

  // Loading state.
  if (loadingSites) {
    return (
      <div className="analysis-message">
        Loading lunar candidate sites...
      </div>
    );
  }

  // No sites returned.
  if (!sites.length) {
    return (
      <div className="analysis-error">
        {error || "No candidate sites were returned by the API."}
      </div>
    );
  }

  // Prepare chart data safely.
  const chartData = Array.isArray(timeline?.samples)
    ? timeline.samples.map((sample) => ({
        hour: formatHour(sample.hours_from_start),
        solarElevation: sample.solar_elevation_deg,
        earthElevation: sample.earth_elevation_deg,
      }))
    : [];

  return (
    <main className="mission-analysis">

      <header className="analysis-header">
        <div>
          <span className="analysis-eyebrow">
            CLPS / MISSION ANALYSIS
          </span>

          <h1>Lunar Mission Intelligence</h1>

          <p>
            Compare lunar surface illumination and
            geometric Earth visibility.
          </p>
        </div>

        <span className="live-indicator">
          SPICE DATA
        </span>
      </header>

      <section className="analysis-controls">

        <label>
          Candidate location

          <select
            value={selectedSite}
            onChange={(event) =>
              setSelectedSite(event.target.value)
            }
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Observation date and time

          <input
            type="datetime-local"
            value={datetime}
            onChange={(event) =>
              setDatetime(event.target.value)
            }
          />
        </label>

      </section>

      {error && (
        <div className="analysis-error">
          {error}
        </div>
      )}

      {loadingAnalysis && (
        <div className="analysis-message">
          Calculating mission geometry...
        </div>
      )}

      {!loadingAnalysis && comparison && (
        <section className="analysis-section">

          <div className="section-title">
            <div>
              <span>01 / SITE INTELLIGENCE</span>
              <h2>Candidate Site Comparison</h2>
            </div>
          </div>

          <div className="site-grid">

            {comparison.sites.map((item) => {
              const indicators = item.mission_indicators;

              if (!indicators) return null;

              return (
                <article
                  className={`site-card ${
                    item.site.id === selectedSite
                      ? "selected-site"
                      : ""
                  }`}
                  key={item.site.id}
                >

                  <h3>{item.site.name}</h3>

                  <p className="site-coordinates">
                    {item.site.latitude}°,
                    {" "}
                    {item.site.longitude}°
                  </p>

                  <div className="metric-row">
                    <span>Solar elevation</span>
                    <strong>
                      {Number(indicators.solar_elevation_deg).toFixed(2)}°
                    </strong>
                  </div>

                  <div className="metric-row">
                    <span>Earth elevation</span>
                    <strong>
                      {Number(indicators.earth_elevation_deg).toFixed(2)}°
                    </strong>
                  </div>

                  <div className="metric-row">
                    <span>Sunlight</span>
                    <strong>
                      {indicators.sunlight_available
                        ? "Above geometric horizon"
                        : "Below geometric horizon"}
                    </strong>
                  </div>

                  <div className="metric-row">
                    <span>Earth visibility</span>
                    <strong>
                      {indicators.earth_geometrically_visible
                        ? "Above geometric horizon"
                        : "Below geometric horizon"}
                    </strong>
                  </div>

                  <button
                    onClick={() =>
                      setSelectedSite(item.site.id)
                    }
                  >
                    Analyze this site
                  </button>

                </article>
              );
            })}

          </div>
        </section>
      )}

      {!loadingAnalysis && timeline && (
        <section className="analysis-section">

          <div className="section-title">
            <div>
              <span>02 / 24-HOUR FORECAST</span>
              <h2>Sun and Earth Elevation</h2>
            </div>
          </div>

          <div className="chart-card">

            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="hour"
                  minTickGap={25}
                />

                <YAxis
                  unit="°"
                  domain={[-90, 90]}
                />

                <Tooltip />
                <Legend />

                <Line
                  type="monotone"
                  dataKey="solarElevation"
                  name="Sun elevation"
                  stroke="#f5b942"
                  strokeWidth={2}
                  dot={false}
                />

                <Line
                  type="monotone"
                  dataKey="earthElevation"
                  name="Earth elevation"
                  stroke="#5da9e9"
                  strokeWidth={2}
                  dot={false}
                />

              </LineChart>
            </ResponsiveContainer>

            <p className="chart-caption">
              Elevation is measured relative to the
              idealized local geometric horizon.
            </p>

          </div>
        </section>
      )}

      {!loadingAnalysis && timeline && (
        <section className="analysis-section">

          <div className="section-title">
            <div>
              <span>03 / MISSION OPPORTUNITIES</span>
              <h2>Visibility Sample Summary</h2>
            </div>
          </div>

          <div className="summary-grid">

            <article className="summary-card">
              <span>Sunlit sample hours</span>

              <strong>
                {timeline.estimated_sunlit_sample_hours}
                {" / "}
                {timeline.requested_hours}
              </strong>

              <small>
                Hourly samples above geometric horizon
              </small>
            </article>

            <article className="summary-card">
              <span>Earth-visible sample hours</span>

              <strong>
                {timeline.estimated_earth_visible_sample_hours}
                {" / "}
                {timeline.requested_hours}
              </strong>

              <small>
                Hourly samples above geometric horizon
              </small>
            </article>

          </div>

          <p className="scientific-note">
            These are discrete hourly visibility samples,
            not continuous sunlight durations, power
            predictions, or confirmed communication windows.
            Local terrain, obstacles, lander attitude,
            antenna constraints and link budgets are not
            included.
          </p>

        </section>
      )}

    </main>
  );
}
