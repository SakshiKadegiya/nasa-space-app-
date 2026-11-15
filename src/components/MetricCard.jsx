import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { degrees, formatDistance } from "../utils/format";

export default function MetricCard({ kind, title, data, subtitle }) {
  const isSun = kind === "sun";
  const above = data?.above_geometric_horizon;
  return <article className={`metric-card ${isSun ? "sun-card" : "earth-card"}`}>
    <div className="metric-top"><div className={`metric-symbol ${kind}`}>{isSun ? "☼" : "◉"}</div><span className="metric-title">{title}</span><span className="metric-live">GEOMETRY</span></div>
    <div className="metric-reading">{degrees(data?.elevation_deg, 2)}<span> elevation</span></div>
    <div className="metric-bottom"><div><small>AZIMUTH</small><b>{degrees(data?.azimuth_deg, 2)}</b></div><div><small>RANGE</small><b>{formatDistance(data?.distance_km)}</b></div><div className={`visibility ${above ? "visible" : "hidden"}`}>{above ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {above ? "Above horizon" : "Below horizon"}</div></div>
    <div className="metric-note">{subtitle || "Geometric horizon check · terrain not included"}</div>
  </article>;
}