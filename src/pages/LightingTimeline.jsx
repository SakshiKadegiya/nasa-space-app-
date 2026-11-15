
import { useEffect, useState } from "react";
import { Clock3, Sun, Globe } from "lucide-react";

import SectionHeading from "../components/SectionHeading";
import { getTimeline } from "../services/api";

export default function LightingTimeline({
  siteId,
  selectedSite,
  datetime,
}) {
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!siteId || !datetime) return;

    let active = true;

    async function loadTimeline() {
      setLoading(true);
      setError("");

      try {
        const result = await getTimeline({
          siteId,
          startUTC: datetime,
          hours: 24,
        });

        if (active) setTimeline(result);
      } catch (err) {
        if (active) {
          setTimeline(null);
          setError(err.message);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTimeline();

    return () => {
      active = false;
    };
  }, [siteId, datetime]);

  return (
    <>
      <SectionHeading
        eyebrow="MISSION PLANNING / TEMPORAL ANALYSIS"
        title="Lighting timeline"
        description={`24-hour solar and Earth geometry analysis for ${selectedSite?.name || "selected site"}.`}
      />

      <div className="metric-grid">
        <div className="panel">
          <Sun size={22} />
          <span className="eyebrow">ESTIMATED SUNLIT SAMPLE HOURS</span>
          <h2>
            {timeline
              ? `${timeline.estimated_sunlit_sample_hours} h`
              : "—"}
          </h2>
        </div>

        <div className="panel">
          <Globe size={22} />
          <span className="eyebrow">EARTH VISIBLE SAMPLE HOURS</span>
          <h2>
            {timeline
              ? `${timeline.estimated_earth_visible_sample_hours} h`
              : "—"}
          </h2>
        </div>
      </div>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-heading">
          <div>
            <span className="eyebrow">24-HOUR ANALYSIS</span>
            <h3>Hourly visibility samples</h3>
          </div>
          <Clock3 size={20} />
        </div>

        {loading && <p>Calculating timeline...</p>}

        {error && (
          <p className="error-text">
            Unable to load timeline: {error}
          </p>
        )}

        {timeline && (
          <>
            <div className="timeline-data-grid">
              <div className="timeline-data-header">
                <span>UTC</span>
                <span>Sun elevation</span>
                <span>Earth elevation</span>
                <span>Sun</span>
                <span>Earth</span>
              </div>

              {timeline.samples.map((sample) => (
                <div
                  className="timeline-data-row"
                  key={sample.datetime_utc}
                >
                  <span>
                    {new Date(sample.datetime_utc)
                      .toISOString()
                      .slice(11, 16)}
                  </span>

                  <span>
                    {Number(sample.solar_elevation_deg).toFixed(2)}°
                  </span>

                  <span>
                    {Number(sample.earth_elevation_deg).toFixed(2)}°
                  </span>

                  <span className={
                    sample.sunlight_available ? "above-text" : "below-text"
                  }>
                    {sample.sunlight_available ? "Above" : "Below"}
                  </span>

                  <span className={
                    sample.earth_geometrically_visible ? "above-text" : "below-text"
                  }>
                    {sample.earth_geometrically_visible ? "Above" : "Below"}
                  </span>
                </div>
              ))}
            </div>

            <small>
              {timeline.sampling_note}
            </small>
          </>
        )}
      </section>
    </>
  );
}