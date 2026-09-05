"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getClubRoundHistory } from "@/lib/mock/clubMatchHistory";
import type { Club } from "@/lib/mock/types";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { StatusPill } from "./StatusPill";
import { EmptyState } from "./EmptyState";
import { ClubCrest } from "../common/ClubCrest";
import { Pagination } from "./Pagination";
import { CalendarIcon } from "../icons";

type Person = ReturnType<typeof useMockPeople>[number];
type TeamFilter = "all" | "Main" | "Academy";

const PAGE_SIZE = 12;

const RESULT_TONE = { W: "success", D: "neutral", L: "danger" } as const;
const RESULT_ACCENT = {
  W: "border-l-success bg-gradient-to-br from-success/10 via-surface/40 to-surface/40",
  D: "border-l-surface-line-strong bg-surface/40",
  L: "border-l-danger bg-gradient-to-br from-danger/10 via-surface/40 to-surface/40",
} as const;
const RESULT_SCORE_TEXT = { W: "text-success-ink", D: "text-ink", L: "text-danger-ink" } as const;

export function ClubRoundsTab({ club, members }: { club: Club; members: Person[] }) {
  const { t } = useLanguage();
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("all");
  const [competitionFilter, setCompetitionFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const entries = useMemo(() => getClubRoundHistory(club, members), [club, members]);
  const competitions = useMemo(() => Array.from(new Set(entries.map((e) => e.competition))), [entries]);

  const filtered = entries.filter((e) => {
    if (teamFilter !== "all" && e.team !== teamFilter) return false;
    if (competitionFilter !== "all" && e.competition !== competitionFilter) return false;
    return true;
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageEntries = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [teamFilter, competitionFilter]);

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
          {pageEntries.map((entry) => (
            <div
              key={entry.id}
              className={`min-w-0 rounded-xl border border-l-4 border-surface-line p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${RESULT_ACCENT[entry.result]}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{entry.date}</span>
                <StatusPill tone="neutral">{entry.team}</StatusPill>
              </div>

              <p className="mt-2.5 truncate font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                {entry.competition} <span className="text-ink-faint/70">•</span> {entry.round}
              </p>

              <div className="mt-3 flex items-center gap-2.5">
                <ClubCrest name={entry.opponentClubName} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{entry.opponentClubName}</span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-surface-line-strong/60 bg-bg/40 px-3 py-2">
                <span className={`font-display text-xl font-bold tracking-tight ${RESULT_SCORE_TEXT[entry.result]}`}>
                  {entry.scoreFor}<span className="text-ink-faint">–</span>{entry.scoreAgainst}
                </span>
                <StatusPill tone={RESULT_TONE[entry.result]} className="shrink-0">
                  {entry.result}
                </StatusPill>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="mt-5">
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </div>
      ) : null}
    </div>
  );
}
