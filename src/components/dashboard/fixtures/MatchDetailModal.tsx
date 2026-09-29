"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/common/Avatar";
import { CloseIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import type { Fixture, FixtureGame } from "@/lib/api/tournaments";
import { SubmitResultModal } from "./SubmitResultModal";
import { EntrantBadge } from "./EntrantBadge";
import { FIXTURE_STATUS_CLASSES, GAME_STATUS_CLASSES, fixtureStatusLabel, gameStatusLabel, roundLabel } from "./labels";

/**
 * A fixture with every 1v1 game inside it. The viewer's own games (as the
 * player, or as an official of that side's club) get a Submit result action.
 * Mount only while open.
 */
export function MatchDetailModal({
  match,
  isCvC,
  tournamentId,
  viewerUserId,
  officialParticipantId,
  onClose,
  onSubmitted,
  onReviewGame,
}: {
  match: Fixture;
  isCvC: boolean;
  tournamentId: string;
  viewerUserId?: string | null;
  /** Participant (club) the viewer may submit for as a club official. */
  officialParticipantId?: string | null;
  onClose: () => void;
  onSubmitted?: (message: string) => void;
  /** Officials: open the review screen for a game (also used to record forfeits). */
  onReviewGame?: (gameId: string) => void;
}) {
  const { t } = useLanguage();
  const f = t.dashboard.fixtures;
  const r = t.dashboard.results;
  const [submittingGame, setSubmittingGame] = useState<{ game: FixtureGame; resubmit: boolean } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Escape belongs to the submit popup while it is open.
      if (e.key === "Escape" && !submittingGame) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submittingGame]);

  const fixtureOpen = match.status === "scheduled" || match.status === "in_review";
  const sideFor = (game: FixtureGame): "A" | "B" | null => {
    if (!fixtureOpen || game.status === "approved") return null;
    if (viewerUserId && game.playerA.userId === viewerUserId) return "A";
    if (viewerUserId && game.playerB.userId === viewerUserId) return "B";
    if (officialParticipantId && match.participantA?.participantId === officialParticipantId) return "A";
    if (officialParticipantId && match.participantB?.participantId === officialParticipantId) return "B";
    return null;
  };

  const heading = match.groupLabel
    ? `${format(f.group, { label: match.groupLabel })} · ${roundLabel(match.roundName, t)}`
    : roundLabel(match.roundName, t);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-4 pt-[5vh] backdrop-blur-md">
      <button type="button" aria-label={f.close} onClick={onClose} className="fixed inset-0 cursor-default" tabIndex={-1} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        className="relative mb-8 w-full max-w-2xl overflow-hidden rounded-3xl border border-surface-line bg-bg-raised shadow-[0_30px_90px_-20px_rgba(0,0,0,0.85)]"
      >
        <div className="flex items-center justify-between border-b border-surface-line px-6 py-3">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-soft">{heading}</span>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${FIXTURE_STATUS_CLASSES[match.status]}`}>
              {fixtureStatusLabel(match.status, t)}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label={f.close}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-surface-line/60 hover:text-ink"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-6">
          <div className="flex min-w-0 flex-col items-center gap-2 text-center">
            <EntrantBadge entrant={match.participantA} isCvC={isCvC} size="md" />
            <span className="max-w-full truncate font-display text-sm font-bold text-ink">
              {match.participantA?.name ?? f.tbd}
            </span>
          </div>
          <div className="text-center">
            <div className="font-display text-3xl font-black tabular-nums text-ink">
              {match.scoreA ?? "–"} <span className="text-ink-faint">:</span> {match.scoreB ?? "–"}
            </div>
            {isCvC && match.goalsA !== null && match.goalsB !== null ? (
              <div className="mt-1 font-mono text-[11px] text-ink-faint">
                {format(f.aggregate, { a: match.goalsA, b: match.goalsB })}
              </div>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-col items-center gap-2 text-center">
            <EntrantBadge entrant={match.participantB} isCvC={isCvC} size="md" />
            <span className="max-w-full truncate font-display text-sm font-bold text-ink">
              {match.participantB?.name ?? f.tbd}
            </span>
          </div>
        </div>

        {match.games.length ? (
          <div className="border-t border-surface-line px-6 py-5">
            <h4 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-soft">{f.gamesTitle}</h4>
            <ol className="space-y-2">
              {match.games.map((game) => {
                const mySide = sideFor(game);
                const iSubmitted = mySide ? game.submittedSides.includes(mySide) : false;
                const opponentSubmitted = mySide ? game.submittedSides.some((side) => side !== mySide) : false;
                return (
                <li
                  key={game.id}
                  className={`rounded-xl border px-3 py-2 ${
                    mySide ? "border-accent/50 bg-accent-soft/30" : "border-surface-line bg-surface/60"
                  }`}
                >
                  <div className="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-3">
                  <span className="w-12 font-mono text-[10px] text-ink-faint">
                    {game.isDecider ? f.decider : format(f.game, { number: game.slot })}
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar dpUrl={game.playerA.dpUrl} name={game.playerA.name} size="sm" mode="static" />
                    <span className="truncate text-xs font-semibold text-ink">{game.playerA.name}</span>
                  </span>
                  <span className="flex flex-col items-center">
                    <span className="font-mono text-sm font-black tabular-nums text-ink">
                      {game.goalsA ?? "–"}:{game.goalsB ?? "–"}
                    </span>
                    <span className={`mt-0.5 rounded-full px-1.5 py-px text-[9px] font-bold ${GAME_STATUS_CLASSES[game.status]}`}>
                      {gameStatusLabel(game.status, t)}
                    </span>
                  </span>
                  <span className="flex min-w-0 items-center justify-end gap-2">
                    <span className="truncate text-right text-xs font-semibold text-ink">{game.playerB.name}</span>
                    <Avatar dpUrl={game.playerB.dpUrl} name={game.playerB.name} size="sm" mode="static" />
                  </span>
                  </div>

                  {onReviewGame && fixtureOpen && game.status !== "approved" ? (
                    <div className="mt-2 flex items-center justify-end border-t border-surface-line/70 pt-2">
                      <button
                        type="button"
                        onClick={() => onReviewGame(game.id)}
                        className="rounded-full border border-warning/50 bg-warning-soft px-4 py-1.5 text-xs font-bold text-warning-ink transition-colors hover:bg-warning hover:text-bg"
                      >
                        {t.dashboard.review.review}
                      </button>
                    </div>
                  ) : null}

                  {mySide ? (
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-surface-line/70 pt-2">
                      <div className="space-y-0.5 text-[11px]">
                        {game.status === "rejected" ? (
                          <p className="font-semibold text-danger-ink">
                            {game.reviewNote ? format(r.rejectedNote, { note: game.reviewNote }) : r.rejectedNoNote}
                          </p>
                        ) : iSubmitted ? (
                          <p className="font-semibold text-warning-ink">{r.submittedAwaiting}</p>
                        ) : (
                          <p className="font-semibold text-accent-ink">{r.yourGame}</p>
                        )}
                        {opponentSubmitted ? <p className="text-ink-faint">{r.opponentSubmitted}</p> : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSubmittingGame({ game, resubmit: iSubmitted })}
                        className="rounded-full bg-accent px-4 py-1.5 font-display text-xs font-bold text-bg transition-transform hover:-translate-y-0.5"
                      >
                        {iSubmitted || game.status === "rejected" ? r.resubmit : r.submit}
                      </button>
                    </div>
                  ) : null}
                </li>
                );
              })}
            </ol>
          </div>
        ) : null}
      </div>

      {submittingGame ? (
        <SubmitResultModal
          tournamentId={tournamentId}
          game={submittingGame.game}
          isResubmission={submittingGame.resubmit}
          onClose={() => setSubmittingGame(null)}
          onSubmitted={(message) => onSubmitted?.(message)}
        />
      ) : null}
    </div>
  );
}
