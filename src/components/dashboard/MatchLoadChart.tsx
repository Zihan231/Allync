import type { MatchLoadPoint } from "@/lib/mock/playerInsights";

const SERIES_COLORS = ["var(--blue)", "var(--success)", "var(--accent)"];

export function MatchLoadChart({ data, height = 200 }: { data: MatchLoadPoint[]; height?: number }) {
  const width = 640;
  const padding = { top: 16, right: 12, bottom: 22, left: 12 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const max = Math.max(1, ...data.flatMap((d) => [d.matches, d.wins, d.goalsFor]));
  const groupWidth = innerW / Math.max(1, data.length);
  const barWidth = Math.min(9, groupWidth / 5);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Monthly match load chart">
      {data.map((d, i) => {
        const groupX = padding.left + i * groupWidth + groupWidth / 2;
        const values = [d.matches, d.wins, d.goalsFor];
        return (
          <g key={i}>
            {values.map((value, si) => {
              const h = (value / max) * innerH;
              const x = groupX - barWidth * 1.5 + si * (barWidth + 2);
              const y = padding.top + innerH - h;
              return <rect key={si} x={x} y={y} width={barWidth} height={Math.max(0, h)} rx={2} fill={SERIES_COLORS[si]} />;
            })}
            <text x={groupX} y={height - 4} textAnchor="middle" fontSize={9} fill="var(--ink-faint)">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
