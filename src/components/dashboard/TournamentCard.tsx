import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Tournament } from "@/lib/mock/types";
import { StatusPill, type StatusTone } from "./StatusPill";
import { TrophyIcon, BracketIcon, UsersIcon, CrosshairIcon } from "../icons";

const toneByStatus: Record<Tournament["status"], StatusTone> = {
  open: "info",
  live: "danger",
  completed: "neutral",
};

export const FORMAT_META: Record<Tournament["format"], { icon: typeof TrophyIcon; color: string }> = {
  default: { icon: TrophyIcon, color: "var(--blue)" },
  custom: { icon: BracketIcon, color: "var(--accent)" },
  clubVsClub: { icon: UsersIcon, color: "var(--accent)" },
  open: { icon: TrophyIcon, color: "var(--success)" },
  playerVsPlayer: { icon: CrosshairIcon, color: "var(--blue)" },
};

export function TournamentCard({ tournament, href }: { tournament: Tournament; href: string }) {
  const { t } = useLanguage();
  const meta = FORMAT_META[tournament.format];
  const Icon = meta.icon;

  const statusLabel = {
    open: t.dashboard.tournaments.statusOpen,
    live: t.dashboard.tournaments.statusLive,
    completed: t.dashboard.tournaments.statusCompleted,
  }[tournament.status];

  const formatLabel = {
    default: t.dashboard.tournaments.filterDefault,
    custom: t.dashboard.tournaments.filterCustom,
    clubVsClub: t.dashboard.tournaments.filterClubVsClub,
    open: t.dashboard.tournaments.filterOpen,
    playerVsPlayer: t.dashboard.tournaments.filterPlayerVsPlayer,
  }[tournament.format];

  const startLabel = new Date(tournament.startAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-surface-line bg-surface/40 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-surface-line-strong hover:shadow-[0_20px_50px_-24px_rgba(0,0,0,0.6)]"
    >
      {/* Ambient glow, tinted by format */}
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
        <StatusPill tone={toneByStatus[tournament.status]} className="shrink-0 gap-1.5">
          {tournament.status === "live" ? (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          ) : null}
          {statusLabel}
        </StatusPill>
      </div>

      <h3 className="font-display relative mt-4 line-clamp-2 text-base font-bold leading-snug text-ink">
        {tournament.name}
      </h3>
      <p className="relative mt-1 truncate text-xs text-ink-faint">{tournament.organizerName}</p>

      <span
        className="relative mt-3 inline-flex w-fit items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider"
        style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
      >
        {formatLabel}
      </span>

      <div className="relative mt-5 grid grid-cols-2 gap-3 border-t border-surface-line/70 pt-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
            {t.dashboard.tournaments.entrantsLabel}
          </div>
          <div className="mt-0.5 font-display text-sm font-bold text-ink">{tournament.entrants}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
            {tournament.prizePoolBdt ? t.dashboard.tournaments.prizePoolLabel : t.dashboard.tournaments.startsLabel}
          </div>
          <div className="mt-0.5 font-display text-sm font-bold text-accent-ink">
            {tournament.prizePoolBdt ? `৳ ${tournament.prizePoolBdt.toLocaleString()}` : startLabel}
          </div>
        </div>
      </div>
    </Link>
  );
}
