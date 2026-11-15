
import "./ComparisonPanel.css";

function formatDegrees(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return `${number.toFixed(2)}°`;
}

function HorizonStatus({ visible }) {
  if (typeof visible !== "boolean") {
    return <span className="comparison-status unknown">—</span>;
  }

  return (
    <span
      className={`comparison-status ${
        visible ? "above" : "below"
      }`}
    >
      {visible ? "Above horizon" : "Below horizon"}
    </span>
  );
}

export default function ComparisonPanel({
  sites = [],
  selectedId,
  onSelect,
  comparison = [],
  loading = false,
}) {
  const comparisonMap = new Map(
    (Array.isArray(comparison) ? comparison : [])
      .filter((item) => item?.site?.id)
      .map((item) => [String(item.site.id), item])
  );

  return (
    <section className="comparison-panel">
      <div className="comparison-heading">
        <div>
          <span className="comparison-eyebrow">
            SITE INTELLIGENCE / LIVE COMPARISON
          </span>

          <h2>Candidate Site Comparison</h2>

          <p>
            All candidate sites calculated at the same observation time.
          </p>
        </div>

        <span className="comparison-count">
          {comparison.length} / {sites.length} CALCULATED
        </span>
      </div>

      <div className="comparison-table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Candidate site</th>
              <th>Sun elevation</th>
              <th>Sun azimuth</th>
              <th>Sun status</th>
              <th>Earth elevation</th>
              <th>Earth azimuth</th>
              <th>Earth status</th>
            </tr>
          </thead>

          <tbody>
            {sites.map((site, index) => {
              const result = comparisonMap.get(String(site.id));
              const indicators = result?.mission_indicators;

              const isSelected =
                String(selectedId) === String(site.id);

              return (
                <tr
                  key={site.id}
                  className={isSelected ? "selected-row" : ""}
                  onClick={() => onSelect?.(String(site.id))}
                  title="Click to select this candidate site"
                >
                  <td className="comparison-site">
                    <span className="site-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <strong>{site.name}</strong>

                    {isSelected && (
                      <span className="selected-label">
                        SELECTED
                      </span>
                    )}
                  </td>

                  <td>
                    {indicators
                      ? formatDegrees(indicators.solar_elevation_deg)
                      : loading
                        ? "Calculating..."
                        : "—"}
                  </td>

                  <td>
                    {indicators
                      ? formatDegrees(indicators.solar_azimuth_deg)
                      : "—"}
                  </td>

                  <td>
                    {indicators ? (
                      <HorizonStatus
                        visible={indicators.sunlight_available}
                      />
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>
                    {indicators
                      ? formatDegrees(indicators.earth_elevation_deg)
                      : "—"}
                  </td>

                  <td>
                    {indicators
                      ? formatDegrees(indicators.earth_azimuth_deg)
                      : "—"}
                  </td>

                  <td>
                    {indicators ? (
                      <HorizonStatus
                        visible={
                          indicators.earth_geometrically_visible
                        }
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}

            {sites.length === 0 && (
              <tr>
                <td colSpan={7} className="comparison-empty">
                  No candidate sites available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="comparison-footer">
        <span>↑</span>
        <p>
          Select any site to view its detailed geometry.
          All comparison values use the same UTC observation time.
        </p>
      </div>
    </section>
  );
}
