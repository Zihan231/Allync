"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import {
  useMockCommunities,
  useMockPeople,
  useMockJoinRequests,
  approveCommunityRequest,
  rejectCommunityRequest,
} from "@/lib/mock/communityStore";
import { mockTransferWindow } from "@/lib/mock/transfers";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StaffRow } from "@/components/dashboard/StaffRow";
import { JoinRequestQueue } from "@/components/dashboard/JoinRequestQueue";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SectionHeading } from "@/components/dashboard/SectionHeading";
import { ShieldIcon } from "@/components/icons";

export default function OrganizerCommunityPage() {
  const { t } = useLanguage();
  const { user } = useSession();
  const c = t.dashboard.organizer.community;
  const communities = useMockCommunities();
  const people = useMockPeople();
  const requests = useMockJoinRequests().filter(
    (r) => r.targetType === "community" && r.targetId === user.community?.id
  );

  const community = user.community ? communities.find((cm) => cm.id === user.community!.id) : null;

  if (!community) {
    return <EmptyState icon={ShieldIcon} title={t.dashboard.club.noClub} body="" />;
  }

  const officials = people.filter((p) => p.communityId === community.id && p.communityRole !== "Member");

  return (
    <div>
      <PageHeader eyebrow={t.dashboard.shell.modeOrganizer} title={community.name} />

      <div className="mt-8 space-y-8">
        <section>
          <SectionHeading tone="danger">{c.applicationsTitle}</SectionHeading>
          <JoinRequestQueue requests={requests} onApprove={approveCommunityRequest} onReject={rejectCommunityRequest} />
        </section>

        <section>
          <SectionHeading tone="blue">{c.staffTitle}</SectionHeading>
          <StaffRow people={officials} />
        </section>

        <section>
          <SectionHeading tone="warning">{c.windowSchedulerTitle}</SectionHeading>
          <div className="rounded-xl border border-surface-line bg-surface/40 p-4 font-mono text-sm text-ink-soft">
            {mockTransferWindow.opensAt} → {mockTransferWindow.closesAt}
          </div>
        </section>
      </div>
    </div>
  );
}
