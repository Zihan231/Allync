"use client";

import { ClockIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import type { Fixture, FixtureEntrant } from "@/lib/api/tournaments";
import { EntrantBadge } from "./EntrantBadge";
import {
  FIXTURE_STATUS_CLASSES,
  fixtureStatusLabel,
  formatDuration,
  formatMatchDate,
  formatMatchTime,
  gamePhase,
} from "./labels";

/** Earliest scheduled game of a fixture (CvC games can have different ranges). */
export function fixtureKickoff(match: Fixture): string | null {
  const starts = match.games.map((g) => g.scheduledStart).filter((s): s is string => Boolean(s)).sort();
  return starts[0] ?? null;
}

/** Compact fixture: both entrants with their score, schedule chip and live state. */
export function MatchCard({
  match,
  isCvC,
  now,
  highlightParticipantId,
  onOpen,
  size = "md",
}: {
  match: Fixture;
  isCvC: boolean;
  now: number;
  highlightParticipantId?: string | null;
  onOpen: (match: Fixture) => void;
  size?: "md" | "lg";
}) {
  const { t, locale } = useLanguage();
  const f = t.dashboard.fixtures;
  const s = t.dashboard.schedule;
  const decided = match.status === "completed" || match.status === "bye";
  const involvesMe =
    Boolean(highlightParticipantId) &&
    (match.participantA?.participantId === highlightParticipantId ||
      match.participantB?.participantId === highlightParticipantId);

  const kickoff = fixtureKickoff(match);
  const phases = match.games.map((g) => gamePhase(g, now));
  const live = !decided && phases.some((p) => p === "playing");
  const evidence = !decided && !live && phases.some((p) => p === "evidence");
  const nextStart = !decided && kickoff && new Date(kickoff).getTime() > now ? new Date(kickoff).getTime() - now : null;

  const side = (entrant: FixtureEntrant | null, score: number | null) => {
    const isWinner = decided && entrant && match.winnerParticipantId === entrant.participantId;
    const isLoser = decided && entrant && (match.winnerParticipantId || match.doubleForfeit) && !isWinner;
    const isMine = Boolean(entrant && highlightParticipantId && entrant.participantId === highlightParticipantId);
    return (
      <div
        className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 ${isLoser ? "opacity-60" : ""} ${
          isMine ? "bg-accent-soft ring-1 ring-inset ring-accent/40" : ""
        }`}
      >
        <EntrantBadge entrant={entrant} isCvC={isCvC} size={size === "lg" ? "md" : "sm"} />
        <span
          className={`min-w-0 flex-1 truncate ${size === "lg" ? "text-sm" : "text-xs"} ${
            entrant
              ? isMine || isWinner
                ? "font-black text-accent-ink"
                : "font-semibold text-ink"
              : "text-ink-faint"
          }`}
        >
          {entrant?.name ?? (match.status === "bye" ? f.bye : f.tbd)}
        </span>
        {isMine ? (
          <span className="shrink-0 rounded-full border border-accent/40 bg-accent px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-bg">
            {isCvC ? f.yourClub : f.you}
          </span>
        ) : null}
        <span className={`w-6 text-right font-mono font-black ${size === "lg" ? "text-lg" : "text-sm"} ${isMine || isWinner ? "text-accent-ink" : "text-ink-soft"}`}>
          {score ?? (match.status === "bye" ? "" : "–")}
        </span>
      </div>
    );
  };

  return (
    <button
      type="button"
      onClick={() => onOpen(match)}
      className={`relative w-full rounded-xl border bg-surface/90 text-left transition-all hover:-translate-y-0.5 hover:border-accent/60 focus-visible:outline-2 focus-visible:outline-accent ${
        size === "lg" ? "p-4" : "p-3"
      } ${
        live
          ? "border-danger/60 shadow-[0_0_18px_-4px_rgba(255,84,112,0.45)]"
          : involvesMe
            ? "border-accent/60 ring-1 ring-accent/30 shadow-[0_0_18px_-6px_rgba(217,165,68,0.5)]"
            : "border-surface-line"
      }`}
    >
      {live ? (
        <span className="absolute -top-2 right-3 flex items-center gap-1 rounded-full bg-danger px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-white motion-safe:animate-pulse" />
          {s.live}
        </span>
      ) : null}

      {side(match.participantA, match.scoreA)}
      <div className="my-0.5 h-px bg-surface-line/70" />
      {side(match.participantB, match.scoreB)}

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1 truncate font-mono text-[10px] text-ink-faint">
          <ClockIcon className="h-3 w-3 shrink-0 text-accent" />
          {kickoff ? `${formatMatchDate(kickoff, locale)} · ${formatMatchTime(kickoff, locale)}` : s.timeTbd}
        </span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            evidence ? "bg-warning-soft text-warning-ink" : FIXTURE_STATUS_CLASSES[match.status]
          }`}
        >
          {evidence
            ? format(s.evidenceCloses, {
                time: formatDuration(
                  Math.min(...match.games.map((g) => (g.evidenceDeadline ? new Date(g.evidenceDeadline).getTime() : Infinity))) - now,
                ),
              })
            : nextStart !== null && nextStart < 24 * 60 * 60 * 1000
              ? format(s.startsIn, { time: formatDuration(nextStart) })
              : fixtureStatusLabel(match.status, t)}
        </span>
      </div>
    </button>
  );
}
