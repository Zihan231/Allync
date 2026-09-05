"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getClubRoundHistory } from "@/lib/mock/clubMatchHistory";
import type { Club } from "@/lib/mock/types";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { StatusPill } from "./StatusPill";
import { EmptyState } from "./EmptyState";
import { CalendarIcon } from "../icons";

type Person = ReturnType<typeof useMockPeople>[number];
type TeamFilter = "all" | "Main" | "Academy";

const RESULT_TONE = { W: "success", D: "neutral", L: "danger" } as const;

export function ClubRoundsTab({ club, members }: { club: Club; members: Person[] }) {
  const { t } = useLanguage();
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("all");
  const [competitionFilter, setCompetitionFilter] = useState<string>("all");

  const entries = useMemo(() => getClubRoundHistory(club, members), [club, members]);
  const competitions = useMemo(() => Array.from(new Set(entries.map((e) => e.competition))), [entries]);

  const filtered = entries.filter((e) => {
    if (teamFilter !== "all" && e.team !== teamFilter) return false;
    if (competitionFilter !== "all" && e.competition !== competitionFilter) return false;
    return true;
  });

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

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={CalendarIcon} title={t.dashboard.clubRounds.noEntries} body="" />
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => (
            <div key={entry.id} className="min-w-0 rounded-xl border border-surface-line bg-surface/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{entry.date}</span>
                <StatusPill tone="neutral">{entry.team}</StatusPill>
              </div>
              <p className="mt-2 truncate text-xs text-ink-faint">
                {entry.competition} • {entry.round}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">vs {entry.opponentClubName}</span>
                <span className="shrink-0 font-mono text-sm font-bold text-ink">
                  {entry.scoreFor}–{entry.scoreAgainst}
                </span>
              </div>
              <div className="mt-2">
                <StatusPill tone={RESULT_TONE[entry.result]}>{entry.result}</StatusPill>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
