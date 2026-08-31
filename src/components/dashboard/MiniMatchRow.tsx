import Link from "next/link";
import type { Match } from "@/lib/mock/types";
import { StatusPill, type StatusTone } from "./StatusPill";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const toneByStatus: Record<Match["status"], StatusTone> = {
  unplayed: "neutral",
  pending_submission: "warning",
  awaiting_opponent: "info",
  verified: "success",
  disputed: "danger",
};

export function MiniMatchRow({ match }: { match: Match }) {
  const { t } = useLanguage();

  const labelByStatus: Record<Match["status"], string> = {
    unplayed: t.dashboard.matches.filterAll,
    pending_submission: t.dashboard.matches.filterPending,
    awaiting_opponent: t.dashboard.matches.filterAwaiting,
    verified: t.dashboard.matches.filterVerified,
    disputed: t.dashboard.matches.filterDisputed,
  };

  return (
    <Link
      href={`/dashboard/efootball/matches/${match.id}`}
      className="flex items-center justify-between rounded-lg border border-surface-line bg-bg-raised px-3.5 py-2.5 transition-colors hover:border-surface-line-strong"
    >
      <div>
        <div className="text-sm font-medium text-ink">vs {match.opponent}</div>
        <div className="text-xs text-ink-faint">{match.round}</div>
      </div>
      <StatusPill tone={toneByStatus[match.status]}>{labelByStatus[match.status]}</StatusPill>
    </Link>
  );
}
