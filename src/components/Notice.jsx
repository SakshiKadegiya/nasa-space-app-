import { AlertTriangle, Info } from "lucide-react";
export function ErrorNotice({ message }) {
  if (!message) return null;
  return <div className="notice error-notice"><AlertTriangle size={17}/><div><b>Unable to load mission geometry</b><span>{message}</span><small>Check that the FastAPI server is running and VITE_API_BASE_URL is correct.</small></div></div>;
}
export function ScienceNotice({ method }) {
  const demo = method?.status?.includes("DEMO");
  return <div className="notice science-notice"><Info size={16}/><span>{demo ? "DEMO MODE: values are illustrative and are not SPICE calculations." : "Scientific scope: geometric horizon only. Local terrain obstruction, antenna pointing constraints and solar-panel constraints are not included yet."}</span></div>;
}