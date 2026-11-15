
import { CalendarDays, MapPin, RefreshCw } from "lucide-react";

export default function SiteTimePanel({
  sites = [],
  siteId,
  onSiteChange,
  datetime,
  onDatetimeChange,
  onRefresh,
  loading,
}) {
  // Display the stored UTC value directly.
  const utcValue = datetime
    ? new Date(datetime).toISOString().slice(0, 16)
    : "";

  const handleDateChange = (event) => {
    const value = event.target.value;

    if (!value) return;

    // Interpret the selected datetime-local value as UTC.
    const utcDate = new Date(`${value}:00Z`);

    if (!Number.isNaN(utcDate.getTime())) {
      onDatetimeChange(utcDate.toISOString());
    }
  };

  return (
    <section className="control-panel">
      <div className="control-title">
        <div>
          <span className="eyebrow">
            SCENARIO CONFIGURATION
          </span>
          <h3>Observation parameters</h3>
        </div>

        <span className="live-tag">LIVE SCENARIO</span>
      </div>

      <div className="control-grid">
        <label className="field">
          <span>
            <MapPin size={14} />
            LANDING SITE
          </span>

          <select
            value={siteId}
            onChange={(event) => onSiteChange(event.target.value)}
            disabled={!sites.length}
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>
            <CalendarDays size={14} />
            OBSERVATION TIME · UTC
          </span>

          <input
            type="datetime-local"
            value={utcValue}
            onChange={handleDateChange}
          />
        </label>

        <button
          type="button"
          className="refresh-button"
          onClick={onRefresh}
          disabled={loading || !siteId}
        >
          <RefreshCw
            size={15}
            className={loading ? "spin" : ""}
          />

          {loading ? "Calculating" : "Recalculate"}
        </button>
      </div>
    </section>
  );
}