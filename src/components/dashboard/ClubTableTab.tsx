import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockTournaments } from "@/lib/mock/store";
import type { Club } from "@/lib/mock/types";
import { EmptyState } from "./EmptyState";
import { TrophyIcon } from "../icons";

export function ClubTableTab({ club }: { club: Club }) {
  const { t } = useLanguage();
  const tournaments = useMockTournaments();

  const tournament = tournaments.find(
    (tr) => club.communityIds.includes(tr.communityId ?? "") && tr.aggregateTable?.some((row) => row.clubName === club.name)
  );

  if (!tournament || !tournament.aggregateTable) {
    return (
      <EmptyState icon={TrophyIcon} title={t.dashboard.clubTable.emptyTitle} body={t.dashboard.clubTable.emptyBody} />
    );
  }

  const standings = [...tournament.aggregateTable].sort((a, b) => b.points - a.points);

  return (
    <div>
      <h3 className="font-display text-sm font-bold text-ink">{tournament.name}</h3>
      <div className="mt-4 overflow-hidden rounded-xl border border-surface-line">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-surface-line/40 font-mono text-[10px] uppercase tracking-wide text-ink-faint sm:text-[11px]">
            <tr>
              <th className="px-2.5 py-2 font-medium">#</th>
              <th className="px-2.5 py-2 font-medium">{t.dashboard.clubTable.clubLabel}</th>
              <th className="px-1.5 py-2 text-center font-medium">P</th>
              <th className="px-1.5 py-2 text-center font-medium">W</th>
              <th className="px-1.5 py-2 text-center font-medium">D</th>
              <th className="px-1.5 py-2 text-center font-medium">L</th>
              <th className="px-2.5 py-2 text-right font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => (
              <tr
                key={row.clubName}
                className={row.clubName === club.name ? "bg-accent-soft/40" : i % 2 === 0 ? "bg-surface/40" : ""}
              >
                <td className="whitespace-nowrap px-2.5 py-2 font-mono text-ink-faint">{i + 1}</td>
                <td className="px-2.5 py-2 font-medium text-ink">{row.clubName}</td>
                <td className="px-1.5 py-2 text-center font-mono text-ink-soft">{row.played}</td>
                <td className="px-1.5 py-2 text-center font-mono text-ink-soft">{row.won}</td>
                <td className="px-1.5 py-2 text-center font-mono text-ink-soft">{row.drawn}</td>
                <td className="px-1.5 py-2 text-center font-mono text-ink-soft">{row.lost}</td>
                <td className="px-2.5 py-2 text-right font-mono font-semibold text-accent-ink">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
