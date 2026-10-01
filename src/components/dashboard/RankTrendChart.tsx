/** One period on the chart; `rank` is null when the player didn't play in it. */
export type RankTrendPoint = { label: string; rank: number | null };

export function RankTrendChart({ data, height = 180 }: { data: RankTrendPoint[]; height?: number }) {
  const width = 640;
  const padding = { top: 16, right: 12, bottom: 22, left: 12 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const ranks = data.map((d) => d.rank).filter((r): r is number => r != null);
  const min = ranks.length ? Math.min(...ranks) : 1;
  const max = ranks.length ? Math.max(...ranks) : 1;
  const span = Math.max(1, max - min);

  // Lower rank number is better, so the axis is inverted: best rank sits
  // near the top of the chart instead of the bottom.
  const xAt = (i: number) => padding.left + (data.length <= 1 ? 0 : (i / (data.length - 1)) * innerW);
  // Periods without a rank are skipped; the line joins the ranked ones.
  const points = data.flatMap((d, i) =>
    d.rank == null ? [] : [{ x: xAt(i), y: padding.top + ((d.rank - min) / span) * innerH, rank: d.rank }],
  );

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Rank trend chart">
      {[0, 0.5, 1].map((t) => (
        <line
          key={t}
          x1={padding.left}
          x2={width - padding.right}
          y1={padding.top + t * innerH}
          y2={padding.top + t * innerH}
          stroke="var(--surface-line)"
          strokeWidth={1}
        />
      ))}
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => {
        const isPeak = p.rank === min;
        const isEdge = i === 0 || i === points.length - 1;
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill={isPeak ? "var(--accent-ink)" : "var(--accent)"} />
            {isPeak || isEdge ? (
              <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={10} fill="var(--ink-soft)">
                #{p.rank}
              </text>
            ) : null}
          </g>
        );
      })}
      {data.map((d, i) => (
        <text key={`x-${i}`} x={xAt(i)} y={height - 4} textAnchor="middle" fontSize={9} fill="var(--ink-faint)">
          {d.label}
        </text>
      ))}
    </svg>
  );
}
