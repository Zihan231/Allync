"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockMatches } from "@/lib/mock/store";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatTile } from "@/components/dashboard/StatTile";
import { MiniMatchRow } from "@/components/dashboard/MiniMatchRow";
import { ChartIcon, TrophyIcon, CalendarIcon } from "@/components/icons";

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user } = useSession();
  const matches = useMockMatches().filter((m) => m.game === "efootball");

  return (
    <div>
      <PageHeader
        eyebrow="eFootball"
        title={user.name}
        description={t.dashboard.profile.crossGameNote}
      />

      <div className="mt-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent font-display text-lg font-bold text-bg">
          {user.initials}
        </div>
        <div className="flex flex-wrap gap-2">
          {user.club ? (
            <span className="rounded-full border border-surface-line-strong bg-bg-raised px-3 py-1.5 text-xs font-medium text-ink">
              {user.club.name} · {user.club.role}
            </span>
          ) : null}
          {user.community ? (
            <span className="rounded-full border border-surface-line-strong bg-bg-raised px-3 py-1.5 text-xs font-medium text-ink">
              {user.community.name}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
          {t.dashboard.profile.statsTitle}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile label={t.dashboard.overview.statWinRate} value="68%" icon={ChartIcon} />
          <StatTile label={t.dashboard.shell.navTournaments} value="4" icon={TrophyIcon} />
          <StatTile label={t.dashboard.profile.historyTitle} value={String(matches.length)} icon={CalendarIcon} />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
          {t.dashboard.profile.historyTitle}
        </h2>
        <div className="space-y-2">
          {matches.map((m) => (
            <MiniMatchRow key={m.id} match={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
