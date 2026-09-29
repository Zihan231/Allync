"use client";

import { useState } from "react";
import { BracketIcon, TrophyIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import type { Fixture, TournamentStructure } from "@/lib/api/tournaments";
import { EntrantBadge } from "./EntrantBadge";
import { GrandBracket } from "./GrandBracket";
import { MatchCard, fixtureKickoff } from "./MatchCard";
import { formatMatchDate, formatMatchTime, roundLabel } from "./labels";
import { useNow } from "./useNow";

type Round = TournamentStructure["knockout"]["rounds"][number];

/**
 * Grand knockout bracket: the two halves of the draw converge on a centre
 * Final with the trophy (and the champion once decided). Small screens default
 * to a stacked list of rounds, latest first (Final on top), with a toggle to the
 * (sideways-scrolling) bracket.
 */
export function KnockoutBracket({
  knockout,
  title,
  isCvC,
  highlightParticipantId,
  onOpenMatch,
}: {
  knockout: TournamentStructure["knockout"];
  /** Shown as the bracket's headline (the tournament name). */
  title?: string;
  isCvC: boolean;
  highlightParticipantId?: string | null;
  onOpenMatch: (match: Fixture) => void;
}) {
  const { t, locale } = useLanguage();
  const f = t.dashboard.fixtures;
  const now = useNow();
  const [mobileView, setMobileView] = useState<"list" | "bracket">("list");

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

  const rounds = [...knockout.rounds].sort((a, b) => a.round - b.round);
  const final = rounds[rounds.length - 1];
  const roundDate = (round: Round) => {
    const first = round.matches.map(fixtureKickoff).filter((d): d is string => Boolean(d)).sort()[0];
    return first ? formatMatchDate(first, locale) : null;
  };
  const card = (match: Fixture) => (
    <MatchCard
      key={match.id}
      match={match}
      isCvC={isCvC}
      now={now}
      highlightParticipantId={highlightParticipantId}
      onOpen={onOpenMatch}
    />
  );

  const s = t.dashboard.schedule;

  return (
    <>
      {/* Small screens: switch between the round list and the bracket */}
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <div role="tablist" aria-label={s.viewBracket} className="inline-flex rounded-xl border border-surface-line bg-surface/60 p-1">
          {(["list", "bracket"] as const).map((view) => (
            <button
              key={view}
              type="button"
              role="tab"
              aria-selected={mobileView === view}
              onClick={() => setMobileView(view)}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${
                mobileView === view ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"
              }`}
            >
              {view === "list" ? s.viewList : s.viewBracket}
            </button>
          ))}
        </div>
        {mobileView === "bracket" ? <span className="text-[11px] text-ink-faint">{s.swipeHint}</span> : null}
      </div>

      {/* UEFA-style draw converging on the trophy (always on desktop) */}
      <div className={mobileView === "bracket" ? "block" : "hidden lg:block"}>
        <GrandBracket
          rounds={rounds}
          title={title}
          isCvC={isCvC}
          now={now}
          highlightParticipantId={highlightParticipantId}
          onOpenMatch={onOpenMatch}
        />
      </div>

      {/* Small screens: rounds stacked, latest first so the Final is seen without scrolling */}
      <div className={mobileView === "list" ? "space-y-6 lg:hidden" : "hidden"}>
        {[...rounds].reverse().map((round) => (
          <section key={round.round}>
            {/* The Final's card carries its own headline and date */}
            {round === final ? null : (
              <div className="mb-2 flex items-center justify-between border-b border-surface-line pb-2">
                <span className="font-mono text-xs font-black uppercase tracking-wider text-accent-ink">
                  {roundLabel(round.name, t)}
                </span>
                {roundDate(round) ? <span className="font-mono text-[10px] text-ink-faint">{roundDate(round)}</span> : null}
              </div>
            )}
            {round === final && final.matches[0] ? (
              <GrandFinalCard
                match={final.matches[0]}
                isCvC={isCvC}
                highlightParticipantId={highlightParticipantId}
                onOpen={onOpenMatch}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">{round.matches.map(card)}</div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}

/** The Final as a hero card: trophy, the two finalists face to face, and the champion once decided. */
function GrandFinalCard({
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
  const { t, locale } = useLanguage();
  const f = t.dashboard.fixtures;
  const s = t.dashboard.schedule;
  const decided = match.status === "completed" || match.status === "bye";
  const winnerSide =
    !decided || !match.winnerParticipantId
      ? null
      : match.winnerParticipantId === match.participantA?.participantId
        ? "A"
        : match.winnerParticipantId === match.participantB?.participantId
          ? "B"
          : null;
  const champion = winnerSide === "A" ? match.participantA : winnerSide === "B" ? match.participantB : null;
  const kickoff = fixtureKickoff(match);

  const side = (entrant: Fixture["participantA"], score: number | null, key: "A" | "B") => {
    const won = winnerSide === key;
    const lost = decided && winnerSide !== null && !won;
    const mine = Boolean(highlightParticipantId && entrant?.participantId === highlightParticipantId);
    return (
      <div className={`flex min-w-0 flex-1 flex-col items-center gap-2 text-center ${lost ? "opacity-50 grayscale" : ""}`}>
        <div
          className={`rounded-2xl p-1 ${
            won ? "bg-accent shadow-[0_0_24px_-2px_rgba(217,165,68,0.8)]" : "bg-surface-line/60"
          } ${mine ? "ring-2 ring-accent ring-offset-2 ring-offset-bg" : ""}`}
        >
          <EntrantBadge entrant={entrant} isCvC={isCvC} size="lg" />
        </div>
        <span className={`w-full truncate font-display text-sm font-black ${won ? "text-accent" : "text-ink"}`}>
          {entrant?.name ?? f.tbd}
        </span>
        {decided ? (
          <span className={`font-display text-3xl font-black leading-none ${won ? "text-accent" : "text-ink-faint"}`}>
            {score ?? 0}
          </span>
        ) : null}
      </div>
    );
  };

  return (
    <button
      type="button"
      onClick={() => onOpen(match)}
      className="group relative block w-full overflow-hidden rounded-3xl border border-accent/60 bg-[radial-gradient(ellipse_at_top,rgba(217,165,68,0.28),transparent_70%)] bg-bg-raised px-4 pb-5 pt-6 text-left shadow-[0_0_40px_-12px_rgba(217,165,68,0.65)] transition-transform active:scale-[0.99]"
    >
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />

      {/* Trophy + headline */}
      <div className="flex flex-col items-center text-center">
        <span className="relative flex h-16 w-16 items-center justify-center">
          <span aria-hidden className="absolute inset-0 rounded-full bg-accent/25 blur-xl" />
          <TrophyIcon className="relative h-12 w-12 text-accent drop-shadow-[0_0_12px_rgba(217,165,68,0.8)]" />
        </span>
        <span className="mt-2 font-mono text-[10px] font-black uppercase tracking-[0.35em] text-accent">{s.grandFinal}</span>
        {kickoff ? (
          <span className="mt-1 font-mono text-[11px] text-ink-faint">
            {formatMatchDate(kickoff, locale)} · {formatMatchTime(kickoff, locale)}
          </span>
        ) : null}
      </div>

      {/* Champion ribbon */}
      {decided ? (
        champion ? (
          <div className="mx-auto mt-4 flex max-w-xs items-center justify-center gap-2 rounded-full border border-accent bg-accent/15 px-4 py-1.5">
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-accent">{s.champion}</span>
            <span className="truncate font-display text-sm font-black text-ink">{champion.name}</span>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-danger/40 bg-danger-soft px-4 py-2 text-center text-xs font-semibold text-danger-ink">
            {s.noChampion}
          </div>
        )
      ) : null}

      {/* Finalists face to face */}
      <div className="mt-5 flex items-start gap-3">
        {side(match.participantA, match.scoreA, "A")}
        <span className="mt-6 shrink-0 rounded-full border border-accent/50 bg-bg px-2.5 py-1 font-display text-xs font-black text-accent">
          {decided ? "–" : "VS"}
        </span>
        {side(match.participantB, match.scoreB, "B")}
      </div>
    </button>
  );
}
