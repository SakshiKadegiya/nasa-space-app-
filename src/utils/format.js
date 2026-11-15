export function signed(value, digits = 1) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  return `${n > 0 ? "+" : ""}${n.toFixed(digits)}°`;
}
export function degrees(value, digits = 1) {
  return value == null || Number.isNaN(Number(value)) ? "—" : `${Number(value).toFixed(digits)}°`;
}
export function formatDistance(km) {
  if (km == null) return "—";
  return km > 1000000 ? `${(km / 1000000).toFixed(2)}M km` : `${Math.round(km).toLocaleString()} km`;
}
export function utcInputValue(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function toUtcIso(localDateTime) {
  return new Date(localDateTime).toISOString().replace(".000", "");
}
export function compass(deg) {
  if (deg == null) return "—";
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(Number(deg) / 45) % 8];
}