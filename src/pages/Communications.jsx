
import { Radio, Globe, Signal } from "lucide-react";

import SectionHeading from "../components/SectionHeading";

function Value({ children }) {
  return <strong className="communication-value">{children}</strong>;
}

export default function Communications({
  selectedSite,
  geometry,
  comparison,
}) {
  const earth = geometry?.earth;

  const earthVisible =
    typeof earth?.above_horizon === "boolean"
      ? earth.above_horizon
      : null;

  return (
    <>
      <SectionHeading
        eyebrow="MISSION INTELLIGENCE / EARTH LINK GEOMETRY"
        title="Communications analysis"
        description="Evaluate the geometric visibility of Earth from the selected lunar candidate location."
      />

      <div className="metric-grid">
        <section className="panel">
          <Globe size={23} />
          <span className="eyebrow">EARTH ELEVATION</span>
          <h2>
            {earth
              ? `${Number(earth.elevation_deg).toFixed(2)}°`
              : "—"}
          </h2>
          <p>Earth position relative to local horizon</p>
        </section>

        <section className="panel">
          <Radio size={23} />
          <span className="eyebrow">EARTH AZIMUTH</span>
          <h2>
            {earth
              ? `${Number(earth.azimuth_deg).toFixed(2)}°`
              : "—"}
          </h2>
          <p>Earth direction from selected site</p>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-heading">
          <div>
            <span className="eyebrow">CURRENT LINK GEOMETRY</span>
            <h3>Earth line of sight</h3>
          </div>
          <Signal size={21} />
        </div>

        <div className="communication-status">
          <span
            className={`status-indicator ${
              earthVisible === true
                ? "status-good"
                : earthVisible === false
                  ? "status-warning"
                  : ""
            }`}
          />

          <Value>
            {earthVisible === true
              ? "Earth above geometric horizon"
              : earthVisible === false
                ? "Earth below geometric horizon"
                : "Geometry unavailable"}
          </Value>
        </div>

        <p>
          Selected location: {selectedSite?.name || "—"}
        </p>

        <small>
          A positive geometric elevation indicates that Earth is
          above the idealized local horizon.
        </small>
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <span className="eyebrow">CANDIDATE SITE OVERVIEW</span>
        <h3>Earth geometric visibility</h3>

        <div className="communication-site-list">
          {(Array.isArray(comparison) ? comparison : []).map((item) => {
            const indicators = item.mission_indicators;

            return (
              <div key={item.site.id} className="communication-site">
                <div>
                  <strong>{item.site.name}</strong>
                  <small>
                    Elevation: {
                      Number.isFinite(Number(indicators?.earth_elevation_deg))
                        ? `${Number(indicators.earth_elevation_deg).toFixed(2)}°`
                        : "—"
                    }
                  </small>
                </div>

                <span
                  className={
                    indicators?.earth_geometrically_visible
                      ? "above-text"
                      : "below-text"
                  }
                >
                  {typeof indicators?.earth_geometrically_visible === "boolean"
                    ? indicators.earth_geometrically_visible
                      ? "Above horizon"
                      : "Below horizon"
                    : "Unavailable"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <span className="eyebrow">SCIENTIFIC LIMITATIONS</span>
        <h3>Communication feasibility</h3>
        <p>
          Geometric Earth visibility is only an initial line-of-sight
          indicator. Actual communication requires terrain obstruction
          analysis, antenna pointing constraints, spacecraft and ground
          station availability, frequency, transmit power and link-budget
          calculations.
        </p>
      </section>
    </>
  );
}