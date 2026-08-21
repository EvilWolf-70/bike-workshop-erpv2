import { useId, useState } from "react";

export interface LineChartPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  points: LineChartPoint[];
  height?: number;
  valueFormatter?: (value: number) => string;
}

const WIDTH = 720; // viewBox units; scales responsively via preserveAspectRatio

export function LineChart({ points, height = 220, valueFormatter = (v) => String(v) }: LineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const gradientId = useId();

  const maxValue = Math.max(1, ...points.map((p) => p.value));
  const padding = { top: 16, right: 12, bottom: 28, left: 12 };
  const plotWidth = WIDTH - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const step = points.length > 1 ? plotWidth / (points.length - 1) : 0;
  const coords = points.map((p, i) => ({
    x: padding.left + (points.length > 1 ? i * step : plotWidth / 2),
    y: padding.top + plotHeight - (p.value / maxValue) * plotHeight,
    ...p,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1]?.x.toFixed(1)} ${padding.top + plotHeight} L ${coords[0]?.x.toFixed(1)} ${padding.top + plotHeight} Z`;

  // Thin x-axis labels so they never overcrowd — show at most ~8 labels regardless of point count.
  const labelEvery = Math.max(1, Math.ceil(points.length / 8));

  const hovered = hoverIndex !== null ? coords[hoverIndex] : null;

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const relativeX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let closest = 0;
    let closestDist = Infinity;
    coords.forEach((c, i) => {
      const dist = Math.abs(c.x - relativeX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setHoverIndex(closest);
  }

  if (points.length === 0) return null;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
        className="touch-none"
        role="img"
        aria-label={`Revenue trend across ${points.length} ${points.length === 1 ? "period" : "periods"}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={padding.left}
            x2={WIDTH - padding.right}
            y1={padding.top + plotHeight * f}
            y2={padding.top + plotHeight * f}
            stroke="var(--color-border)"
            strokeWidth="1"
          />
        ))}

        {points.length > 1 && <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />}

        {points.length > 1 ? (
          <path d={linePath} fill="none" stroke="var(--color-brand-500)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          // Single point (e.g. "Today" with no hourly breakdown) — show a marker, not a misleading line.
          <circle cx={coords[0].x} cy={coords[0].y} r="5" fill="var(--color-brand-500)" />
        )}

        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={hoverIndex === i ? 5 : 3}
            fill="white"
            stroke="var(--color-brand-500)"
            strokeWidth="2"
            className="transition-all"
          />
        ))}

        {hovered && (
          <line x1={hovered.x} x2={hovered.x} y1={padding.top} y2={padding.top + plotHeight} stroke="var(--color-brand-500)" strokeWidth="1" strokeDasharray="3 3" />
        )}

        {coords.map((c, i) =>
          i % labelEvery === 0 || i === coords.length - 1 ? (
            <text key={i} x={c.x} y={height - 8} textAnchor="middle" fontSize="10" fill="var(--color-ink-400)">
              {c.label}
            </text>
          ) : null
        )}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs shadow-lg"
          style={{
            left: `${(hovered.x / WIDTH) * 100}%`,
            top: `${(hovered.y / height) * 100}%`,
            transform: "translate(-50%, -130%)",
          }}
        >
          <p className="font-medium text-[var(--color-ink-900)]">{hovered.label}</p>
          <p className="text-[var(--color-brand-600)]">{valueFormatter(hovered.value)}</p>
        </div>
      )}
    </div>
  );
}
