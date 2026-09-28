"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Fixture, FixtureEntrant } from "@/lib/api/tournaments";
import { EntrantBadge } from "./EntrantBadge";
import { FIXTURE_STATUS_CLASSES, fixtureStatusLabel } from "./labels";

/** Compact fixture: both entrants with their score, winner highlighted. */
export function MatchCard({
  match,
  isCvC,
  highlightParticipantId,
  onOpen,
}: {
  match: Fixture;
  isCvC: boolean;
  highlightParticipantId?: string | null;
  onOpen: (match: Fixture) => void;
}) {
  const { t } = useLanguage();
  const f = t.dashboard.fixtures;
  const decided = match.status === "completed" || match.status === "bye";
  const involvesMe =
    Boolean(highlightParticipantId) &&
    (match.participantA?.participantId === highlightParticipantId ||
      match.participantB?.participantId === highlightParticipantId);

  const side = (entrant: FixtureEntrant | null, score: number | null) => {
    const isWinner = decided && entrant && match.winnerParticipantId === entrant.participantId;
    const isLoser = decided && entrant && match.winnerParticipantId && !isWinner;
    return (
      <div className={`flex items-center gap-2.5 py-1 ${isLoser ? "opacity-55" : ""}`}>
        <EntrantBadge entrant={entrant} isCvC={isCvC} />
        <span
          className={`min-w-0 flex-1 truncate text-xs ${
            entrant ? (isWinner ? "font-bold text-accent-ink" : "font-semibold text-ink") : "text-ink-faint"
          }`}
        >
          {entrant?.name ?? (match.status === "bye" ? f.bye : f.tbd)}
        </span>
        <span className={`w-6 text-right font-mono text-sm font-black ${isWinner ? "text-accent-ink" : "text-ink-soft"}`}>
          {score ?? (match.status === "bye" ? "" : "–")}
        </span>
      </div>
    );
  };

  return (
    <button
      type="button"
      onClick={() => onOpen(match)}
      className={`w-full rounded-xl border bg-surface/80 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-accent ${
        involvesMe ? "border-accent/60 ring-1 ring-accent/30" : "border-surface-line"
      }`}
    >
      {side(match.participantA, match.scoreA)}
      <div className="my-0.5 h-px bg-surface-line/70" />
      {side(match.participantB, match.scoreB)}
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-[10px] text-ink-faint">#{match.matchNumber}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${FIXTURE_STATUS_CLASSES[match.status]}`}>
          {fixtureStatusLabel(match.status, t)}
        </span>
      </div>
    </button>
  );
}
