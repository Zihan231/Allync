"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/common/Avatar";
import { CloseIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useGameReview, useReviewGame } from "@/lib/api/hooks/useTournaments";
import type { GameSubmission, ReviewGame } from "@/lib/api/tournaments";
import { GAME_STATUS_CLASSES, formatMatchTime, gameStatusLabel, roundLabel } from "./labels";

const digitsOnly = (value: string) => value.replace(/\D/g, "").slice(0, 2);

/** Starting official score: the agreed score, or the only one submitted. */
function suggestedScore(game: ReviewGame): { a: string; b: string } {
  const [first, second] = game.submissions;
  if (game.goalsA !== null && game.goalsB !== null) return { a: String(game.goalsA), b: String(game.goalsB) };
  if (first && (!second || (first.goalsA === second.goalsA && first.goalsB === second.goalsB))) {
    return { a: String(first.goalsA), b: String(first.goalsB) };
  }
  return { a: "", b: "" };
}

/**
 * Officials compare both sides' evidence and approve the official score or
 * reject (players resubmit). Mount only while open.
 */
export function ReviewGameModal({
  tournamentId,
  gameId,
  onClose,
  onReviewed,
}: {
  tournamentId: string;
  gameId: string;
  onClose: () => void;
  onReviewed: (message: string) => void;
}) {
  const { t, locale } = useLanguage();
  const rv = t.dashboard.review;
  const { data: game, isLoading } = useGameReview(tournamentId, gameId);
  const mutation = useReviewGame(tournamentId);

  const [score, setScore] = useState<{ a: string; b: string } | null>(null);
  const [decider, setDecider] = useState<"A" | "B" | "">("");
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [needsDecider, setNeedsDecider] = useState(false);

  // Pre-fill once the game has loaded.
  const current = score ?? (game ? suggestedScore(game) : { a: "", b: "" });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !mutation.isPending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, mutation.isPending]);

  const dateLocale = locale === "bn" ? "bn-BD" : "en-US";
  const submissionFor = (side: "A" | "B") => game?.submissions.find((s) => s.side === side) ?? null;
  const [subA, subB] = [submissionFor("A"), submissionFor("B")];
  const mismatch = Boolean(subA && subB && (subA.goalsA !== subB.goalsA || subA.goalsB !== subB.goalsB));
  // Evidence is viewable early; approve / reject wait for the upload window to close.
  const locked = Boolean(game && !game.reviewOpen);

  async function submit(action: "approve" | "reject") {
    if (!game) return;
    setError("");
    try {
      if (action === "reject") {
        await mutation.mutateAsync({ gameId, decision: { action, note: note.trim() || undefined } });
        onReviewed(rv.rejected);
        onClose();
        return;
      }
      if (current.a === "" || current.b === "") return setError(rv.errScore);
      const result = await mutation.mutateAsync({
        gameId,
        decision: {
          action,
          goalsA: Number(current.a),
          goalsB: Number(current.b),
          ...(decider ? { deciderWinner: decider } : {}),
        },
      });
      if (result.fixture === "needs_decider") {
        setNeedsDecider(true);
        return;
      }
      onReviewed(rv.approved);
      onClose();
    } catch (err: unknown) {
      setError((err as Error)?.message || rv.errReview);
    }
  }

  const evidenceColumn = (side: "A" | "B", submission: GameSubmission | null) => {
    if (!game) return null;
    const player = side === "A" ? game.playerA : game.playerB;
    const entrant = side === "A" ? game.entrantA : game.entrantB;
    return (
      <section className="min-w-0 rounded-2xl border border-surface-line bg-surface/50 p-4">
        <header className="flex items-center gap-2.5">
          <Avatar dpUrl={player.dpUrl} name={player.name} size="sm" mode="static" />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-ink">{player.name}</div>
            <div className="truncate text-[11px] text-ink-faint">{entrant}</div>
          </div>
        </header>

        {submission ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-bg/60 px-3 py-2">
              <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{rv.claimedScore}</span>
              <span className="font-display text-lg font-black tabular-nums text-ink">
                {submission.goalsA} : {submission.goalsB}
              </span>
            </div>
            <div className="font-mono text-[10px] text-ink-faint">
              {format(rv.submittedAt, { date: new Date(submission.submittedAt).toLocaleString(dateLocale) })}
            </div>
            {submission.screenshotUrls.length ? (
              <div>
                <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wide text-ink-soft">{rv.screenshots}</div>
                <div className="grid grid-cols-2 gap-2">
                  {submission.screenshotUrls.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" title={rv.openFull} className="block overflow-hidden rounded-lg border border-surface-line">
                      {/* eslint-disable-next-line @next/next/no-img-element -- evidence served from the backend uploads folder */}
                      <img src={url} alt="" className="h-24 w-full object-cover transition-transform hover:scale-105" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
            {submission.videoUrl ? (
              <div>
                <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wide text-ink-soft">{rv.video}</div>
                <video src={submission.videoUrl} controls preload="metadata" className="max-h-60 w-full rounded-lg bg-black" />
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-surface-line py-6 text-center text-xs text-ink-faint">
            {rv.noSubmission}
          </p>
        )}
      </section>
    );
  };

  const scoreInput = (value: string, key: "a" | "b", label: string) => (
    <input
      type="text"
      inputMode="numeric"
      aria-label={label}
      value={value}
      onChange={(e) => setScore({ ...current, [key]: digitsOnly(e.target.value) })}
      placeholder="0"
      className="h-12 w-14 rounded-xl border border-surface-line bg-bg text-center font-display text-xl font-black text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
    />
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-[3vh] backdrop-blur-md">
      <button type="button" aria-label={rv.close} disabled={mutation.isPending} onClick={onClose} className="fixed inset-0 cursor-default" tabIndex={-1} />

      <div role="dialog" aria-modal="true" aria-labelledby="review-game-title" className="relative mb-8 w-full max-w-4xl overflow-hidden rounded-3xl border border-surface-line bg-bg-raised shadow-[0_30px_90px_-20px_rgba(0,0,0,0.85)]">
        <div className="flex items-start justify-between gap-4 border-b border-surface-line px-6 py-4">
          <div>
            <h3 id="review-game-title" className="font-display text-lg font-black text-ink">{rv.title}</h3>
            {game ? (
              <p className="mt-0.5 text-xs text-ink-soft">
                {game.entrantA} vs {game.entrantB} · {roundLabel(game.roundName, t)} · {format(t.dashboard.fixtures.game, { number: game.slot })}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {game ? (
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${GAME_STATUS_CLASSES[game.status]}`}>
                {gameStatusLabel(game.status, t)}
              </span>
            ) : null}
            <button type="button" onClick={onClose} disabled={mutation.isPending} aria-label={rv.close} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-surface-line/60 hover:text-ink disabled:opacity-40">
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isLoading || !game ? (
          <div className="flex items-center justify-center gap-3 py-20 text-xs text-ink-faint">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            {rv.loading}
          </div>
        ) : (
          <div className="space-y-5 px-6 py-5">
            {locked ? (
              <div className="rounded-xl border border-blue/40 bg-blue-soft px-4 py-2.5 text-xs font-semibold text-blue-ink">
                {format(rv.earlyBanner, { time: game.reviewOpensAt ? formatMatchTime(game.reviewOpensAt, locale) : "—" })}
              </div>
            ) : null}
            {mismatch ? (
              <div className="rounded-xl border border-warning/40 bg-warning-soft px-4 py-2.5 text-xs font-semibold text-warning-ink">{rv.mismatch}</div>
            ) : null}
            {!subA && !subB ? (
              <div className="rounded-xl border border-blue/30 bg-blue-soft px-4 py-2.5 text-xs text-blue-ink">{rv.forfeitHint}</div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              {evidenceColumn("A", subA)}
              {evidenceColumn("B", subB)}
            </div>

            {/* Decision */}
            <section className="rounded-2xl border border-accent/30 bg-accent-soft/30 p-4">
              <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-accent-ink">{rv.finalScore}</h4>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="max-w-[10rem] truncate text-xs font-semibold text-ink">{game.playerA.name}</span>
                {scoreInput(current.a, "a", game.playerA.name)}
                <span className="font-display text-lg font-black text-ink-faint">:</span>
                {scoreInput(current.b, "b", game.playerB.name)}
                <span className="max-w-[10rem] truncate text-xs font-semibold text-ink">{game.playerB.name}</span>
              </div>

              {game.stage === "knockout" ? (
                <label className="mt-4 block text-xs text-ink-soft">
                  {rv.decider}
                  <select
                    value={decider}
                    onChange={(e) => setDecider(e.target.value as "A" | "B" | "")}
                    className="mt-1.5 block w-full max-w-xs rounded-lg border border-surface-line bg-bg px-3 py-2 text-xs text-ink"
                  >
                    <option value="">{rv.deciderNone}</option>
                    <option value="A">{game.entrantA}</option>
                    <option value="B">{game.entrantB}</option>
                  </select>
                </label>
              ) : null}

              {needsDecider ? (
                <p className="mt-3 text-xs font-semibold text-warning-ink" role="alert">{rv.needsDecider}</p>
              ) : null}
            </section>

            {rejecting ? (
              <label className="block text-xs text-ink-soft">
                {rv.rejectNote}
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="mt-1.5 w-full rounded-xl border border-surface-line bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-danger"
                />
              </label>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-danger/40 bg-danger-soft p-3 text-xs font-semibold text-danger-ink" role="alert">{error}</div>
            ) : null}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-surface-line px-6 py-4">
          {rejecting ? (
            <>
              <button type="button" onClick={() => setRejecting(false)} disabled={mutation.isPending} className="rounded-full border border-surface-line-strong px-4 py-2 text-xs font-semibold text-ink-soft hover:text-ink disabled:opacity-40">
                {rv.cancel}
              </button>
              <button type="button" onClick={() => submit("reject")} disabled={mutation.isPending || !game} className="rounded-full bg-danger px-5 py-2 text-xs font-bold text-white disabled:opacity-40">
                {rv.rejectConfirm}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setRejecting(true)} disabled={mutation.isPending || !game || locked} className="rounded-full border border-danger/50 bg-danger-soft px-4 py-2 text-xs font-bold text-danger-ink transition-colors hover:bg-danger hover:text-white disabled:opacity-40">
                {rv.reject}
              </button>
              <button type="button" onClick={() => submit("approve")} disabled={mutation.isPending || !game || locked} className="rounded-full bg-success px-6 py-2.5 font-display text-sm font-black text-bg shadow-[0_0_18px_rgba(63,191,127,0.35)] transition-transform hover:-translate-y-0.5 disabled:opacity-40">
                {mutation.isPending ? rv.approving : rv.approve}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
