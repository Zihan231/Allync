"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import type { MyGame } from "@/lib/api/tournaments";
import { Avatar } from "@/components/common/Avatar";
import { StatusPill, type StatusTone } from "./StatusPill";
import { formatGameRange, formatMatchTime, roundLabel } from "./fixtures/labels";
import { ArrowRightIcon, ShieldIcon, UsersIcon } from "@/components/icons";

const stateTone: Record<MyGame["state"], StatusTone> = {
  to_play: "warning",
  waiting: "info",
  review: "accent",
  finished: "neutral",
};

const outcomeTone = { won: "success", lost: "danger", draw: "neutral" } as const satisfies Record<string, StatusTone>;

/** One of the player's games on the Matches page; opens the match in its tournament bracket. */
export function MyGameCard({ game }: { game: MyGame }) {
  const { t, locale } = useLanguage();
  const mm = t.dashboard.myMatches;
  // Render-stable "now" for deciding whether the game's window has opened.
  const [now] = useState(() => Date.now());

  const stateLabel: Record<MyGame["state"], string> = {
    to_play: mm.stateToPlay,
    waiting: mm.stateWaiting,
    review: mm.stateReview,
    finished: mm.stateFinished,
  };

  // Finished games show how they ended; open ones show where they stand.
  const pill = (() => {
    if (game.state !== "finished") return { tone: stateTone[game.state], label: stateLabel[game.state] };
    if (game.status === "forfeited") return { tone: "danger" as const, label: mm.forfeited };
    if (game.status === "walkover")
      return game.outcome === "won"
        ? { tone: "success" as const, label: mm.walkoverWon }
        : { tone: "danger" as const, label: mm.walkoverLost };
    return game.outcome ? { tone: outcomeTone[game.outcome], label: mm[game.outcome] } : null;
  })();

  const range = game.scheduledStart ? formatGameRange(game, t, locale) : null;
  const deadline = game.evidenceDeadline ? formatMatchTime(game.evidenceDeadline, locale) : null;
  const note =
    game.state === "to_play" && game.status === "rejected" && deadline
      ? format(mm.rejectedNote, { time: deadline })
      : game.state === "to_play" && deadline && game.scheduledStart && now >= Date.parse(game.scheduledStart)
        ? format(mm.uploadBy, { time: deadline })
        : game.state === "waiting"
          ? format(mm.waitingNote, { name: game.opponent.name })
          : game.state === "review"
            ? mm.reviewNote
            : null;

  const HostIcon = game.host.kind === "club" ? ShieldIcon : UsersIcon;
  const round = [
    roundLabel(game.roundName, t),
    game.groupLabel ? format(mm.group, { label: game.groupLabel }) : null,
    game.isDecider ? mm.decider : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={game.tournament.link}
      className="group flex flex-col rounded-2xl border border-surface-line bg-surface/50 p-4 transition-colors hover:border-surface-line-strong hover:bg-surface/70"
    >
      {/* Host and tournament */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">
            <HostIcon className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {game.host.kind === "club" ? mm.hostClub : mm.hostCommunity} · {game.host.name}
            </span>
          </div>
          <div className="mt-0.5 truncate font-display text-sm font-bold text-ink">{game.tournament.name}</div>
        </div>
        {pill ? <StatusPill tone={pill.tone}>{pill.label}</StatusPill> : null}
      </div>

      {/* You vs opponent */}
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Side name={mm.you} sub={game.myClubName} dpUrl={game.me.dpUrl} avatarName={game.me.name} />
        <div className="text-center">
          {game.myGoals != null && game.opponentGoals != null ? (
            <span
              className={`font-display text-xl font-black tabular-nums ${
                game.outcome === "won" ? "text-success-ink" : game.outcome === "lost" ? "text-danger-ink" : "text-ink"
              }`}
            >
              {game.myGoals} – {game.opponentGoals}
            </span>
          ) : (
            <span className="font-mono text-xs font-bold uppercase text-ink-faint">vs</span>
          )}
        </div>
        <Side name={game.opponent.name} sub={game.opponentClubName} dpUrl={game.opponent.dpUrl} align="end" />
      </div>

      {/* Round, time and what's next */}
      <div className="mt-4 space-y-1 border-t border-surface-line/70 pt-3 text-xs">
        <div className="flex items-center justify-between gap-2 text-ink-soft">
          <span className="truncate font-semibold">{round}</span>
          <span className="shrink-0 tabular-nums">{range ?? mm.notScheduled}</span>
        </div>
        {note ? (
          <p className={game.state === "to_play" ? "font-semibold text-warning-ink" : "text-ink-faint"}>{note}</p>
        ) : null}
        {game.state === "to_play" && game.status === "rejected" && game.reviewNote ? (
          <p className="truncate text-ink-faint">“{game.reviewNote}”</p>
        ) : null}
      </div>

      <span className="mt-3 inline-flex items-center gap-1 self-end text-xs font-semibold text-accent-ink">
        {mm.openMatch}
        <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function Side({
  name,
  sub,
  dpUrl,
  avatarName = name,
  align = "start",
}: {
  name: string;
  sub: string | null;
  dpUrl: string | null;
  avatarName?: string;
  align?: "start" | "end";
}) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${align === "end" ? "flex-row-reverse text-right" : ""}`}>
      <Avatar dpUrl={dpUrl} name={avatarName} size="sm" mode="static" />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-ink">{name}</div>
        {sub ? <div className="truncate text-[11px] text-ink-faint">{sub}</div> : null}
      </div>
    </div>
  );
}
