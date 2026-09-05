"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getClubOpponentStats } from "@/lib/mock/clubMatchHistory";
import type { Club } from "@/lib/mock/types";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { Pagination } from "./Pagination";

type Person = ReturnType<typeof useMockPeople>[number];
type TeamFilter = "all" | "Main" | "Academy";

const PAGE_SIZE = 15;

export function ClubOpponentStatsTable({ club, members }: { club: Club; members: Person[] }) {
  const { t } = useLanguage();
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("all");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => getClubOpponentStats(club, members), [club, members]);
  const hasAcademy = members.some((p) => p.squadTeam === "Academy");

  const filtered = teamFilter === "all" ? rows : rows.filter((r) => r.team === teamFilter);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [teamFilter]);

  function clearFilters() {
    setTeamFilter("all");
    setPage(1);
  }

  return (
    <div className="rounded-xl border border-surface-line bg-surface/30 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-sm font-bold text-ink">{t.dashboard.clubRoundStats.opponentStatsTitle}</h3>
        <span className="font-mono text-xs text-ink-faint">
          {rows.length} {t.dashboard.clubRoundStats.opponentsUnit}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-ink-soft">
          {t.dashboard.clubSquad.teamFilterLabel}
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value as TeamFilter)}
            className="rounded-lg border border-surface-line-strong bg-surface px-2 py-1.5 text-xs text-ink"
          >
            <option value="all">{t.dashboard.clubSquad.teamFilterAll}</option>
            <option value="Main">{t.dashboard.clubSquad.squadTeamMain}</option>
            {hasAcademy ? <option value="Academy">{t.dashboard.clubSquad.squadTeamAcademy}</option> : null}
          </select>
        </label>
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-lg border border-surface-line-strong px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink"
        >
          {t.dashboard.clubRoundStats.clearLabel}
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-surface-line">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-surface-line/40 font-mono text-[10px] uppercase tracking-wide text-ink-faint sm:text-[11px]">
            <tr>
              <th className="px-2.5 py-2 font-medium">{t.dashboard.clubRoundStats.opponentColumnLabel}</th>
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
            {pageRows.map((row, i) => (
              <tr key={row.opponentClubName} className={i % 2 === 0 ? "bg-surface/40" : ""}>
                <td className="min-w-0 truncate px-2.5 py-2 font-medium text-ink">{row.opponentClubName}</td>
                <td className="px-1.5 py-2 text-center font-mono text-ink-soft">{row.PL}</td>
                <td className="px-1.5 py-2 text-center font-mono text-ink-soft">{row.W}</td>
                <td className="px-1.5 py-2 text-center font-mono text-ink-soft">{row.D}</td>
                <td className="px-1.5 py-2 text-center font-mono text-ink-soft">{row.L}</td>
                <td className="px-1.5 py-2 text-center font-mono text-ink-soft">{row.GF}</td>
                <td className="px-1.5 py-2 text-center font-mono text-ink-soft">{row.GA}</td>
                <td className="px-2.5 py-2 text-right font-mono font-semibold text-accent-ink">
                  {row.winPct.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </div>
    </div>
  );
}
