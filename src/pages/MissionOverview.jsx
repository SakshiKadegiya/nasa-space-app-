
import { Download, MoonStar } from "lucide-react";

import SectionHeading from "../components/SectionHeading";
import SiteSummary from "../components/SiteSummary";
import MetricCard from "../components/MetricCard";
import HorizonView from "../components/HorizonView";
import { ErrorNotice, ScienceNotice } from "../components/Notice";

export default function MissionOverview({
  selectedSite,
  geometry,
  error,
  loading,
  comparison,
  datetime,
}) {
  const exportCsv = () => {
    if (!comparison.length) return;

    const rows = [
      [
        "Site",
        "Latitude",
        "Longitude",
        "Datetime UTC",
        "Sun Elevation",
        "Sun Azimuth",
        "Earth Elevation",
        "Earth Azimuth",
      ],
      ...comparison.map((item) => {
        const indicators = item.mission_indicators;

        return [
          item.site.name,
          item.site.latitude,
          item.site.longitude,
          datetime,
          indicators?.solar_elevation_deg,
          indicators?.solar_azimuth_deg,
          indicators?.earth_elevation_deg,
          indicators?.earth_azimuth_deg,
        ];
      }),
    ];

    const csv = rows
      .map((row) =>
        row.map((value) =>
          `"${String(value ?? "").replaceAll('"', '""')}"`
        ).join(",")
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "polarview-mission-overview.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <>
      <SectionHeading
        eyebrow="MISSION CONTROL / LUNAR SOUTH POLE"
        title="Lighting & communications overview"
        description="Explore local Sun illumination and Earth line-of-sight geometry across candidate landing regions."
        right={
          <button
            className="export-button"
            onClick={exportCsv}
            disabled={!comparison.length}
          >
            <Download size={15} />
            Export comparison
          </button>
        }
      />

      <ErrorNotice message={error} />

      {selectedSite && (
        <SiteSummary site={selectedSite} />
      )}

      {loading && (
        <div className="loading-bar">
          <span />
        </div>
      )}

      {geometry ? (
        <>
          <div className="metric-grid">
            <MetricCard
              kind="sun"
              title="SOLAR POSITION"
              data={geometry.sun}
            />

            <MetricCard
              kind="earth"
              title="EARTH POSITION"
              data={geometry.earth}
            />
          </div>

          <div className="visual-grid">
            <HorizonView
              sun={geometry.sun}
              earth={geometry.earth}
              siteName={selectedSite?.name}
            />

            <section className="panel overview-status">
              <span className="eyebrow">CURRENT GEOMETRY</span>
              <h3>Mission conditions</h3>

              <p>
                Sun: {geometry.sun.above_horizon
                  ? "Above geometric horizon"
                  : "Below geometric horizon"}
              </p>

              <p>
                Earth: {geometry.earth.above_horizon
                  ? "Above geometric horizon"
                  : "Below geometric horizon"}
              </p>

              <small>
                These are geometric horizon checks; local terrain is not included.
              </small>
            </section>
          </div>

          <ScienceNotice method={geometry.method} />
        </>
      ) : (
        !loading && (
          <div className="empty-state">
            <MoonStar size={32} />
            <b>Mission geometry unavailable</b>
            <span>Check the API connection and observation parameters.</span>
          </div>
        )
      )}
    </>
  );
}