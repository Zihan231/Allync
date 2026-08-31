"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockTournaments, useMockMatches } from "@/lib/mock/store";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatTile } from "@/components/dashboard/StatTile";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { TrophyIcon, UsersIcon, GavelIcon, LockIcon } from "@/components/icons";

export default function OrganizerOverviewPage() {
  const { t } = useLanguage();
  const { user } = useSession();
  const tournaments = useMockTournaments();
  const disputes = useMockMatches().filter((m) => m.status === "disputed");

  const totalEntrants = tournaments.reduce((sum, tour) => sum + tour.entrants, 0);

  const kycTone = user.kycStatus === "verified" ? "success" : user.kycStatus === "pending" ? "warning" : "neutral";
  const kycLabel = {
    verified: t.dashboard.organizer.verification.statusVerified,
    pending: t.dashboard.organizer.verification.statusPending,
    unverified: t.dashboard.organizer.verification.statusUnverified,
  }[user.kycStatus];

  const activity = [
    t.dashboard.shell.notification1,
    t.dashboard.shell.notification2,
    t.dashboard.shell.notification3,
  ];

  return (
    <div>
      <PageHeader
        eyebrow={t.dashboard.shell.modeOrganizer}
        title={`${t.dashboard.overview.welcomeBack}, ${user.name.split(" ")[0]}`}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t.dashboard.organizer.overview.statTournaments} value={String(tournaments.length)} icon={TrophyIcon} />
        <StatTile label={t.dashboard.organizer.overview.statEntrants} value={String(totalEntrants)} icon={UsersIcon} />
        <StatTile label={t.dashboard.organizer.overview.statDisputes} value={String(disputes.length)} icon={GavelIcon} />
        <div className="rounded-xl border border-surface-line bg-surface/50 p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wide text-ink-faint">
              {t.dashboard.organizer.overview.kycChip}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-soft text-blue-ink">
              <LockIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <StatusPill tone={kycTone}>{kycLabel}</StatusPill>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-surface-line bg-surface/50 p-5">
        <h2 className="font-display text-base font-semibold text-ink">
          {t.dashboard.organizer.overview.recentActivityTitle}
        </h2>
        <ul className="mt-4 space-y-2.5">
          {activity.map((a, i) => (
            <li key={i} className="text-sm text-ink-soft">{a}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
