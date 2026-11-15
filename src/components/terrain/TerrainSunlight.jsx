
import { useEffect, useState } from "react";
import { Sun, Mountain, AlertTriangle, CheckCircle2 } from "lucide-react";

import { getTerrainSunlight } from "../../services/api";

import "./TerrainSunlight.css";

export default function TerrainSunlight({ siteId, datetime }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!siteId || !datetime) return;

    let cancelled = false;

    async function loadAnalysis() {
      setLoading(true);
      setError("");
      setResult(null);

      try {
        const data = await getTerrainSunlight(siteId, datetime);

        if (!cancelled) {
          setResult(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load sunlight analysis");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAnalysis();

    return () => {
      cancelled = true;
    };
  }, [siteId, datetime]);

  if (loading) {
    return (
      <div className="sunlight-state">
        Calculating terrain-aware sunlight...
      </div>
    );
  }

  if (error) {
    return (
      <div className="sunlight-error">
        <AlertTriangle size={18} />
        {error}
      </div>
    );
  }

  if (!result) return null;

  const geometry = result.geometric_sunlight;
  const terrain = result.terrain_analysis;

  const visible = terrain.sunlight_available === true;
  const blocked = terrain.sunlight_status === "blocked";

  return (
    <section className="sunlight-panel">

      <div className="sunlight-heading">
        <div>
          <span className="sunlight-eyebrow">
            TERRAIN ANALYSIS
          </span>
          <h2>Solar Visibility</h2>
          <p>
            Geometric horizon versus local terrain obstruction
          </p>
        </div>

        <Sun size={30} />
      </div>

      <div className="sunlight-grid">

        <div className="sunlight-card">
          <Sun size={20} />
          <span>Solar elevation</span>
          <strong>{geometry.elevation_deg}°</strong>
        </div>

        <div className="sunlight-card">
          <Mountain size={20} />
          <span>Solar azimuth</span>
          <strong>{geometry.azimuth_deg}°</strong>
        </div>

        <div className="sunlight-card">
          <span>Terrain horizon angle</span>
          <strong>
            {terrain.max_horizon_angle_deg == null
              ? "N/A"
              : `${terrain.max_horizon_angle_deg}°`}
          </strong>
        </div>

        <div className="sunlight-card">
          <span>Obstruction distance</span>
          <strong>
            {terrain.blocking_distance_m == null
              ? "N/A"
              : `${terrain.blocking_distance_m} m`}
          </strong>
        </div>

      </div>

      <div className="sunlight-comparison">

        <div>
          <span>Geometric sunlight</span>
          <strong>
            {geometry.above_horizon ? "Above horizon" : "Below horizon"}
          </strong>
        </div>

        <div>
          <span>Terrain-aware sunlight</span>

          <strong className={
            visible ? "status-visible" :
            blocked ? "status-blocked" :
            "status-unknown"
          }>
            {visible
              ? "Visible"
              : blocked
                ? "Blocked"
                : "Insufficient coverage"}
          </strong>
        </div>

      </div>

      <div className="sunlight-message">
        {visible ? (
          <CheckCircle2 size={19} />
        ) : (
          <AlertTriangle size={19} />
        )}

        <span>{terrain.message}</span>
      </div>

      <div className="sunlight-footnote">
        DEM sampling: {terrain.sample_step_m ?? "N/A"} m
        {" · "}
        Analysis range: {terrain.max_distance_m ?? "N/A"} m
        {" · "}
        Coverage: {terrain.coverage_complete ? "Complete" : "Incomplete"}
      </div>

    </section>
  );
}
