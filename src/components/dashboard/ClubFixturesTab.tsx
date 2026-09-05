"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getClubFixturesFull } from "@/lib/mock/clubInsights";
import type { Club } from "@/lib/mock/types";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { StatusPill } from "./StatusPill";
import { EmptyState } from "./EmptyState";
import { TrophyIcon } from "../icons";

type Person = ReturnType<typeof useMockPeople>[number];
type TeamFilter = "all" | "Main" | "Academy";

export function ClubFixturesTab({ club, members }: { club: Club; members: Person[] }) {
  const { t } = useLanguage();
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("all");
  const [competitionFilter, setCompetitionFilter] = useState<string>("all");

  const fixtures = useMemo(() => getClubFixturesFull(club, members), [club, members]);
  const competitions = useMemo(() => Array.from(new Set(fixtures.map((f) => f.competition))), [fixtures]);

  const filtered = fixtures.filter((f) => {
    if (teamFilter !== "all" && f.team !== teamFilter) return false;
    if (competitionFilter !== "all" && f.competition !== competitionFilter) return false;
    return true;
  });

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach((f) => {
      const list = map.get(f.competition) ?? [];
      list.push(f);
      map.set(f.competition, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", "Main", "Academy"] as TeamFilter[]).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTeamFilter(tf)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                teamFilter === tf
                  ? "border-blue bg-blue-soft text-blue-ink"
                  : "border-surface-line-strong text-ink-soft hover:text-ink"
              }`}
            >
              {tf === "all" ? t.dashboard.clubSquad.teamFilterAll : tf === "Main" ? t.dashboard.clubSquad.squadTeamMain : t.dashboard.clubSquad.squadTeamAcademy}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-1.5 text-xs text-ink-soft">
          {t.dashboard.clubRounds.competitionLabel}
          <select
            value={competitionFilter}
            onChange={(e) => setCompetitionFilter(e.target.value)}
            className="rounded-lg border border-surface-line-strong bg-surface px-2 py-1.5 text-xs text-ink"
          >
            <option value="all">{t.dashboard.clubRounds.allCompetitions}</option>
            {competitions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      {grouped.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={TrophyIcon} title={t.dashboard.clubOverview.noUpcomingFixtures} body="" />
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {grouped.map(([competition, list]) => (
            <div key={competition}>
              <h3 className="font-display text-sm font-bold text-ink">{competition}</h3>
              <div className="mt-2 space-y-2">
                {list.map((f) => (
                  <div
                    key={f.id}
                    className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${
                      f.isKnockout ? "border-accent bg-accent-soft/30" : "border-surface-line bg-surface/40"
                    }`}
                  >
                    <div className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                      {f.dateLabel}
                    </div>
                    <StatusPill tone="neutral">{f.team}</StatusPill>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                      {f.isHome ? `${club.name} vs ${f.opponentClubName}` : `${f.opponentClubName} vs ${club.name}`}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-ink-faint">{f.round}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
