import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Match } from "@/lib/mock/types";
import { colorFromString, initialsFromName } from "@/lib/colorHash";
import { StatusPill, type StatusTone } from "./StatusPill";
import { CalendarIcon, BellIcon, SwapIcon, ShieldIcon, GavelIcon } from "../icons";

export const MATCH_STATUS_META: Record<Match["status"], { tone: StatusTone; color: string; icon: typeof CalendarIcon }> = {
  unplayed: { tone: "neutral", color: "var(--ink-faint)", icon: CalendarIcon },
  pending_submission: { tone: "warning", color: "var(--warning)", icon: BellIcon },
  awaiting_opponent: { tone: "info", color: "var(--blue)", icon: SwapIcon },
  verified: { tone: "success", color: "var(--success)", icon: ShieldIcon },
  disputed: { tone: "danger", color: "var(--danger)", icon: GavelIcon },
};

export function fmtMatchDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function isDeadlinePassed(match: Match) {
  return (
    (match.status === "unplayed" || match.status === "pending_submission") &&
    !!match.submissionDeadline &&
    new Date(match.submissionDeadline).getTime() < Date.now()
  );
}

export function MatchCard({ match, href }: { match: Match; href: string }) {
  const { t } = useLanguage();
  const meta = MATCH_STATUS_META[match.status];
  const Icon = meta.icon;
  const opponentColor = colorFromString(match.opponent);
  const opponentInitials = initialsFromName(match.opponent);
  const overdue = isDeadlinePassed(match);

  const statusLabel: Record<Match["status"], string> = {
    unplayed: t.dashboard.matches.statusUnplayed,
    pending_submission: t.dashboard.matches.filterPending,
    awaiting_opponent: t.dashboard.matches.filterAwaiting,
    verified: t.dashboard.matches.filterVerified,
    disputed: t.dashboard.matches.filterDisputed,
  };

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-surface-line bg-surface/40 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-surface-line-strong hover:shadow-[0_20px_50px_-24px_rgba(0,0,0,0.6)]"
    >
      <div
        className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-25"
        style={{ backgroundColor: meta.color }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-70"
        style={{ background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)` }}
      />

      <div className="relative flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: `${opponentColor}26`, color: opponentColor }}
        >
          {opponentInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-base font-bold text-ink">vs {match.opponent}</div>
          <p className="mt-0.5 truncate text-xs text-ink-faint">
            {match.tournamentName} · {match.round}
          </p>
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-2">
        <StatusPill tone={meta.tone} className="gap-1.5">
          <Icon className="h-3 w-3" />
          {statusLabel[match.status]}
        </StatusPill>
        {typeof match.myScore === "number" ? (
          <span className="font-display text-lg font-bold text-ink">
            {match.myScore}–{typeof match.opponentScore === "number" ? match.opponentScore : "?"}
          </span>
        ) : null}
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-3 border-t border-surface-line/70 pt-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
            {t.dashboard.matches.scheduledLabel}
          </div>
          <div className="mt-0.5 text-xs font-semibold text-ink">{fmtMatchDateTime(match.scheduledAt)}</div>
        </div>
        {match.submissionDeadline ? (
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
              {t.dashboard.matches.deadlineLabel}
            </div>
            <div className={`mt-0.5 text-xs font-semibold ${overdue ? "text-danger-ink" : "text-ink"}`}>
              {overdue ? t.dashboard.matches.deadlinePassedLabel : fmtMatchDateTime(match.submissionDeadline)}
            </div>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
