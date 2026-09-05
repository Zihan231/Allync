import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { ClubStatsSummary } from "@/lib/mock/clubMatchHistory";

export function ClubStatsSummaryPanel({ title, unitLabel, summary }: { title: string; unitLabel: string; summary: ClubStatsSummary }) {
  const { t } = useLanguage();
  const { allTime, bySeason } = summary;

  const kpis: { label: string; value: string }[] = [
    { label: "PL", value: allTime.played.toLocaleString() },
    { label: "W", value: allTime.wins.toLocaleString() },
    { label: "D", value: allTime.draws.toLocaleString() },
    { label: "L", value: allTime.losses.toLocaleString() },
    { label: "GF", value: allTime.goalsFor.toLocaleString() },
    { label: "GA", value: allTime.goalsAgainst.toLocaleString() },
    { label: "Win %", value: `${allTime.winPct.toFixed(1)}%` },
    { label: "GF/Match", value: allTime.gfPerMatch.toFixed(2) },
    { label: "CS", value: allTime.cleanSheets.toLocaleString() },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-surface-line bg-surface/30 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
          <span className="font-mono text-xs text-ink-faint">
            {allTime.played.toLocaleString()} {unitLabel}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-lg border border-surface-line bg-surface/40 p-3 text-center">
              <div className="font-display text-lg font-bold text-accent-ink">{k.value}</div>
              <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wide text-ink-faint">{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-surface-line">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-surface-line/40 font-mono text-[10px] uppercase tracking-wide text-ink-faint sm:text-[11px]">
            <tr>
              <th className="px-2.5 py-2 font-medium">{t.dashboard.clubRoundStats.seasonLabel}</th>
              <th className="px-1.5 py-2 text-center font-medium">PL</th>
              <th className="px-1.5 py-2 text-center font-medium">W</th>
              <th className="px-1.5 py-2 text-center font-medium">D</th>
              <th className="px-1.5 py-2 text-center font-medium">L</th>
              <th className="px-1.5 py-2 text-center font-medium">GF</th>
              <th className="px-1.5 py-2 text-center font-medium">GA</th>
              <th className="px-2.5 py-2 text-right font-medium">Win %</th>
            </tr>
          </thead>
          <tbody>
            {bySeason.map((row, i) => (
              <tr key={row.season} className={i % 2 === 0 ? "bg-surface/40" : ""}>
                <td className="whitespace-nowrap px-2.5 py-2 font-semibold text-ink">{row.season}</td>
                <td className="px-1.5 py-2 text-center font-mono text-ink-soft">{row.played}</td>
                <td className="px-1.5 py-2 text-center font-mono text-ink-soft">{row.wins}</td>
                <td className="px-1.5 py-2 text-center font-mono text-ink-soft">{row.draws}</td>
                <td className="px-1.5 py-2 text-center font-mono text-ink-soft">{row.losses}</td>
                <td className="px-1.5 py-2 text-center font-mono text-ink-soft">{row.goalsFor}</td>
                <td className="px-1.5 py-2 text-center font-mono text-ink-soft">{row.goalsAgainst}</td>
                <td className="px-2.5 py-2 text-right font-mono font-semibold text-accent-ink">
                  {row.winPct.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
