"use client";

type DonutSlice = {
  label: string;
  value: number;
  color: string;
};

export function DonutChart({
  data,
  size = 160,
  innerRadius = 52,
  showLegend = true,
}: {
  data: DonutSlice[];
  size?: number;
  innerRadius?: number;
  showLegend?: boolean;
}) {
  if (data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 8;

  let accumulated = 0;
  const arcs = data.map((d) => {
    const startAngle = (accumulated / total) * 360;
    accumulated += d.value;
    const endAngle = (accumulated / total) * 360;
    return { ...d, startAngle, endAngle };
  });

  function polarToCartesian(
    cx: number,
    cy: number,
    r: number,
    angleDeg: number,
  ) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeArc(
    startAngle: number,
    endAngle: number,
  ) {
    const start = polarToCartesian(cx, cy, outerR, endAngle);
    const end = polarToCartesian(cx, cy, outerR, startAngle);
    const innerStart = polarToCartesian(cx, cy, innerRadius, endAngle);
    const innerEnd = polarToCartesian(cx, cy, innerRadius, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return [
      `M ${start.x} ${start.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 0 ${end.x} ${end.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${innerStart.x} ${innerStart.y}`,
      "Z",
    ].join(" ");
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} className="shrink-0">
        {arcs.map((d) => (
          <path
            key={d.label}
            d={describeArc(d.startAngle, d.endAngle)}
            fill={d.color}
            opacity={0.85}
            className="transition-opacity hover:opacity-100"
          >
            <title>{`${d.label}: ${d.value} (${((d.value / total) * 100).toFixed(0)}%)`}</title>
          </path>
        ))}
        <circle cx={cx} cy={cy} r={innerRadius} fill="var(--background)" />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="fill-text-primary text-lg font-bold"
          style={{ fontSize: "18px", fontWeight: 700 }}
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          className="fill-text-muted text-[10px]"
          style={{ fontSize: "10px" }}
        >
          Total
        </text>
      </svg>

      {showLegend && (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
          {arcs.map((d) => (
            <div key={d.label} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-text-secondary">{d.label}</span>
              <span className="text-text-primary font-medium">
                {((d.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
