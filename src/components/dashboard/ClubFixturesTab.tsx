"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getClubFixturesFull } from "@/lib/mock/clubInsights";
import type { Club } from "@/lib/mock/types";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { ClubCrest } from "../common/ClubCrest";
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
        <div className="mt-5 space-y-7">
          {grouped.map(([competition, list]) => (
            <div key={competition}>
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                  <TrophyIcon className="h-3.5 w-3.5" />
                </span>
                <h3 className="font-display text-sm font-bold text-ink">{competition}</h3>
                <span className="h-px flex-1 bg-surface-line" />
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                  {list.length} {t.dashboard.clubRounds.competitionLabel}
                </span>
              </div>

              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((f) => {
                  const homeName = f.isHome ? club.name : f.opponentClubName;
                  const awayName = f.isHome ? f.opponentClubName : club.name;

                  return (
                    <div
                      key={f.id}
                      className={`overflow-hidden rounded-2xl border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                        f.isKnockout ? "border-accent/50 bg-gradient-to-b from-accent/10 via-surface/50 to-surface/50" : "border-surface-line bg-surface/40"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-between px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide ${
                          f.isKnockout ? "bg-accent-soft text-accent-ink" : "bg-surface-line/40 text-ink-faint"
                        }`}
                      >
                        <span className="truncate">{f.round}</span>
                        <span className="shrink-0">{f.dateLabel}</span>
                      </div>

                      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 p-4">
                        <div className="flex flex-col items-center gap-2 text-center">
                          <ClubCrest
                            name={homeName}
                            color={f.isHome ? club.color : undefined}
                            initials={f.isHome ? club.initials : undefined}
                            size="md"
                          />
                          <span className="w-full truncate text-xs font-semibold text-ink">{homeName}</span>
                        </div>

                        <div className="flex flex-col items-center gap-1 pt-2">
                          <span className="font-display text-sm font-black text-ink-faint">{t.dashboard.clubFixtures.vsLabel}</span>
                          {f.isKnockout ? <TrophyIcon className="h-3.5 w-3.5 text-accent-ink" /> : null}
                        </div>

                        <div className="flex flex-col items-center gap-2 text-center">
                          <ClubCrest
                            name={awayName}
                            color={!f.isHome ? club.color : undefined}
                            initials={!f.isHome ? club.initials : undefined}
                            size="md"
                          />
                          <span className="w-full truncate text-xs font-semibold text-ink">{awayName}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-1.5 border-t border-surface-line/60 px-3 py-2">
                        <StatusPill tone="neutral">{f.team}</StatusPill>
                        <StatusPill tone={f.isHome ? "info" : "neutral"}>
                          {f.isHome ? t.dashboard.clubFixtures.homeLabel : t.dashboard.clubFixtures.awayLabel}
                        </StatusPill>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
