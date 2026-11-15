import { MapPinned } from "lucide-react";

export default function SiteSummary({ site }) {
  if (!site) return null;
  return <div className="site-summary"><div className="site-pin"><MapPinned size={17}/></div><div className="site-copy"><span className="eyebrow">SELECTED LANDING REGION</span><b>{site.name}</b><small>{site.region || "Lunar South Pole"} · {Number(site.latitude).toFixed(3)}° LAT / {Number(site.longitude).toFixed(3)}° LON</small></div><span className="site-coordinate">MOON / SOUTH POLAR</span></div>;
}