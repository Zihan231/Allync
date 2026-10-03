"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/common/Avatar";
import { ClockIcon, CloseIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useRequestTimeChange, useRespondTimeChange } from "@/lib/api/hooks/useTournaments";
import type { Fixture, FixtureGame } from "@/lib/api/tournaments";
import { EntrantBadge } from "./EntrantBadge";
import {
  FIXTURE_STATUS_CLASSES,
  GAME_STATUS_CLASSES,
  fixtureStatusLabel,
  formatDuration,
  formatGameRange,
  formatMatchTime,
  gamePhase,
  gameStatusLabel,
  localTimeOnSameDate,
  roundLabel,
  toLocalTimeInput,
} from "./labels";
import { SubmitResultModal } from "./SubmitResultModal";
import { MyEvidencePanel } from "./MyEvidencePanel";
import { useNow } from "./useNow";

const FINAL_GAME_STATUSES = ["approved", "walkover", "forfeited"];

/**
 * A fixture with every 1v1 game inside it: each game's 3-hour range, live
 * countdown, time-change requests (players), evidence upload (players, only
 * inside the window) and review (officials). Mount only while open.
 */
export function MatchDetailModal({
  match,
  isCvC,
  tournamentId,
  viewerUserId,
  focusGameId,
  focusPanel,
  onClose,
  onMessage,
  onReviewGame,
}: {
  match: Fixture;
  isCvC: boolean;
  tournamentId: string;
  viewerUserId?: string | null;
  /** Deep link: scroll to this game (and open its timing panel when `focusPanel` is "time"). */
  focusGameId?: string | null;
  focusPanel?: string | null;
  onClose: () => void;
  onMessage?: (message: string) => void;
  /** Officials: open the review screen for a game. */
  onReviewGame?: (gameId: string) => void;
}) {
  const { t } = useLanguage();
  const f = t.dashboard.fixtures;
  const [submittingGame, setSubmittingGame] = useState<{ game: FixtureGame; resubmit: boolean } | null>(null);
  const now = useNow();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submittingGame) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submittingGame]);

  const heading = match.groupLabel
    ? `${format(f.group, { label: match.groupLabel })} · ${roundLabel(match.roundName, t)}`
    : roundLabel(match.roundName, t);
  const fixtureOpen = match.status === "scheduled" || match.status === "in_review";

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
            <span className="max-w-full truncate font-display text-sm font-bold text-ink">{match.participantA?.name ?? f.tbd}</span>
          </div>
          <div className="text-center">
            <div className="font-display text-3xl font-black tabular-nums text-ink">
              {match.scoreA ?? "–"} <span className="text-ink-faint">:</span> {match.scoreB ?? "–"}
            </div>
            {isCvC && match.goalsA !== null && match.goalsB !== null ? (
              <div className="mt-1 font-mono text-[11px] text-ink-faint">{format(f.aggregate, { a: match.goalsA, b: match.goalsB })}</div>
            ) : null}
            {match.doubleForfeit ? (
              <div className="mt-1 text-[11px] font-semibold text-danger-ink">{t.dashboard.schedule.resolutionDoubleForfeit}</div>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-col items-center gap-2 text-center">
            <EntrantBadge entrant={match.participantB} isCvC={isCvC} size="md" />
            <span className="max-w-full truncate font-display text-sm font-bold text-ink">{match.participantB?.name ?? f.tbd}</span>
          </div>
        </div>

        {match.games.length ? (
          <div className="border-t border-surface-line px-6 py-5">
            <h4 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-soft">{f.gamesTitle}</h4>
            <ol className="space-y-3">
              {match.games.map((game) => (
                <GameRow
                  key={game.id}
                  game={game}
                  now={now}
                  tournamentId={tournamentId}
                  viewerUserId={viewerUserId ?? null}
                  fixtureOpen={fixtureOpen}
                  focused={game.id === focusGameId}
                  openTiming={game.id === focusGameId && focusPanel === "time"}
                  onUpload={(resubmit) => setSubmittingGame({ game, resubmit })}
                  onReview={
                    onReviewGame &&
                    fixtureOpen &&
                    game.evidenceDeadline !== null &&
                    now > new Date(game.evidenceDeadline).getTime()
                      ? () => onReviewGame(game.id)
                      : undefined
                  }
                  onMessage={onMessage}
                />
              ))}
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
          onSubmitted={(message) => onMessage?.(message)}
        />
      ) : null}
    </div>
  );
}

function GameRow({
  game,
  now,
  tournamentId,
  viewerUserId,
  fixtureOpen,
  focused,
  openTiming,
  onUpload,
  onReview,
  onMessage,
}: {
  game: FixtureGame;
  now: number;
  tournamentId: string;
  viewerUserId: string | null;
  fixtureOpen: boolean;
  focused: boolean;
  openTiming: boolean;
  onUpload: (resubmit: boolean) => void;
  onReview?: () => void;
  onMessage?: (message: string) => void;
}) {
  const { t, locale } = useLanguage();
  const f = t.dashboard.fixtures;
  const r = t.dashboard.results;
  const s = t.dashboard.schedule;
  const rowRef = useRef<HTMLLIElement>(null);
  const requestMutation = useRequestTimeChange(tournamentId);
  const respondMutation = useRespondTimeChange(tournamentId);

  const [editingTime, setEditingTime] = useState(openTiming);
  const [newTime, setNewTime] = useState(() => (game.scheduledStart ? toLocalTimeInput(game.scheduledStart) : ""));
  const [error, setError] = useState("");
  const [showEvidence, setShowEvidence] = useState(false);

  useEffect(() => {
    if (!focused) return;
    const frame = requestAnimationFrame(() => rowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
    return () => cancelAnimationFrame(frame);
  }, [focused]);

  const mySide = viewerUserId
    ? game.playerA.userId === viewerUserId
      ? "A"
      : game.playerB.userId === viewerUserId
        ? "B"
        : null
    : null;
  const opponentName = mySide === "A" ? game.playerB.name : game.playerA.name;
  const isFinal = FINAL_GAME_STATUSES.includes(game.status);
  const phase = gamePhase(game, now);
  const range = formatGameRange(game, t, locale);
  const iSubmitted = mySide ? game.submittedSides.includes(mySide) : false;
  const rejectedWindowOpen =
    game.status === "rejected" && game.evidenceDeadline !== null && now <= new Date(game.evidenceDeadline).getTime();
  const canUpload = Boolean(mySide) && fixtureOpen && !isFinal && (phase === "playing" || phase === "evidence" || rejectedWindowOpen);
  const canChangeTime = Boolean(mySide) && fixtureOpen && game.status === "pending" && phase === "upcoming";
  const request = game.pendingTimeRequest;
  const moved = game.scheduledStart && game.systemScheduledStart && game.scheduledStart !== game.systemScheduledStart;

  const phaseText =
    isFinal || !range
      ? null
      : phase === "upcoming"
        ? format(s.startsIn, { time: formatDuration(new Date(game.scheduledStart!).getTime() - now) })
        : phase === "playing"
          ? format(s.playingNow, { time: formatMatchTime(game.evidenceDeadline!, locale) })
          : phase === "evidence" || rejectedWindowOpen
            ? format(s.evidenceCloses, { time: formatDuration(new Date(game.evidenceDeadline!).getTime() - now) })
            : s.windowClosed;

  async function sendRequest() {
    if (!game.scheduledStart || !newTime) return setError(s.errTime);
    setError("");
    try {
      await requestMutation.mutateAsync({ gameId: game.id, proposedStart: localTimeOnSameDate(game.scheduledStart, newTime) });
      setEditingTime(false);
      onMessage?.(s.requestSent);
    } catch (err: unknown) {
      setError((err as Error)?.message || s.errRequest);
    }
  }

  async function respond(accept: boolean) {
    if (!request) return;
    setError("");
    try {
      await respondMutation.mutateAsync({ requestId: request.id, accept });
      onMessage?.(accept ? s.accepted : s.declined);
    } catch (err: unknown) {
      setError((err as Error)?.message || s.errRespond);
    }
  }

  return (
    <li
      ref={rowRef}
      className={`scroll-mt-24 rounded-xl border px-3 py-2.5 transition-shadow ${
        mySide ? "border-accent/50 bg-accent-soft/30" : "border-surface-line bg-surface/60"
      } ${focused ? "ring-2 ring-accent/60" : ""}`}
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

      {/* Schedule line */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-surface-line/70 pt-2 text-[11px]">
        <span className="flex flex-wrap items-center gap-1.5 text-ink-soft">
          <ClockIcon className="h-3.5 w-3.5 text-accent" />
          {range ? (
            <>
              <span className="font-semibold text-ink">{range}</span>
              <span className="text-ink-faint">({s.bdTime})</span>
              {moved ? <span className="rounded bg-blue-soft px-1.5 py-px text-[9px] font-bold text-blue-ink">{s.agreedTime}</span> : null}
            </>
          ) : (
            s.timeTbd
          )}
        </span>
        {phaseText ? <span className={`font-semibold ${phase === "closed" ? "text-danger-ink" : "text-accent-ink"}`}>{phaseText}</span> : null}
      </div>

      {game.resolution === "walkover" || game.resolution === "double_forfeit" ? (
        <p className="mt-1.5 text-[11px] font-semibold text-warning-ink">
          {game.resolution === "walkover" ? s.resolutionWalkover : s.resolutionDoubleForfeit}
        </p>
      ) : null}
      {game.status === "rejected" && mySide ? (
        <p className="mt-1.5 text-[11px] font-semibold text-danger-ink">
          {game.reviewNote ? format(r.rejectedNote, { note: game.reviewNote }) : r.rejectedNoNote}
        </p>
      ) : null}

      {/* Timing panel (players) */}
      {mySide && (canChangeTime || request || openTiming) ? (
        <div className="mt-2 rounded-lg border border-surface-line bg-bg/50 p-2.5 text-[11px]">
          <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wide text-ink-soft">{s.timingTitle}</div>
          {request ? (
            request.requestedByUserId === viewerUserId ? (
              <p className="text-ink-soft">{format(s.youProposed, { time: formatMatchTime(request.proposedStart, locale) })}</p>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-ink">
                  {format(s.opponentProposed, { name: opponentName, time: formatMatchTime(request.proposedStart, locale) })}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={respondMutation.isPending}
                    onClick={() => respond(false)}
                    className="rounded-full border border-surface-line-strong px-3 py-1 font-bold text-ink-soft hover:text-ink disabled:opacity-40"
                  >
                    {s.decline}
                  </button>
                  <button
                    type="button"
                    disabled={respondMutation.isPending}
                    onClick={() => respond(true)}
                    className="rounded-full bg-success px-3 py-1 font-bold text-bg disabled:opacity-40"
                  >
                    {s.accept}
                  </button>
                </div>
              </div>
            )
          ) : canChangeTime ? (
            editingTime ? (
              <div className="flex flex-wrap items-end gap-2">
                <label className="block">
                  <span className="text-ink-soft">{s.newTimeLabel}</span>
                  <input
                    type="time"
                    step={900}
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="mt-1 block rounded-lg border border-surface-line bg-bg px-2.5 py-1.5 text-xs text-ink [color-scheme:dark]"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setEditingTime(false)}
                  className="rounded-full border border-surface-line-strong px-3 py-1.5 font-bold text-ink-soft hover:text-ink"
                >
                  {s.cancel}
                </button>
                <button
                  type="button"
                  disabled={requestMutation.isPending}
                  onClick={sendRequest}
                  className="rounded-full bg-accent px-3 py-1.5 font-bold text-bg disabled:opacity-40"
                >
                  {s.sendRequest}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingTime(true)}
                className="rounded-full border border-accent/50 bg-accent-soft px-3 py-1 font-bold text-accent-ink hover:bg-accent hover:text-bg"
              >
                {s.requestChange}
              </button>
            )
          ) : (
            <p className="text-ink-faint">{s.noChangeAfterStart}</p>
          )}
          {error ? <p className="mt-1.5 font-semibold text-danger-ink" role="alert">{error}</p> : null}
        </div>
      ) : null}

      {/* Actions */}
      {(mySide && (!isFinal || iSubmitted)) || onReview ? (
        <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
          {mySide && iSubmitted ? (
            <button
              type="button"
              onClick={() => setShowEvidence((open) => !open)}
              aria-expanded={showEvidence}
              className="rounded-full border border-surface-line-strong px-4 py-1.5 text-xs font-bold text-ink-soft transition-colors hover:border-accent hover:text-ink"
            >
              {showEvidence ? r.hideMyEvidence : r.viewMyEvidence}
            </button>
          ) : null}
          {mySide && !isFinal ? (
            canUpload ? (
              <>
                {iSubmitted ? <span className="text-[11px] font-semibold text-warning-ink">{r.submittedAwaiting}</span> : null}
                <button
                  type="button"
                  onClick={() => onUpload(iSubmitted)}
                  className="rounded-full bg-accent px-4 py-1.5 font-display text-xs font-bold text-bg transition-transform hover:-translate-y-0.5"
                >
                  {iSubmitted || game.status === "rejected" ? r.resubmit : r.submit}
                </button>
              </>
            ) : phase === "upcoming" && game.scheduledStart ? (
              <span className="text-[11px] text-ink-faint">
                {format(s.uploadOpensAt, { time: formatMatchTime(game.scheduledStart, locale) })}
              </span>
            ) : null
          ) : null}
          {onReview ? (
            <button
              type="button"
              onClick={onReview}
              className="rounded-full border border-warning/50 bg-warning-soft px-4 py-1.5 text-xs font-bold text-warning-ink transition-colors hover:bg-warning hover:text-bg"
            >
              {t.dashboard.review.review}
            </button>
          ) : null}
        </div>
      ) : null}
      {mySide && iSubmitted && showEvidence ? <MyEvidencePanel tournamentId={tournamentId} gameId={game.id} /> : null}
    </li>
  );
}
