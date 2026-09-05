"use client";

import { useMemo } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getPlayerRankings } from "@/lib/mock/rankingsData";
import { getClubMatchStats } from "@/lib/mock/clubMatchHistory";
import type { Club } from "@/lib/mock/types";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { Avatar } from "../common/Avatar";
import { ClubStatsSummaryPanel } from "./ClubStatsSummaryPanel";

type Person = ReturnType<typeof useMockPeople>[number];

export function ClubMatchStatsTab({ club, members }: { club: Club; members: Person[] }) {
  const { t } = useLanguage();
  const summary = useMemo(() => getClubMatchStats(club), [club]);

  const clubNameById = useMemo(() => new Map([[club.id, club.name]]), [club.id, club.name]);
  const rows = useMemo(() => {
    if (members.length === 0) return [];
    return getPlayerRankings("all-time", members, clubNameById).filter((r) => r.isReal && r.clubName === club.name);
  }, [members, clubNameById, club.name]);

  const totalPL = rows.reduce((sum, r) => sum + r.PL, 0);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-surface-line bg-surface/30 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm font-bold text-ink">{t.dashboard.clubMatchStats.contributionsTitle}</h3>
          <span className="font-mono text-xs text-ink-faint">{rows.length}</span>
        </div>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">{t.dashboard.clubs.emptyState}</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => {
              const contribution = totalPL > 0 ? (row.PL / totalPL) * 100 : 0;
              return (
                <div
                  key={row.id}
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-surface-line bg-surface/40 p-3"
                >
                  <Avatar dpUrl={row.dpUrl} name={row.name} size="md" mode="static" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">{row.name}</div>
                    <div className="mt-0.5 truncate font-mono text-[10px] text-ink-faint">
                      {row.PL} PL · {row.W} W · {row.D} D · {row.L} L · {row.winPct.toFixed(1)}% {t.dashboard.clubSquad.winsLabel}
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-line">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${row.winPct}%` }} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-sm font-bold text-accent-ink">{contribution.toFixed(1)}%</div>
                    <div className="font-mono text-[8px] uppercase tracking-wide text-ink-faint">
                      {t.dashboard.clubMatchStats.contributionLabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ClubStatsSummaryPanel
        title={t.dashboard.clubMatchStats.title}
        unitLabel={t.dashboard.clubMatchStats.matchesUnit}
        summary={summary}
      />
    </div>
  );
}
