"use client";

type BarData = {
  label: string;
  value: number;
  color?: string;
};

export function BarChart({
  data,
  height = 180,
  barWidth = 24,
  showLabels = true,
}: {
  data: BarData[];
  height?: number;
  barWidth?: number;
  showLabels?: boolean;
}) {
  if (data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.value), 1);
  const gap = 8;
  const totalWidth = data.length * (barWidth + gap) + gap;
  const width = Math.max(totalWidth, 200);

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className="overflow-visible"
    >
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - (showLabels ? 28 : 12));
        const x = gap + i * (barWidth + gap);
        const y = height - (showLabels ? 24 : 8) - barH;

        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barH, 2)}
              rx={4}
              ry={4}
              fill={d.color || "var(--gold)"}
              opacity={0.85}
              className="transition-opacity hover:opacity-100"
            >
              <title>{`${d.label}: ${d.value}`}</title>
            </rect>
            {showLabels && (
              <text
                x={x + barWidth / 2}
                y={height - 6}
                textAnchor="end"
                transform={`rotate(-45, ${x + barWidth / 2}, ${height - 6})`}
                className="fill-text-muted text-[9px]"
                style={{ fontSize: "9px" }}
              >
                {d.label.length > 6 ? d.label.slice(0, 5) + "…" : d.label}
              </text>
            )}
            <text
              x={x + barWidth / 2}
              y={y - 4}
              textAnchor="middle"
              className="fill-text-secondary text-[10px] font-medium"
              style={{ fontSize: "10px" }}
            >
              {d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
