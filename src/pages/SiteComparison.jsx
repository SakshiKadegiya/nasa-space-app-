
import SectionHeading from "../components/SectionHeading";
import ComparisonPanel from "../components/ComparisonPanel";

export default function SiteComparison({
  sites,
  siteId,
  setSiteId,
  comparison,
  loading,
}) {
  return (
    <>
      <SectionHeading
        eyebrow="MISSION INTELLIGENCE / CANDIDATE ANALYSIS"
        title="Site comparison"
        description="Compare solar illumination and Earth geometric visibility for all candidate landing regions at the same UTC instant."
      />

      <div className="metric-grid">
        <div className="panel">
          <span className="eyebrow">CANDIDATE LOCATIONS</span>
          <h2>{sites.length}</h2>
          <p>Available lunar south-pole sites</p>
        </div>

        <div className="panel">
          <span className="eyebrow">CALCULATED LOCATIONS</span>
          <h2>{comparison.length} / {sites.length}</h2>
          <p>Sites with comparison results</p>
        </div>
      </div>

      <ComparisonPanel
        sites={sites}
        selectedId={siteId}
        onSelect={setSiteId}
        comparison={comparison}
        loading={loading}
      />

      <div className="panel" style={{ marginTop: 18 }}>
        <span className="eyebrow">COMPARISON METHODOLOGY</span>
        <p>
          All sites are evaluated at the same observation time using
          the SPICE-derived Sun and Earth geometry.
        </p>
        <small>
          Geometric horizon visibility does not account for local
          terrain obstruction, antenna constraints or link budget.
        </small>
      </div>
    </>
  );
}