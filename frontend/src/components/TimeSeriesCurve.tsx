import type { TimelinePoint } from "../types/analysis";

type ValueKey = "solarElevation" | "earthElevation" | "combinedVisible";
export function TimeSeriesCurve({ points, color, valueKey }: { points: TimelinePoint[]; color: string; valueKey: ValueKey }) {
  if (!points.length || (valueKey === "earthElevation" && points.every(p => p.earthElevation == null)) || (valueKey === "combinedVisible" && points.every(p => p.combinedVisible == null))) {
    return <div className="curve-empty">Data not available</div>;
  }
  const values = points.map(p => valueKey === "combinedVisible" ? (p.combinedVisible ? 1 : 0) : (p[valueKey] ?? 0));
  const min = valueKey === "combinedVisible" ? 0 : Math.min(-5, ...values);
  const max = valueKey === "combinedVisible" ? 1 : Math.max(5, ...values);
  const y = (v: number) => 48 - (v - min) / (max - min || 1) * 40;
  const xx = (i: number) => (i / Math.max(1, values.length - 1) * 230).toFixed(2);
  // Boolean line-of-sight visibility should jump between 0 and 1, not interpolate through fractional states.
  const path = valueKey === "combinedVisible"
    ? values.map((value, i) => i === 0 ? `M0 ${y(value).toFixed(2)}` : `H${xx(i)} V${y(value).toFixed(2)}`).join(" ")
    : values.map((value, i) => `${i ? "L" : "M"}${xx(i)} ${y(value).toFixed(2)}`).join(" ");
  return <svg className="mini-curve" viewBox="0 0 230 54" preserveAspectRatio="none" aria-label={`${valueKey} sampled time series`} role="img">
    <path d={`${path} L230 54 L0 54Z`} fill={color} fillOpacity="0.13" />
    <path d={path} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
  </svg>;
}
