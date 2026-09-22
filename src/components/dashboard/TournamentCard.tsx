import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Tournament } from "@/lib/mock/types";
import type { BackendTournament } from "@/lib/api/tournaments";
import { StatusPill, type StatusTone } from "./StatusPill";
import { TrophyIcon, BracketIcon, UsersIcon, CrosshairIcon, ClockIcon } from "../icons";

const toneByStatus: Record<string, StatusTone> = {
  open: "info",
  registration_closed: "neutral",
  ongoing: "danger",
  live: "danger",
  completed: "neutral",
  cancelled: "neutral",
};

export const FORMAT_META: Record<string, { icon: typeof TrophyIcon; color: string; label: string }> = {
  default: { icon: TrophyIcon, color: "var(--blue)", label: "Tournament" },
  custom: { icon: BracketIcon, color: "var(--accent)", label: "Custom" },
  clubVsClub: { icon: UsersIcon, color: "var(--accent)", label: "Club vs Club" },
  cvc: { icon: UsersIcon, color: "var(--accent)", label: "Club vs Club" },
  open: { icon: TrophyIcon, color: "var(--success)", label: "Open" },
  playerVsPlayer: { icon: CrosshairIcon, color: "var(--blue)", label: "Player vs Player" },
  pvp: { icon: CrosshairIcon, color: "var(--blue)", label: "Player vs Player" },
};

export function TournamentCard({
  tournament,
  href,
}: {
  tournament: Tournament | BackendTournament | any;
  href: string;
}) {
  const { t } = useLanguage();
  
  // Normalize format
  const rawFormat = (tournament.type || tournament.format || "pvp") as string;
  const meta = FORMAT_META[rawFormat] || FORMAT_META.pvp;
  const Icon = meta.icon;

  // Status
  const rawStatus = tournament.status || "open";
  const isLive = rawStatus === "live" || rawStatus === "ongoing";
  const statusLabel = {
    open: t.dashboard.tournaments.statusOpen || "Open",
    registration_closed: "Registration Closed",
    ongoing: "Live Now",
    live: t.dashboard.tournaments.statusLive || "Live Now",
    completed: t.dashboard.tournaments.statusCompleted || "Completed",
    cancelled: "Cancelled",
  }[rawStatus as string] || rawStatus;

  // Roster format text
  let formatBadgeText = meta.label;
  if (rawFormat === "cvc" || rawFormat === "clubVsClub") {
    if (tournament.preset === "preset_11v11" || tournament.startersCount === 11) {
      formatBadgeText = "CvC · 11 v 11";
    } else if (tournament.preset === "preset_8v8" || tournament.startersCount === 8) {
      formatBadgeText = "CvC · 8 v 8";
    } else if (tournament.preset === "custom" || (tournament.startersCount && tournament.startersCount > 0)) {
      formatBadgeText = `CvC · ${tournament.startersCount}v${tournament.startersCount}`;
    }
  } else if (rawFormat === "pvp" || rawFormat === "playerVsPlayer") {
    formatBadgeText = "PvP · 1 v 1";
  }

  // Organizer / Community
  const organizerName =
    tournament.community?.name || tournament.organizerName || "eFootball Community";

  // Counts
  const entrantsCount =
    tournament.participants?.length ?? tournament.entrants ?? 0;
  const maxParticipants = tournament.maxParticipants;

  // Start date
  const startAt = tournament.startAt ? new Date(tournament.startAt) : new Date();
  const startLabel = startAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const startTime = startAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  // Entry fee & prize badges
  const isPaid = Boolean(tournament.isPaid || (tournament.entryFeeBdt && tournament.entryFeeBdt > 0));
  const entryFeeBdt = tournament.entryFeeBdt ?? 0;
  const prizePoolBdt = tournament.prizePoolBdt ?? 0;

  // 2h Lineup Cutoff
  const submissionDeadline = tournament.teamSubmissionDeadline
    ? new Date(tournament.teamSubmissionDeadline)
    : new Date(startAt.getTime() - 2 * 60 * 60 * 1000);
  const isSubmissionOpen = new Date() < submissionDeadline;

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-surface-line bg-surface/40 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-surface-line-strong hover:shadow-[0_20px_50px_-24px_rgba(0,0,0,0.6)]"
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-25"
        style={{ backgroundColor: meta.color }}
      />
      {/* Top accent line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-70"
        style={{ background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)` }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-1.5">
          <StatusPill tone={toneByStatus[rawStatus] || "neutral"} className="shrink-0 gap-1.5">
            {isLive ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" /> : null}
            {statusLabel}
          </StatusPill>
        </div>
      </div>

      <h3 className="font-display relative mt-4 line-clamp-2 text-base font-bold leading-snug text-ink group-hover:text-accent-ink transition-colors">
        {tournament.name}
      </h3>
      <p className="relative mt-1 truncate text-xs text-ink-faint flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
        {organizerName}
      </p>

      {/* Badges Bar: Format, Entry Fee, Prize */}
      <div className="relative mt-3.5 flex flex-wrap items-center gap-1.5">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
        >
          {formatBadgeText}
        </span>

        {isPaid ? (
          <span className="inline-flex items-center rounded-full bg-warning/15 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-warning-ink">
            ৳{entryFeeBdt.toLocaleString()} Entry
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
            Free Entry
          </span>
        )}

        {prizePoolBdt > 0 ? (
          <span className="inline-flex items-center rounded-full bg-accent/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-accent-ink">
            ৳{prizePoolBdt.toLocaleString()} Prize
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-surface-line px-2.5 py-0.5 font-mono text-[10px] text-ink-faint">
            Friendly / No Prize
          </span>
        )}
      </div>

      {/* 2h Lineup Cutoff alert (if upcoming) */}
      {(rawFormat === "cvc" || rawFormat === "clubVsClub") && rawStatus === "open" && (
        <div className="relative mt-3 flex items-center gap-1.5 rounded-lg border border-surface-line/80 bg-surface/30 px-2.5 py-1.5 text-[11px] text-ink-soft">
          <ClockIcon className="h-3.5 w-3.5 text-accent shrink-0" />
          <span className="truncate">
            {isSubmissionOpen ? (
              <>
                Lineups lock at:{" "}
                <span className="font-semibold text-ink">
                  {submissionDeadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </>
            ) : (
              <span className="text-warning-ink font-semibold">Lineups Locked (2h before start)</span>
            )}
          </span>
        </div>
      )}

      {/* Card Footer: Entrants & Schedule */}
      <div className="relative mt-auto pt-4 border-t border-surface-line/70 grid grid-cols-2 gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
            {t.dashboard.tournaments.entrantsLabel || "Participants"}
          </div>
          <div className="mt-0.5 font-display text-sm font-bold text-ink">
            {entrantsCount}
            {maxParticipants ? (
              <span className="text-xs font-normal text-ink-faint"> / {maxParticipants}</span>
            ) : null}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
            Starts
          </div>
          <div className="mt-0.5 font-display text-sm font-bold text-ink">
            {startLabel} <span className="text-xs font-normal text-ink-faint">{startTime}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
