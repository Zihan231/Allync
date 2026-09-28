"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import type { Fixture, TournamentStructure } from "@/lib/api/tournaments";
import { EntrantBadge } from "./EntrantBadge";
import { MatchCard } from "./MatchCard";
import { roundLabel } from "./labels";

/** One card per group: the table (top 2 marked as qualifying) and its fixtures by matchday. */
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

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {groups.map((group) => {
        const matchdays = [...new Set(group.matches.map((m) => m.roundName))];
        return (
          <section key={group.label} className="overflow-hidden rounded-2xl border border-surface-line bg-surface/50">
            <header className="flex items-center gap-3 border-b border-surface-line bg-gradient-to-r from-accent/15 to-transparent px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-display text-sm font-black text-bg">
                {group.label}
              </span>
              <h4 className="font-display text-base font-bold text-ink">{format(f.group, { label: group.label })}</h4>
            </header>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-line/30 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                  <tr>
                    <th className="px-3 py-2 font-medium">{f.colRank}</th>
                    <th className="px-2 py-2 font-medium">{f.colTeam}</th>
                    <th className="px-2 py-2 text-center font-medium">{f.colPlayed}</th>
                    <th className="px-2 py-2 text-center font-medium">{f.colWon}</th>
                    <th className="px-2 py-2 text-center font-medium">{f.colDrawn}</th>
                    <th className="px-2 py-2 text-center font-medium">{f.colLost}</th>
                    <th className="px-2 py-2 text-center font-medium">{f.colDiff}</th>
                    <th className="px-3 py-2 text-center font-medium">{f.colPoints}</th>
                  </tr>
                </thead>
                <tbody>
                  {group.standings.map((row) => {
                    const mine = row.entrantId === highlightParticipantId;
                    return (
                      <tr
                        key={row.entrantId}
                        className={`border-t border-surface-line/70 ${
                          row.qualifies ? "shadow-[inset_3px_0_0_var(--success)]" : ""
                        } ${mine ? "bg-accent-soft" : ""}`}
                      >
                        <td className="px-3 py-2 font-mono font-bold text-ink-soft">{row.rank}</td>
                        <td className="px-2 py-2">
                          <span className="flex min-w-0 items-center gap-2">
                            <EntrantBadge entrant={row.entrant} isCvC={isCvC} />
                            <span className="truncate font-semibold text-ink">{row.entrant?.name ?? f.tbd}</span>
                            {row.qualifies ? (
                              <span className="hidden shrink-0 rounded-full bg-success-soft px-1.5 py-px text-[9px] font-bold uppercase text-success-ink sm:inline">
                                {f.qualifies}
                              </span>
                            ) : null}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center font-mono text-ink-soft">{row.played}</td>
                        <td className="px-2 py-2 text-center font-mono text-ink-soft">{row.won}</td>
                        <td className="px-2 py-2 text-center font-mono text-ink-soft">{row.drawn}</td>
                        <td className="px-2 py-2 text-center font-mono text-ink-soft">{row.lost}</td>
                        <td className="px-2 py-2 text-center font-mono text-ink-soft">
                          {row.scoreDiff > 0 ? `+${row.scoreDiff}` : row.scoreDiff}
                        </td>
                        <td className="px-3 py-2 text-center font-display text-sm font-black text-ink">{row.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 border-t border-surface-line p-4">
              <h5 className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-soft">{f.fixturesHeading}</h5>
              {matchdays.map((matchday) => (
                <div key={matchday}>
                  <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                    {roundLabel(matchday, t)}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {group.matches
                      .filter((m) => m.roundName === matchday)
                      .map((match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          isCvC={isCvC}
                          highlightParticipantId={highlightParticipantId}
                          onOpen={onOpenMatch}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
