"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import type { Fixture, TournamentStructure } from "@/lib/api/tournaments";
import { EntrantBadge } from "./EntrantBadge";
import { MatchCard } from "./MatchCard";
import { roundLabel } from "./labels";
import { useNow } from "./useNow";

/** One full-width group at a time: its table and fixtures by matchday. */
export function GroupStage({
  groups,
  isCvC,
  highlightParticipantId,
  onOpenMatch,
}: {
  groups: TournamentStructure["groups"];
  isCvC: boolean;
  highlightParticipantId?: string | null;
  onOpenMatch: (match: Fixture) => void;
}) {
  const { t } = useLanguage();
  const f = t.dashboard.fixtures;
  const now = useNow();
  const [selectedGroupLabel, setSelectedGroupLabel] = useState<string | null>(null);
  const viewerGroup = groups.find((group) => group.standings.some((row) => row.entrantId === highlightParticipantId));
  const activeGroup = groups.find((group) => group.label === selectedGroupLabel) ?? viewerGroup ?? groups[0];

  if (!activeGroup) return null;

  const matchdays = [...new Set(activeGroup.matches.map((match) => match.roundName))];
  const activeGroupName = format(f.group, { label: activeGroup.label });

  return (
    <div className="space-y-4">
      {groups.length > 1 ? (
        <div className="rounded-2xl border border-surface-line bg-surface/60 p-2 shadow-sm">
          <label className="sr-only" htmlFor="group-stage-selector">
            {f.groupStage}
          </label>
          <select
            id="group-stage-selector"
            value={activeGroup.label}
            onChange={(event) => setSelectedGroupLabel(event.target.value)}
            className="min-h-11 w-full rounded-xl border border-surface-line-strong bg-bg-raised px-4 font-display text-base font-bold text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent sm:hidden"
          >
            {groups.map((group) => (
              <option key={group.label} value={group.label}>
                {format(f.group, { label: group.label })}
              </option>
            ))}
          </select>

          <div className="hidden gap-2 sm:flex" role="tablist" aria-label={f.groupStage}>
            {groups.map((group) => {
              const active = group.label === activeGroup.label;
              return (
                <button
                  key={group.label}
                  id={`group-tab-${group.label}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`group-panel-${group.label}`}
                  onClick={() => setSelectedGroupLabel(group.label)}
                  className={`min-h-11 flex-1 rounded-xl px-5 py-2.5 font-display text-base font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                    active
                      ? "bg-accent text-bg shadow-md"
                      : "text-ink-soft hover:bg-accent-soft hover:text-accent-ink"
                  }`}
                >
                  {format(f.group, { label: group.label })}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <section
        id={`group-panel-${activeGroup.label}`}
        role="tabpanel"
        aria-label={groups.length === 1 ? activeGroupName : undefined}
        aria-labelledby={groups.length > 1 ? `group-tab-${activeGroup.label}` : undefined}
        className="w-full overflow-hidden rounded-2xl border border-surface-line bg-surface/50"
      >
        <header className="flex items-center gap-3 border-b border-surface-line bg-gradient-to-r from-accent/15 to-transparent px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent font-display text-sm font-black text-bg sm:h-11 sm:w-11 sm:rounded-xl sm:text-lg">
            {activeGroup.label}
          </span>
          <h4 className="font-display text-base font-black text-ink sm:text-2xl">{activeGroupName}</h4>
        </header>

        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed text-left text-[10px] sm:table-auto sm:text-base">
            <colgroup>
              <col className="w-[7%] sm:w-auto" />
              <col className="w-[37%] sm:w-auto" />
              <col span={6} />
            </colgroup>
            <thead className="bg-surface-line/30 font-mono text-[9px] uppercase tracking-normal text-ink-faint sm:text-xs sm:tracking-wide">
              <tr>
                <th className="px-1 py-2 font-semibold sm:px-5 sm:py-3">{f.colRank}</th>
                <th className="px-1 py-2 font-semibold sm:px-4 sm:py-3">{f.colTeam}</th>
                <th className="px-0.5 py-2 text-center font-semibold sm:px-4 sm:py-3">{f.colPlayed}</th>
                <th className="px-0.5 py-2 text-center font-semibold sm:px-4 sm:py-3">{f.colWon}</th>
                <th className="px-0.5 py-2 text-center font-semibold sm:px-4 sm:py-3">{f.colDrawn}</th>
                <th className="px-0.5 py-2 text-center font-semibold sm:px-4 sm:py-3">{f.colLost}</th>
                <th className="px-0.5 py-2 text-center font-semibold sm:px-4 sm:py-3">{f.colDiff}</th>
                <th className="px-0.5 py-2 text-center font-semibold sm:px-5 sm:py-3">{f.colPoints}</th>
              </tr>
            </thead>
            <tbody>
              {activeGroup.standings.map((row) => {
                const mine = row.entrantId === highlightParticipantId;
                return (
                  <tr
                    key={row.entrantId}
                    className={`border-t border-surface-line/70 ${
                      row.qualifies ? "shadow-[inset_4px_0_0_var(--success)]" : ""
                    } ${mine ? "bg-accent-soft" : ""}`}
                  >
                    <td className="px-1 py-2 font-mono text-[10px] font-bold text-ink-soft sm:px-5 sm:py-3 sm:text-base">
                      {row.rank}
                    </td>
                    <td className="min-w-0 px-1 py-2 sm:px-4 sm:py-3">
                      <span className="flex min-w-0 items-center gap-1 sm:gap-3">
                        <span className="sm:hidden">
                          <EntrantBadge entrant={row.entrant} isCvC={isCvC} />
                        </span>
                        <span className="hidden sm:inline-flex">
                          <EntrantBadge entrant={row.entrant} isCvC={isCvC} size="md" />
                        </span>
                        <span className={`min-w-0 truncate font-display text-[10px] leading-tight sm:text-lg ${mine ? "font-black text-accent-ink" : "font-bold text-ink"}`}>
                          {row.entrant?.name ?? f.tbd}
                        </span>
                        {mine ? (
                          <span className="hidden shrink-0 rounded-full border border-accent/40 bg-accent px-2 py-1 text-[10px] font-black uppercase tracking-wide text-bg sm:inline-flex">
                            {f.yourClub}
                          </span>
                        ) : null}
                        {row.qualifies ? (
                          <span className="hidden shrink-0 rounded-full bg-success-soft px-2 py-1 text-[10px] font-bold uppercase text-success-ink sm:inline">
                            {f.qualifies}
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-0.5 py-2 text-center font-mono text-ink-soft sm:px-4 sm:py-3">{row.played}</td>
                    <td className="px-0.5 py-2 text-center font-mono text-ink-soft sm:px-4 sm:py-3">{row.won}</td>
                    <td className="px-0.5 py-2 text-center font-mono text-ink-soft sm:px-4 sm:py-3">{row.drawn}</td>
                    <td className="px-0.5 py-2 text-center font-mono text-ink-soft sm:px-4 sm:py-3">{row.lost}</td>
                    <td className="px-0.5 py-2 text-center font-mono text-ink-soft sm:px-4 sm:py-3">
                      {row.scoreDiff > 0 ? `+${row.scoreDiff}` : row.scoreDiff}
                    </td>
                    <td className="px-0.5 py-2 text-center font-display text-[11px] font-black text-ink sm:px-5 sm:py-3 sm:text-lg">
                      {row.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-5 border-t border-surface-line p-5 sm:p-6">
          <h5 className="font-mono text-sm font-bold uppercase tracking-wider text-ink-soft">{f.fixturesHeading}</h5>
          {matchdays.map((matchday) => (
            <div key={matchday}>
              <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {roundLabel(matchday, t)}
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {activeGroup.matches
                  .filter((match) => match.roundName === matchday)
                  .map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      isCvC={isCvC}
                      now={now}
                      highlightParticipantId={highlightParticipantId}
                      onOpen={onOpenMatch}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
