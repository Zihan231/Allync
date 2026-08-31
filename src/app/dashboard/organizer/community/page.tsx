"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { mockCommunities } from "@/lib/mock";
import { mockTransferWindow } from "@/lib/mock/transfers";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StaffRow } from "@/components/dashboard/StaffRow";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ShieldIcon } from "@/components/icons";

export default function OrganizerCommunityPage() {
  const { t } = useLanguage();
  const { user } = useSession();
  const c = t.dashboard.organizer.community;
  const community = user.community ? mockCommunities.find((cm) => cm.id === user.community!.id) : null;

  if (!community) {
    return <EmptyState icon={ShieldIcon} title={t.dashboard.club.noClub} body="" />;
  }

  return (
    <div>
      <PageHeader eyebrow={t.dashboard.shell.modeOrganizer} title={community.name} />

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="font-display mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
            {c.applicationsTitle}
          </h2>
          <EmptyState title={c.noApplications} body="" />
        </section>

        <section>
          <h2 className="font-display mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
            {c.staffTitle}
          </h2>
          <StaffRow staff={community.staff} />
        </section>

        <section>
          <h2 className="font-display mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
            {c.windowSchedulerTitle}
          </h2>
          <div className="rounded-xl border border-surface-line bg-surface/40 p-4 font-mono text-sm text-ink-soft">
            {mockTransferWindow.opensAt} → {mockTransferWindow.closesAt}
          </div>
        </section>
      </div>
    </div>
  );
}
