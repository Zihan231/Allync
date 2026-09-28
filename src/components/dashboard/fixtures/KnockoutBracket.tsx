"use client";

import { BracketIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import type { Fixture, TournamentStructure } from "@/lib/api/tournaments";
import { MatchCard } from "./MatchCard";
import { roundLabel } from "./labels";

/** Knockout tree: one column per round, matches spaced so each pair feeds the next round. */
export function KnockoutBracket({
  knockout,
  isCvC,
  highlightParticipantId,
  onOpenMatch,
}: {
  knockout: TournamentStructure["knockout"];
  isCvC: boolean;
  highlightParticipantId?: string | null;
  onOpenMatch: (match: Fixture) => void;
}) {
  const { t } = useLanguage();
  const f = t.dashboard.fixtures;

  if (knockout.pending || knockout.rounds.length === 0) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-dashed border-surface-line-strong bg-surface/30 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
          <BracketIcon className="h-5 w-5" />
        </span>
        <p className="text-xs leading-relaxed text-ink-soft">{format(f.knockoutPending, { size: knockout.size })}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max gap-6">
        {knockout.rounds.map((round) => (
          <div key={round.round} className="flex w-64 flex-col">
            <div className="mb-3 flex items-center justify-between border-b border-surface-line pb-2">
              <span className="font-mono text-xs font-black uppercase tracking-wider text-accent-ink">
                {roundLabel(round.name, t)}
              </span>
              <span className="rounded-full bg-surface-line px-2 py-0.5 font-mono text-[10px] text-ink-faint">
                {round.matches.length}
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-around gap-4">
              {round.matches.map((match) => (
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
    </div>
  );
}
