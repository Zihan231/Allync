"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockMatches } from "@/lib/mock/store";
import { useMockPeople } from "@/lib/mock/communityStore";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatTile } from "@/components/dashboard/StatTile";
import { MiniMatchRow } from "@/components/dashboard/MiniMatchRow";
import { SectionHeading } from "@/components/dashboard/SectionHeading";
import { ProfileEditForm } from "@/components/dashboard/ProfileEditForm";
import { CoverPhoto } from "@/components/common/CoverPhoto";
import { Avatar } from "@/components/common/Avatar";
import { ChartIcon, TrophyIcon, CalendarIcon } from "@/components/icons";

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user } = useSession();
  const people = useMockPeople();
  const person = people.find((p) => p.id === user.personId);
  const matches = useMockMatches().filter((m) => m.game === "efootball");

  return (
    <div>
      <PageHeader eyebrow="eFootball" title={t.dashboard.shell.navProfile} description={t.dashboard.profile.crossGameNote} />

      <div className="relative mt-6">
        <CoverPhoto coverUrl={person?.coverUrl} name={user.name} className="h-40 rounded-xl sm:h-56" />
      </div>

      <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="-mt-12 flex items-end gap-4 sm:-mt-14">
          <div className="rounded-full border-4 border-bg bg-surface">
            <Avatar dpUrl={person?.dpUrl ?? user.dpUrl} name={user.name} size="xl" mode="lightbox" shape="circle" />
          </div>
          <div className="pb-1">
            <h1 className="font-display text-2xl font-bold text-ink">{user.name}</h1>
            <div className="mt-1.5 flex flex-wrap gap-2">
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
        </div>
      </div>

      <div className="mt-8">
        <SectionHeading tone="accent">{t.dashboard.profile.statsTitle}</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile label={t.dashboard.overview.statWinRate} value="68%" icon={ChartIcon} />
          <StatTile label={t.dashboard.shell.navTournaments} value="4" icon={TrophyIcon} />
          <StatTile label={t.dashboard.profile.historyTitle} value={String(matches.length)} icon={CalendarIcon} />
        </div>
      </div>

      <div className="mt-8">
        <SectionHeading tone="blue">{t.dashboard.profile.historyTitle}</SectionHeading>
        <div className="space-y-2">
          {matches.map((m) => (
            <MiniMatchRow key={m.id} match={m} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <ProfileEditForm />
      </div>
    </div>
  );
}
