import { Clock3 } from "lucide-react";

const demoTicks = ["00:00","04:00","08:00","12:00","16:00","20:00","24:00"];
export default function TimelinePanel({ sun, earth }) {
  const sunAbove = Number(sun?.elevation_deg) > 0;
  const earthAbove = Number(earth?.elevation_deg) > 0;
  return <section className="panel timeline-panel">
    <div className="panel-heading"><div><span className="eyebrow">MISSION PLANNING</span><h3>Visibility snapshot</h3><p>Current instant status · full timeline endpoint is a next backend task</p></div><Clock3 size={18} className="muted-icon"/></div>
    <div className="timeline-row"><div className="timeline-label"><i className="sun-dot"/> Solar illumination</div><div className="timeline-track"><div className={`timeline-current ${sunAbove ? "sun-on" : "sun-off"}`} style={{left:"58%"}}/><span className="timeline-marker" style={{left:"58%"}}/></div><span className={`mini-state ${sunAbove ? "state-on" : "state-off"}`}>{sunAbove ? "ABOVE" : "BELOW"}</span></div>
    <div className="timeline-row"><div className="timeline-label"><i className="earth-dot"/> Earth geometry</div><div className="timeline-track"><div className={`timeline-current ${earthAbove ? "earth-on" : "earth-off"}`} style={{left:"58%"}}/><span className="timeline-marker" style={{left:"58%"}}/></div><span className={`mini-state ${earthAbove ? "state-on" : "state-off"}`}>{earthAbove ? "ABOVE" : "BELOW"}</span></div>
    <div className="timeline-axis">{demoTicks.map(t=><span key={t}>{t}</span>)}</div>
    <div className="timeline-disclaimer">This is a current-time snapshot, not a computed 24-hour visibility forecast.</div>
  </section>;
}