"use client";

import { use } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import {
  useMockClubs,
  useMockJoinRequests,
  approveClubRequest,
  rejectClubRequest,
} from "@/lib/mock/communityStore";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { JoinRequestQueue } from "@/components/dashboard/JoinRequestQueue";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LockIcon } from "@/components/icons";

export default function ClubRequestsPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const { t } = useLanguage();
  const { user } = useSession();
  const clubs = useMockClubs();
  const requests = useMockJoinRequests().filter((r) => r.targetType === "club" && r.targetId === clubId);

  const club = clubs.find((c) => c.id === clubId);
  const canManage = user.club?.id === clubId && (user.club?.role === "President" || user.club?.role === "Manager");

  if (!club || !canManage) {
    return <EmptyState icon={LockIcon} title={t.dashboard.clubs.emptyState} body="" />;
  }

  return (
    <div>
      <PageHeader
        eyebrow={club.name}
        title={t.dashboard.clubs.requestsQueueTitle}
        backHref={`/dashboard/efootball/clubs/${club.id}`}
      />
      <div className="mt-8">
        <JoinRequestQueue requests={requests} onApprove={approveClubRequest} onReject={rejectClubRequest} />
      </div>
    </div>
  );
}
