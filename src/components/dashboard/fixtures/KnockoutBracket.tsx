"use client";

import type { ReactNode } from "react";
import { BracketIcon, TrophyIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import type { Fixture, TournamentStructure } from "@/lib/api/tournaments";
import { EntrantBadge } from "./EntrantBadge";
import { MatchCard, fixtureKickoff } from "./MatchCard";
import { formatMatchDate, roundLabel } from "./labels";
import { useNow } from "./useNow";

type Round = TournamentStructure["knockout"]["rounds"][number];

/**
 * Grand knockout bracket: the two halves of the draw converge on a centre
 * Final with the trophy (and the champion once decided). On small screens the
 * rounds stack vertically.
 */
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
  const { t, locale } = useLanguage();
  const f = t.dashboard.fixtures;
  const now = useNow();

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
  const earlier = rounds.slice(0, -1);
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

  return (
    <>
      {/* Desktop: mirrored grand bracket */}
      <div className="relative hidden overflow-x-auto rounded-3xl border border-accent/25 bg-[radial-gradient(ellipse_at_center,rgba(217,165,68,0.12),transparent_60%)] p-6 lg:block">
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-grid opacity-20" aria-hidden="true" />
        <div className="relative flex min-w-max items-stretch justify-center gap-6">
          {earlier.map((round) => (
            <BracketColumn key={`l${round.round}`} title={roundLabel(round.name, t)} date={roundDate(round)} side="left">
              {pairs(round.matches.slice(0, round.matches.length / 2)).map((pair, index) => (
                <Pair key={index} side="left" joined={pair.length === 2}>
                  {pair.map(card)}
                </Pair>
              ))}
            </BracketColumn>
          ))}

          <FinalColumn final={final} isCvC={isCvC} dateLabel={roundDate(final)}>
            {final.matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                isCvC={isCvC}
                now={now}
                size="lg"
                highlightParticipantId={highlightParticipantId}
                onOpen={onOpenMatch}
              />
            ))}
          </FinalColumn>

          {[...earlier].reverse().map((round) => (
            <BracketColumn key={`r${round.round}`} title={roundLabel(round.name, t)} date={roundDate(round)} side="right">
              {pairs(round.matches.slice(round.matches.length / 2)).map((pair, index) => (
                <Pair key={index} side="right" joined={pair.length === 2}>
                  {pair.map(card)}
                </Pair>
              ))}
            </BracketColumn>
          ))}
        </div>
      </div>

      {/* Mobile: rounds stacked */}
      <div className="space-y-6 lg:hidden">
        {rounds.map((round) => (
          <section key={round.round}>
            <div className="mb-2 flex items-center justify-between border-b border-surface-line pb-2">
              <span className={`font-mono text-xs font-black uppercase tracking-wider ${round === final ? "text-accent" : "text-accent-ink"}`}>
                {round === final ? t.dashboard.schedule.grandFinal : roundLabel(round.name, t)}
              </span>
              {roundDate(round) ? <span className="font-mono text-[10px] text-ink-faint">{roundDate(round)}</span> : null}
            </div>
            {round === final ? <ChampionBanner final={final} isCvC={isCvC} /> : null}
            <div className="grid gap-3 sm:grid-cols-2">{round.matches.map(card)}</div>
          </section>
        ))}
      </div>
    </>
  );
}

function pairs<T>(items: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += 2) out.push(items.slice(i, i + 2));
  return out;
}

function BracketColumn({
  title,
  date,
  side,
  children,
}: {
  title: string;
  date: string | null;
  side: "left" | "right";
  children: ReactNode;
}) {
  return (
    <div className="flex w-60 flex-col">
      <div className={`mb-4 ${side === "right" ? "text-right" : ""}`}>
        <div className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-accent-ink">{title}</div>
        {date ? <div className="mt-0.5 font-mono text-[10px] text-ink-faint">{date}</div> : null}
      </div>
      <div className="flex flex-1 flex-col justify-around gap-6">{children}</div>
    </div>
  );
}

/** Two matches feeding the same next-round match, joined by a bracket line. */
function Pair({ side, joined, children }: { side: "left" | "right"; joined: boolean; children: ReactNode }) {
  const outer = side === "left" ? "-right-3" : "-left-3";
  const stub = side === "left" ? "-right-6" : "-left-6";
  return (
    <div className="relative flex flex-col justify-around gap-6">
      {children}
      {joined ? (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute bottom-1/4 top-1/4 w-3 border-y-2 border-accent/35 ${outer} ${
            side === "left" ? "rounded-r-lg border-r-2" : "rounded-l-lg border-l-2"
          }`}
        />
      ) : null}
      <span aria-hidden="true" className={`pointer-events-none absolute top-1/2 w-3 border-t-2 border-accent/35 ${stub}`} />
    </div>
  );
}

function FinalColumn({
  final,
  isCvC,
  dateLabel,
  children,
}: {
  final: Round;
  isCvC: boolean;
  dateLabel: string | null;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex w-72 flex-col items-center justify-center">
      <div className="relative mb-4 flex flex-col items-center">
        <span
          aria-hidden="true"
          className="absolute -inset-6 rounded-full bg-accent/25 blur-2xl motion-safe:animate-pulse"
        />
        <span className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent bg-gradient-to-b from-accent/40 to-accent/5 text-accent shadow-[0_0_40px_rgba(217,165,68,0.55)]">
          <TrophyIcon className="h-10 w-10" />
        </span>
        <div className="relative mt-3 font-display text-lg font-black uppercase tracking-[0.2em] text-accent">
          {t.dashboard.schedule.grandFinal}
        </div>
        {dateLabel ? <div className="relative font-mono text-[10px] text-ink-faint">{dateLabel}</div> : null}
      </div>
      <div className="w-full rounded-2xl border border-accent/50 bg-accent-soft/20 p-2 shadow-[0_0_45px_-10px_rgba(217,165,68,0.6)]">
        {children}
      </div>
      <div className="mt-4 w-full">
        <ChampionBanner final={final} isCvC={isCvC} />
      </div>
    </div>
  );
}

function ChampionBanner({ final, isCvC }: { final: Round; isCvC: boolean }) {
  const { t } = useLanguage();
  const s = t.dashboard.schedule;
  const match = final.matches[0];
  if (!match || match.status !== "completed" && match.status !== "bye") return null;
  const champion =
    match.winnerParticipantId === match.participantA?.participantId
      ? match.participantA
      : match.winnerParticipantId === match.participantB?.participantId
        ? match.participantB
        : null;

  if (!champion) {
    return (
      <div className="rounded-2xl border border-danger/40 bg-danger-soft px-4 py-3 text-center text-xs font-semibold text-danger-ink">
        {s.noChampion}
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent bg-gradient-to-r from-accent/30 via-accent/15 to-accent/30 px-4 py-3 text-center shadow-[0_0_30px_-6px_rgba(217,165,68,0.7)]">
      <div className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-accent">{s.champion}</div>
      <div className="mt-2 flex items-center justify-center gap-2.5">
        <EntrantBadge entrant={champion} isCvC={isCvC} size="md" />
        <span className="truncate font-display text-base font-black text-ink">{champion.name}</span>
      </div>
    </div>
  );
}
