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
        <header className="flex items-center gap-4 border-b border-surface-line bg-gradient-to-r from-accent/15 to-transparent px-5 py-4 sm:px-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent font-display text-lg font-black text-bg">
            {activeGroup.label}
          </span>
          <h4 className="font-display text-xl font-black text-ink sm:text-2xl">{activeGroupName}</h4>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm sm:text-base">
            <thead className="bg-surface-line/30 font-mono text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-5 py-3 font-semibold">{f.colRank}</th>
                <th className="px-4 py-3 font-semibold">{f.colTeam}</th>
                <th className="px-4 py-3 text-center font-semibold">{f.colPlayed}</th>
                <th className="px-4 py-3 text-center font-semibold">{f.colWon}</th>
                <th className="px-4 py-3 text-center font-semibold">{f.colDrawn}</th>
                <th className="px-4 py-3 text-center font-semibold">{f.colLost}</th>
                <th className="px-4 py-3 text-center font-semibold">{f.colDiff}</th>
                <th className="px-5 py-3 text-center font-semibold">{f.colPoints}</th>
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
                    <td className="px-5 py-3 font-mono text-base font-bold text-ink-soft">{row.rank}</td>
                    <td className="px-4 py-3">
                      <span className="flex min-w-0 items-center gap-3">
                        <EntrantBadge entrant={row.entrant} isCvC={isCvC} size="md" />
                        <span className="truncate font-display text-base font-bold text-ink sm:text-lg">
                          {row.entrant?.name ?? f.tbd}
                        </span>
                        {row.qualifies ? (
                          <span className="hidden shrink-0 rounded-full bg-success-soft px-2 py-1 text-[10px] font-bold uppercase text-success-ink sm:inline">
                            {f.qualifies}
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-ink-soft">{row.played}</td>
                    <td className="px-4 py-3 text-center font-mono text-ink-soft">{row.won}</td>
                    <td className="px-4 py-3 text-center font-mono text-ink-soft">{row.drawn}</td>
                    <td className="px-4 py-3 text-center font-mono text-ink-soft">{row.lost}</td>
                    <td className="px-4 py-3 text-center font-mono text-ink-soft">
                      {row.scoreDiff > 0 ? `+${row.scoreDiff}` : row.scoreDiff}
                    </td>
                    <td className="px-5 py-3 text-center font-display text-lg font-black text-ink">{row.points}</td>
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
