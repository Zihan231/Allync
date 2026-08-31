export function AggregateTable({
  rows,
}: {
  rows: { clubName: string; played: number; won: number; drawn: number; lost: number; points: number }[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-surface-line">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className="bg-surface-line/40 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
          <tr>
            <th className="px-4 py-2.5 font-medium">Club</th>
            <th className="px-3 py-2.5 text-center font-medium">P</th>
            <th className="px-3 py-2.5 text-center font-medium">W</th>
            <th className="px-3 py-2.5 text-center font-medium">D</th>
            <th className="px-3 py-2.5 text-center font-medium">L</th>
            <th className="px-3 py-2.5 text-center font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.clubName} className={i % 2 === 0 ? "bg-surface/40" : ""}>
              <td className="px-4 py-2.5 font-medium text-ink">{row.clubName}</td>
              <td className="px-3 py-2.5 text-center text-ink-soft">{row.played}</td>
              <td className="px-3 py-2.5 text-center text-ink-soft">{row.won}</td>
              <td className="px-3 py-2.5 text-center text-ink-soft">{row.drawn}</td>
              <td className="px-3 py-2.5 text-center text-ink-soft">{row.lost}</td>
              <td className="px-3 py-2.5 text-center font-mono font-semibold text-accent-ink">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
