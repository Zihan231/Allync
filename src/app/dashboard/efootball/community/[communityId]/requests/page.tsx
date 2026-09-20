"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import {
  hasSyncedFromBackend,
  useMockCommunities,
  useMockJoinRequests,
  approveCommunityRequest,
  rejectCommunityRequest,
  syncFromBackend,
} from "@/lib/mock/communityStore";
import {
  getCommunityRequestsRequest,
  reviewCommunityRequestRequest,
} from "@/lib/api/communities";
import { useCommunity } from "@/lib/api/hooks/useCommunities";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { JoinRequestQueue } from "@/components/dashboard/JoinRequestQueue";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { AppLoader } from "@/components/common/AppLoader";
import { LockIcon } from "@/components/icons";

export default function CommunityRequestsPage({ params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = use(params);
  const { t } = useLanguage();
  const { user, isLoading: isSessionLoading } = useSession();
  const { data: remoteCommunity, isLoading: isRemoteLoading } = useCommunity(communityId);
  const communities = useMockCommunities();
  const mockRequests = useMockJoinRequests();
  const { toasts, toast, dismiss } = useToast();
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [synced, setSynced] = useState(() => hasSyncedFromBackend());

  useEffect(() => {
    let mounted = true;
    syncFromBackend(true).finally(() => {
      if (mounted) setSynced(true);
    });
    return () => {
      mounted = false;
    };
  }, [communityId]);

  const community = useMemo(
    () => remoteCommunity || communities.find((c) => c.id === communityId),
    [remoteCommunity, communities, communityId]
  );

  // Authority roles: President, Vice President, Team Manager, General Secretary
  const authorityRoles = ["President", "Vice President", "Team Manager", "General Secretary"];
  const userRole = user.community?.id === communityId ? user.community?.role : null;
  const canManage =
    userRole && authorityRoles.some((r) => r.toLowerCase() === userRole.toLowerCase());

  const { data: backendRequests, isLoading: isRequestsLoading, refetch: refetchRequests } = useQuery({
    queryKey: ["community-requests", communityId],
    queryFn: () => getCommunityRequestsRequest(communityId).catch(() => []),
    enabled: !!communityId && Boolean(canManage),
    refetchInterval: 3000,
  });

  const combinedRequests = useMemo(() => {
    const fromBackend = (backendRequests || []).map((br: any) => ({
      id: br.id,
      targetType: "community" as const,
      targetId: br.communityId,
      personId: br.requesterUserId,
      requesterUserId: br.requesterUserId,
      status: br.status,
      createdAt: br.createdAt,
      requesterUser: br.requesterUser,
    }));

    const fromMock = mockRequests.filter(
      (r) => r.targetType === "community" && r.targetId === communityId
    );

    const bIds = new Set(fromBackend.map((r: any) => r.id));
    const all = [...fromBackend, ...fromMock.filter((r) => !bIds.has(r.id))];
    return all.filter((r) => !reviewedIds.has(r.id));
  }, [backendRequests, mockRequests, communityId, reviewedIds]);

  const handleApprove = async (requestId: string) => {
    // Instant optimistic UI update & instant toast (0 delay)
    setReviewedIds((prev) => new Set([...prev, requestId]));
    toast("Join request approved!", "success");
    const targetReq = combinedRequests.find((r) => r.id === requestId);
    approveCommunityRequest(
      requestId,
      communityId,
      targetReq?.personId || (targetReq as any)?.requesterUserId,
      (targetReq as any)?.requesterUser
    );

    try {
      await reviewCommunityRequestRequest(communityId, requestId, "approved");
      void refetchRequests();
      void syncFromBackend(true);
    } catch (err: any) {
      setReviewedIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
      toast(err?.response?.data?.message || "Failed to approve request on server", "error");
    }
  };

  const handleReject = async (requestId: string) => {
    // Instant optimistic UI update & instant toast (0 delay)
    setReviewedIds((prev) => new Set([...prev, requestId]));
    toast("Join request rejected.", "info");
    rejectCommunityRequest(requestId);

    try {
      await reviewCommunityRequestRequest(communityId, requestId, "rejected");
      void refetchRequests();
      void syncFromBackend(true);
    } catch (err: any) {
      setReviewedIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
      toast(err?.response?.data?.message || "Failed to reject request on server", "error");
    }
  };

  const isPageLoading =
    isSessionLoading ||
    (isRemoteLoading && !community) ||
    (!community && !synced) ||
    (canManage && isRequestsLoading && !backendRequests);

  if (isPageLoading) {
    return <AppLoader />;
  }

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
        <JoinRequestQueue requests={combinedRequests} onApprove={handleApprove} onReject={handleReject} />
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
