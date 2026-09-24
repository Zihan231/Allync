import Link from "next/link";
import type { Tournament } from "@/lib/mock/types";
import type { BackendTournament } from "@/lib/api/tournaments";
import { StatusPill, type StatusTone } from "./StatusPill";
import { TrophyIcon, BracketIcon, UsersIcon, CrosshairIcon, ArrowRightIcon } from "../icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const toneByStatus: Record<string, StatusTone> = {
  open: "info",
  registration_open: "info",
  submission_phase: "warning",
  registration_closed: "neutral",
  ongoing: "danger",
  live: "danger",
  completed: "neutral",
  cancelled: "neutral",
};

const iconByFormat: Record<string, typeof TrophyIcon> = {
  default: TrophyIcon,
  custom: BracketIcon,
  clubVsClub: UsersIcon,
  cvc: UsersIcon,
  open: TrophyIcon,
  playerVsPlayer: CrosshairIcon,
  pvp: CrosshairIcon,
};

export function TournamentListItem({
  tournament,
  href,
}: {
  tournament: Tournament | BackendTournament | any;
  href: string;
}) {
  const { t } = useLanguage();
  const rawFormat = (tournament.type || tournament.format || "pvp") as string;
  const Icon = iconByFormat[rawFormat] || TrophyIcon;

  const rawStatus = (tournament.status || "open") as string;
  const statusLabel = {
    open: t.dashboard.tournaments.statusOpen || "Open",
    registration_open: t.dashboard.tournaments.statusOpen || "Registration Open",
    submission_phase: "Submission Phase",
    registration_closed: "Registration Closed",
    ongoing: "Live Now",
    live: t.dashboard.tournaments.statusLive || "Live Now",
    completed: t.dashboard.tournaments.statusCompleted || "Completed",
    cancelled: "Cancelled",
  }[rawStatus] || (rawStatus === "registration_open" ? "Registration Open" : rawStatus);

  const entrants = tournament.participants?.length ?? tournament.entrants ?? 0;
  const prize = tournament.prizePoolBdt ?? null;

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
            <span>{t.dashboard.tournaments.entrantsLabel || "Participants"}: {entrants}</span>
            {prize ? <span>· ৳ {prize.toLocaleString()}</span> : null}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <StatusPill tone={toneByStatus[rawStatus] || "neutral"}>{statusLabel}</StatusPill>
        <ArrowRightIcon className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
