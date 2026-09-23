"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import {
  hasSyncedFromBackend,
  useMockCommunities,
  useMockJoinRequests,
  useMockPeople,
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
  const people = useMockPeople();
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

  const currentUserPerson = useMemo(
    () => people.find((p) => p.id === user.id || p.id === user.personId),
    [people, user.id, user.personId]
  );

  // Authority roles: President, Vice President, Team Manager, General Secretary
  const authorityRoles = ["President", "Vice President", "Team Manager", "General Secretary"];
  const userRole = user.community?.id === communityId ? user.community?.role : null;
  const personRole = currentUserPerson?.communityId === communityId ? currentUserPerson?.communityRole : null;
  const effectiveRole = userRole || personRole;
  const isCreator =
    (community as any)?.creatorId === user.id ||
    (remoteCommunity as any)?.creatorId === user.id ||
    (community as any)?.creatorId === user.personId ||
    (community as any)?.presidentId === user.id;
  const isPresident = effectiveRole === "President" || isCreator;
  const canManage =
    Boolean(isPresident) ||
    Boolean(effectiveRole && authorityRoles.some((r) => r.toLowerCase() === effectiveRole.toLowerCase()));

  const {
    data: backendRequests,
    isLoading: isRequestsLoading,
    isFetching: isRequestsFetching,
    error: requestsError,
    refetch: refetchRequests,
  } = useQuery<any[]>({
    queryKey: ["community-requests", communityId],
    queryFn: () => getCommunityRequestsRequest(communityId),
    enabled: Boolean(communityId),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchInterval: 3000,
  });

  const combinedRequests = useMemo(() => {
    const fromBackend = (backendRequests || []).map((br: any) => ({
      id: br.id,
      targetType: (br.targetType || "player") as string,
      targetId: br.communityId,
      personId: br.requesterUserId,
      requesterUserId: br.requesterUserId,
      clubId: br.clubId,
      club: br.club,
      status: br.status,
      createdAt: br.createdAt,
      requesterUser: br.requesterUser,
    }));

    const fromMock = mockRequests.filter(
      (r) => (r.targetType === "community" || r.targetType === "club") && r.targetId === communityId
    );

    const bIds = new Set(fromBackend.map((r: any) => r.id));
    const bUserIds = new Set(fromBackend.map((r: any) => r.personId || r.requesterUserId).filter(Boolean));
    const bClubIds = new Set(fromBackend.map((r: any) => r.clubId).filter(Boolean));

    const uniqueMock = fromMock.filter((r) => {
      if (bIds.has(r.id)) return false;
      if (r.personId && bUserIds.has(r.personId)) return false;
      if ((r as any).clubId && bClubIds.has((r as any).clubId)) return false;
      return true;
    });

    const all = [...fromBackend, ...uniqueMock];
    const seenUsers = new Set<string>();
    const seenClubs = new Set<string>();
    const deduped: typeof all = [];

    for (const req of all) {
      if (reviewedIds.has(req.id)) continue;
      const uid = (req as any).personId || (req as any).requesterUserId;
      const cid = (req as any).clubId;
      if ((req as any).targetType === "club" || cid) {
        if (cid && seenClubs.has(cid)) continue;
        if (cid) seenClubs.add(cid);
      } else {
        if (uid && seenUsers.has(uid)) continue;
        if (uid) seenUsers.add(uid);
      }
      deduped.push(req);
    }

    return deduped;
  }, [backendRequests, mockRequests, communityId, reviewedIds]);

  const handleApprove = async (requestId: string) => {
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

  // Wait for initial session and community identification to avoid flashing unauthorized/empty screens
  const isInitialLoading = isSessionLoading || (isRemoteLoading && !community) || (!community && !synced);
  if (isInitialLoading || !community) {
    return <AppLoader message="Loading requests queue..." />;
  }

  const hasLoadedBackendOnce = backendRequests !== undefined;

  // If backend returned 403 Forbidden, user has no permission
  const isForbidden =
    (requestsError as any)?.status === 403 ||
    (requestsError as any)?.response?.status === 403 ||
    (!canManage && !isRequestsLoading && hasLoadedBackendOnce);

  if (isForbidden) {
    return (
      <EmptyState
        icon={LockIcon}
        title={t.dashboard.community.emptyState}
        body="You do not have permission to review requests for this community."
      />
    );
  }

  const pendingRequestsCount = combinedRequests.filter((r) => r.status === "pending").length;

  // Show skeleton loader until backend has responded at least once,
  // or while refetching if no pending requests are currently shown
  const isLoadingQueue =
    !hasLoadedBackendOnce ||
    isRequestsLoading ||
    (isRequestsFetching && pendingRequestsCount === 0);

  return (
    <div>
      <PageHeader
        eyebrow={community.name}
        title={t.dashboard.clubs.requestsQueueTitle}
        backHref={`/dashboard/efootball/community/${community.id}`}
      />
      <div className="mt-8">
        <JoinRequestQueue
          requests={combinedRequests}
          isLoading={isLoadingQueue}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
