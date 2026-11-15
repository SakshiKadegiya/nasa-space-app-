import { degrees } from "../utils/format";

function point(azimuth, elevation, cx, cy, radius) {
  const a = (Number(azimuth ?? 0) - 90) * Math.PI / 180;
  const r = radius * (1 - Math.max(-90, Math.min(90, Number(elevation ?? 0))) / 180);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

export default function HorizonView({ sun, earth, siteName }) {
  const cx = 230, cy = 190, r = 132;
  const sunPoint = point(sun?.azimuth_deg, sun?.elevation_deg, cx, cy, r);
  const earthPoint = point(earth?.azimuth_deg, earth?.elevation_deg, cx, cy, r);
  return <section className="panel horizon-panel">
    <div className="panel-heading"><div><span className="eyebrow">LOCAL SKY GEOMETRY</span><h3>Horizon position</h3><p>Body direction relative to the selected surface site</p></div><span className="diagram-tag">N · E · S · W</span></div>
    <div className="horizon-graphic">
      <svg viewBox="0 0 460 270" role="img" aria-label="Azimuth and elevation plot showing Sun and Earth directions">
        <defs><linearGradient id="skyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#142c48"/><stop offset="100%" stopColor="#0b1729"/></linearGradient></defs>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy} L ${cx-r} ${cy} Z`} fill="url(#skyFill)" opacity=".72"/>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="#4b6683" strokeWidth="1.5"/>
        <path d={`M ${cx-r*.66} ${cy} A ${r*.66} ${r*.66} 0 0 1 ${cx+r*.66} ${cy}`} fill="none" stroke="#344b67" strokeDasharray="4 5"/>
        <path d={`M ${cx-r*.33} ${cy} A ${r*.33} ${r*.33} 0 0 1 ${cx+r*.33} ${cy}`} fill="none" stroke="#344b67" strokeDasharray="4 5"/>
        <path d={`M ${cx-r-12} ${cy} H ${cx+r+12}`} stroke="#8296ae" strokeWidth="1.5"/>
        <path d={`M ${cx} ${cy-r-10} V ${cy+12}`} stroke="#263e5a" strokeDasharray="3 5"/>
        <g fill="#91a7c0" fontSize="10" fontFamily="DM Mono"><text x={cx} y="31" textAnchor="middle">ZENITH</text><text x={cx} y="252" textAnchor="middle">HORIZON · 0°</text><text x="79" y={cy+17}>W</text><text x="375" y={cy+17}>E</text><text x={cx} y="52" textAnchor="middle">N</text></g>
        <line x1={cx} y1={cy} x2={sunPoint.x} y2={sunPoint.y} stroke="#ffc66d" strokeWidth="1.5" strokeDasharray="4 4"/>
        <line x1={cx} y1={cy} x2={earthPoint.x} y2={earthPoint.y} stroke="#68c9f4" strokeWidth="1.5" strokeDasharray="4 4"/>
        <circle cx={cx} cy={cy} r="4" fill="#dce9f7"/>
        <circle cx={sunPoint.x} cy={sunPoint.y} r="8" fill="#ffc66d" stroke="#fff0ce" strokeWidth="2"/>
        <circle cx={earthPoint.x} cy={earthPoint.y} r="7" fill="#68c9f4" stroke="#d9f3ff" strokeWidth="2"/>
        <g fontSize="10" fontFamily="DM Mono"><text x={sunPoint.x+12} y={sunPoint.y-10} fill="#ffc66d">SUN</text><text x={earthPoint.x+12} y={earthPoint.y+15} fill="#68c9f4">EARTH</text></g>
      </svg>
    </div>
    <div className="horizon-legend"><span><i className="sun-dot"/> SUN <b>{degrees(sun?.elevation_deg, 2)}</b></span><span><i className="earth-dot"/> EARTH <b>{degrees(earth?.elevation_deg, 2)}</b></span></div>
    <div className="diagram-caption">Schematic sky plot · azimuth and elevation are calculated values; terrain profile is not yet applied.</div>
  </section>;
}