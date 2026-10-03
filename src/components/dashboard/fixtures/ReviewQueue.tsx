"use client";

import { ShieldIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useReviewQueue } from "@/lib/api/hooks/useTournaments";
import { formatMatchTime, roundLabel } from "./labels";

/** Officials' list of games whose evidence is waiting for a decision. */
export function ReviewQueue({
  tournamentId,
  onReview,
}: {
  tournamentId: string;
  onReview: (gameId: string) => void;
}) {
  const { t, locale } = useLanguage();
  const rv = t.dashboard.review;
  const { data: queue = [], isLoading } = useReviewQueue(tournamentId, true);
  const ready = queue.filter((g) => g.reviewOpen).length;

  return (
    <section className="rounded-2xl border border-warning/40 bg-warning-soft/30 p-4">
      <h3 className="flex items-center gap-2 font-display text-base font-black text-ink">
        <ShieldIcon className="h-4 w-4 text-warning-ink" />
        {rv.queueTitle}
        <span className="rounded-full bg-warning px-2 py-0.5 font-mono text-[11px] font-bold text-bg">{queue.length}</span>
        {queue.length ? (
          <span className="font-mono text-[11px] font-semibold text-ink-faint">{format(rv.readyCount, { n: ready })}</span>
        ) : null}
      </h3>

      {isLoading ? null : queue.length === 0 ? (
        <p className="mt-2 text-xs text-ink-faint">{rv.queueEmpty}</p>
      ) : (
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {queue.map((game) => (
            <li key={game.gameId}>
              <button
                type="button"
                onClick={() => onReview(game.gameId)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-surface-line bg-surface/80 px-3 py-2.5 text-left transition-colors hover:border-warning/60"
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold text-ink">
                    {format(rv.queueItem, { a: game.playerA.name, b: game.playerB.name })}
                  </span>
                  <span className="block truncate font-mono text-[10px] text-ink-faint">
                    {game.entrantA} vs {game.entrantB} · {roundLabel(game.roundName, t)}
                  </span>
                  {!game.reviewOpen && game.reviewOpensAt ? (
                    <span className="block truncate text-[10px] font-semibold text-blue-ink">
                      {format(rv.opensAt, { time: formatMatchTime(game.reviewOpensAt, locale) })}
                    </span>
                  ) : null}
                </span>
                {game.reviewOpen ? (
                  <span className="shrink-0 rounded-full bg-warning px-3 py-1 text-[11px] font-bold text-bg">{rv.review}</span>
                ) : (
                  <span className="shrink-0 rounded-full border border-blue/50 bg-blue-soft px-3 py-1 text-[11px] font-bold text-blue-ink">
                    {rv.view}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
