"use client";

import { useEffect } from "react";
import { Avatar } from "@/components/common/Avatar";
import { CloseIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import type { Fixture } from "@/lib/api/tournaments";
import { EntrantBadge } from "./EntrantBadge";
import { FIXTURE_STATUS_CLASSES, GAME_STATUS_CLASSES, fixtureStatusLabel, gameStatusLabel, roundLabel } from "./labels";

/** A fixture with every 1v1 game inside it. Mount only while open. */
export function MatchDetailModal({
  match,
  isCvC,
  onClose,
}: {
  match: Fixture;
  isCvC: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const f = t.dashboard.fixtures;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
              {match.games.map((game) => (
                <li
                  key={game.id}
                  className="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-3 rounded-xl border border-surface-line bg-surface/60 px-3 py-2"
                >
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
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </div>
  );
}
