"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { mockClubs, mockCommunities } from "@/lib/mock";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StaffRow } from "@/components/dashboard/StaffRow";
import { RosterTable } from "@/components/dashboard/RosterTable";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { UsersIcon } from "@/components/icons";

export default function ClubPage() {
  const { t } = useLanguage();
  const { user } = useSession();
  const club = user.club ? mockClubs.find((c) => c.id === user.club!.id) : null;

  if (!club) {
    return (
      <EmptyState
        icon={UsersIcon}
        title={t.dashboard.club.noClub}
        body={t.dashboard.community.tournamentsTitle}
      />
    );
  }

  const communities = mockCommunities.filter((c) => club.communityIds.includes(c.id));
  const nearLimit = club.roster.length >= club.maxRoster - 1;

  return (
    <div>
      <PageHeader
        eyebrow={t.dashboard.shell.navMyClub}
        title={club.name}
        action={
          <StatusPill tone={nearLimit ? "warning" : "neutral"}>
            {t.dashboard.club.rosterSizeLabel}: {club.roster.length}/{club.maxRoster}
          </StatusPill>
        }
      />

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="font-display mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
            {t.dashboard.club.staffTitle}
          </h2>
          <StaffRow staff={club.staff} />
        </section>

        <section>
          <h2 className="font-display mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
            {t.dashboard.club.rosterTitle}
          </h2>
          <RosterTable roster={club.roster} />
        </section>

        <section>
          <h2 className="font-display mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
            {t.dashboard.club.communitiesTitle}
          </h2>
          <div className="flex flex-wrap gap-2">
            {communities.map((c) => (
              <span
                key={c.id}
                className="rounded-full border border-surface-line-strong bg-bg-raised px-3 py-1.5 text-xs font-medium text-ink"
              >
                {c.name}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
