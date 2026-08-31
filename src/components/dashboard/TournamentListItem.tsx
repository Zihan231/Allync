import Link from "next/link";
import type { Tournament } from "@/lib/mock/types";
import { StatusPill, type StatusTone } from "./StatusPill";
import { TrophyIcon, BracketIcon, UsersIcon, ArrowRightIcon } from "../icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const toneByStatus: Record<Tournament["status"], StatusTone> = {
  open: "info",
  live: "danger",
  completed: "neutral",
};

const iconByFormat: Record<Tournament["format"], typeof TrophyIcon> = {
  default: TrophyIcon,
  custom: BracketIcon,
  clubVsClub: UsersIcon,
  open: TrophyIcon,
};

export function TournamentListItem({
  tournament,
  href,
}: {
  tournament: Tournament;
  href: string;
}) {
  const { t } = useLanguage();
  const Icon = iconByFormat[tournament.format];

  const statusLabel = {
    open: t.dashboard.tournaments.statusOpen,
    live: t.dashboard.tournaments.statusLive,
    completed: t.dashboard.tournaments.statusCompleted,
  }[tournament.status];

  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-xl border border-surface-line bg-surface/40 p-4 transition-colors hover:border-surface-line-strong"
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-soft text-blue-ink">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-ink">{tournament.name}</div>
          <div className="mt-0.5 flex items-center gap-2 font-mono text-xs text-ink-faint">
            <span>{t.dashboard.tournaments.entrantsLabel}: {tournament.entrants}</span>
            {tournament.prizePoolBdt ? <span>· ৳ {tournament.prizePoolBdt.toLocaleString()}</span> : null}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <StatusPill tone={toneByStatus[tournament.status]}>{statusLabel}</StatusPill>
        <ArrowRightIcon className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
