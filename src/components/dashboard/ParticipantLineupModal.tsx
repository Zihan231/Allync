"use client";

import { useEffect } from "react";
import { Avatar } from "@/components/common/Avatar";
import { ClubCrest } from "@/components/common/ClubCrest";
import { ClockIcon, CloseIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import type { TournamentLineupPlayer, TournamentParticipant } from "@/lib/api/tournaments";

/** Read-only view of a club's submitted tournament team. Mount only while open. */
export function ParticipantLineupModal({
  participant,
  startersCount,
  dateLocale,
  onClose,
  onEdit,
}: {
  participant: TournamentParticipant;
  startersCount: number;
  dateLocale: string;
  onClose: () => void;
  /** Shown for the viewer's own club while its team can still be changed. */
  onEdit?: () => void;
}) {
  const { t } = useLanguage();
  const pv = t.dashboard.participantView;
  const club = participant.club;
  const clubName = club?.name || pv.playerFallback;
  const lineup = participant.lineup;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-4 pt-[5vh] backdrop-blur-md">
      <button type="button" aria-label={pv.close} onClick={onClose} className="fixed inset-0 cursor-default" tabIndex={-1} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="participant-lineup-title"
        className="relative mb-8 w-full max-w-3xl overflow-hidden rounded-3xl border border-surface-line bg-bg-raised shadow-[0_30px_90px_-20px_rgba(0,0,0,0.85)]"
      >
        {/* Header in the club's colour */}
        <div
          className="relative flex items-center justify-between gap-4 border-b border-surface-line px-6 py-5"
          style={{ background: `linear-gradient(90deg, ${club?.color ?? "var(--accent)"}33, transparent 70%)` }}
        >
          <div className="flex min-w-0 items-center gap-4">
            <ClubCrest
              name={clubName}
              color={club?.color}
              initials={club?.initials}
              imageUrl={club?.dpUrl}
              size="lg"
              shape="square"
            />
            <div className="min-w-0">
              <h3 id="participant-lineup-title" className="truncate font-display text-xl font-black text-ink">
                {format(pv.teamTitle, { club: clubName })}
              </h3>
              <p className="mt-0.5 text-xs text-ink-soft">
                {format(pv.teamSubtitle, { preset: `${startersCount} v ${startersCount}` })}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-ink-faint">
                {participant.submittedAt ? (
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    {format(pv.submittedOn, { date: new Date(participant.submittedAt).toLocaleString(dateLocale) })}
                  </span>
                ) : null}
                {lineup?.teamName ? <span>{format(pv.squad, { team: lineup.teamName })}</span> : null}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="rounded-full bg-accent px-4 py-1.5 font-display text-xs font-bold text-bg transition-transform hover:-translate-y-0.5"
              >
                {t.dashboard.teamSubmission.editTeam}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              aria-label={pv.close}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-surface-line/60 hover:text-ink"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-6">
          {lineup ? (
            <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
              <PlayerColumn title={pv.startingLineup} players={lineup.starters} tone="success" />
              <PlayerColumn title={pv.bench} players={lineup.substitutes} tone="blue" />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-surface-line-strong py-12 text-center">
              <ClockIcon className="mx-auto h-8 w-8 text-warning-ink" />
              <h4 className="mt-3 font-display text-base font-bold text-ink">{pv.noLineupTitle}</h4>
              <p className="mt-1 text-xs text-ink-soft">{format(pv.noLineupBody, { club: clubName })}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const COLUMN_TONES = {
  success: { title: "text-success-ink", dot: "bg-success", badge: "bg-success-soft text-success-ink", border: "border-success/25" },
  blue: { title: "text-blue-ink", dot: "bg-blue", badge: "bg-blue-soft text-blue-ink", border: "border-blue/25" },
} as const;

function PlayerColumn({
  title,
  players,
  tone,
}: {
  title: string;
  players: TournamentLineupPlayer[];
  tone: keyof typeof COLUMN_TONES;
}) {
  const { t } = useLanguage();
  const pv = t.dashboard.participantView;
  const styles = COLUMN_TONES[tone];
  return (
    <section>
      <h4 className={`mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider ${styles.title}`}>
        <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
        {title} ({players.length})
      </h4>
      {players.length ? (
        <ol className="space-y-2">
          {players.map((player, index) => (
            <li
              key={player.profileId}
              className={`flex items-center gap-3 rounded-xl border bg-surface/70 px-3 py-2 ${styles.border}`}
            >
              <span className="w-5 shrink-0 text-right font-mono text-[11px] text-ink-faint">{index + 1}</span>
              <Avatar dpUrl={player.dpUrl} name={player.name || pv.playerFallback} size="sm" mode="static" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ink">{player.name || pv.playerFallback}</div>
                {player.inGameId ? (
                  <div className="font-mono text-[10px] text-ink-faint" data-latin-digits>
                    {format(pv.ign, { id: player.inGameId })}
                  </div>
                ) : null}
              </div>
              {player.gamePosition ? (
                <span className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${styles.badge}`}>
                  {player.gamePosition}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-ink-faint">—</p>
      )}
    </section>
  );
}
