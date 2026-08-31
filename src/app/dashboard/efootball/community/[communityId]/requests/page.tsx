"use client";

import { use } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import {
  useMockCommunities,
  useMockJoinRequests,
  approveCommunityRequest,
  rejectCommunityRequest,
} from "@/lib/mock/communityStore";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { JoinRequestQueue } from "@/components/dashboard/JoinRequestQueue";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LockIcon } from "@/components/icons";

export default function CommunityRequestsPage({ params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = use(params);
  const { t } = useLanguage();
  const { user } = useSession();
  const communities = useMockCommunities();
  const requests = useMockJoinRequests().filter(
    (r) => r.targetType === "community" && r.targetId === communityId
  );

  const community = communities.find((c) => c.id === communityId);
  const canManage = user.community?.id === communityId && user.community?.role === "President";

  if (!community || !canManage) {
    return <EmptyState icon={LockIcon} title={t.dashboard.community.emptyState} body="" />;
  }

  return (
    <div>
      <PageHeader
        eyebrow={community.name}
        title={t.dashboard.clubs.requestsQueueTitle}
        backHref={`/dashboard/efootball/community/${community.id}`}
      />
      <div className="mt-8">
        <JoinRequestQueue requests={requests} onApprove={approveCommunityRequest} onReject={rejectCommunityRequest} />
      </div>
    </div>
  );
}
