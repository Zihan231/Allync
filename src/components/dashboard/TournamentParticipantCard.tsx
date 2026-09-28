"use client";

import { Avatar } from "@/components/common/Avatar";
import { ClubCrest } from "@/components/common/ClubCrest";
import { ArrowRightIcon, CheckIcon, ClockIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import type { TournamentParticipant } from "@/lib/api/tournaments";

const MAX_FACES = 5;

/**
 * One entrant in a tournament's Participants tab. Club entries open their
 * submitted team (`onViewTeam`); player entries are informational only.
 */
export function TournamentParticipantCard({
  participant,
  seed,
  isCvC,
  isMine,
  dateLocale,
  onViewTeam,
}: {
  participant: TournamentParticipant;
  seed: number;
  isCvC: boolean;
  isMine: boolean;
  dateLocale: string;
  onViewTeam?: () => void;
}) {
  const { t } = useLanguage();
  const pv = t.dashboard.participantView;

  const name = isCvC ? participant.club?.name || pv.playerFallback : participant.user?.name || pv.playerFallback;
  const lineup = participant.lineup;
  const hasLineup = Boolean(lineup);
  const faces = [...(lineup?.starters ?? []), ...(lineup?.substitutes ?? [])];
  const joined = new Date(participant.createdAt).toLocaleDateString(dateLocale, { month: "short", day: "numeric" });

  const body = (
    <>
      {/* Accent strip: gold for your own entry, green once a team is in, grey while waiting */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${
          isMine ? "bg-accent" : hasLineup || !isCvC ? "bg-success/70" : "bg-surface-line-strong"
        }`}
      />

      <div className="flex items-start gap-3.5">
        <div className="relative shrink-0">
          {isCvC ? (
            <ClubCrest
              name={name}
              color={participant.club?.color}
              initials={participant.club?.initials}
              imageUrl={participant.club?.dpUrl}
              size="lg"
              shape="square"
            />
          ) : (
            <Avatar dpUrl={participant.user?.dpUrl} name={name} size="lg" mode="static" />
          )}
          <span className="absolute -bottom-1.5 -right-1.5 rounded-md border border-surface-line-strong bg-bg-raised px-1.5 py-px font-mono text-[10px] font-bold text-ink-soft">
            {format(pv.seed, { number: seed })}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate font-display text-base font-bold text-ink">{name}</h4>
            {isMine ? (
              <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-bg">
                {isCvC ? pv.yourClub : pv.you}
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] text-ink-faint">
            <span>{format(pv.joinedOn, { date: joined })}</span>
            {!isCvC && participant.user?.inGameId ? (
              <span data-latin-digits>{format(pv.ign, { id: participant.user.inGameId })}</span>
            ) : null}
          </div>

          {isCvC ? (
            <span
              className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                hasLineup ? "bg-success-soft text-success-ink" : "bg-warning-soft text-warning-ink"
              }`}
            >
              {hasLineup ? <CheckIcon className="h-3 w-3" /> : <ClockIcon className="h-3 w-3" />}
              {hasLineup ? pv.lineupReady : pv.awaitingLineup}
            </span>
          ) : null}
        </div>
      </div>

      {isCvC ? (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-surface-line pt-3">
          {hasLineup ? (
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex -space-x-2">
                {faces.slice(0, MAX_FACES).map((player) => (
                  <span key={player.profileId} className="rounded-full ring-2 ring-surface">
                    <Avatar dpUrl={player.dpUrl} name={player.name} size="sm" mode="static" />
                  </span>
                ))}
                {faces.length > MAX_FACES ? (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-line font-mono text-[10px] font-bold text-ink-soft ring-2 ring-surface">
                    +{faces.length - MAX_FACES}
                  </span>
                ) : null}
              </div>
              <span className="truncate font-mono text-[11px] text-ink-faint">
                {format(pv.rosterCount, { starters: lineup!.starters.length, subs: lineup!.substitutes.length })}
              </span>
            </div>
          ) : (
            <span className="font-mono text-[11px] text-ink-faint">—</span>
          )}
          <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-accent-ink transition-transform group-hover:translate-x-0.5">
            {pv.viewTeam}
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </span>
        </div>
      ) : null}
    </>
  );

  const cardClass = `group relative overflow-hidden rounded-2xl border p-5 pt-6 text-left transition-all duration-200 ${
    isMine ? "border-accent/50 bg-accent-soft/30" : "border-surface-line bg-surface/70"
  }`;

  return onViewTeam ? (
    <button
      type="button"
      onClick={onViewTeam}
      className={`${cardClass} w-full hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-[0_12px_30px_-12px_rgba(217,165,68,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
    >
      {body}
    </button>
  ) : (
    <div className={cardClass}>{body}</div>
  );
}
