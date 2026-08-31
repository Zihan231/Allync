export function RosterTable({ roster }: { roster: { name: string; position: string }[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-surface-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-line/40 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
          <tr>
            <th className="px-4 py-2.5 font-medium">Player</th>
            <th className="px-4 py-2.5 font-medium">Role</th>
          </tr>
        </thead>
        <tbody>
          {roster.map((p, i) => (
            <tr key={p.name} className={i % 2 === 0 ? "bg-surface/40" : ""}>
              <td className="px-4 py-2.5 text-ink">{p.name}</td>
              <td className="px-4 py-2.5 text-ink-soft">{p.position}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
