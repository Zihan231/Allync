"use client";

import { BracketIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import type { Fixture, TournamentStructure } from "@/lib/api/tournaments";
import { EntrantBadge } from "./EntrantBadge";
import { GrandBracket } from "./GrandBracket";
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

  return (
    <>
      {/* Desktop: UEFA-style draw converging on the trophy */}
      <div className="hidden lg:block">
        <GrandBracket
          rounds={rounds}
          title={title}
          isCvC={isCvC}
          now={now}
          highlightParticipantId={highlightParticipantId}
          onOpenMatch={onOpenMatch}
        />
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
