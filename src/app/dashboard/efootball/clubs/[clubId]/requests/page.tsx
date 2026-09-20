"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import {
  hasSyncedFromBackend,
  useMockClubs,
  useMockJoinRequests,
  approveClubRequest,
  rejectClubRequest,
  syncFromBackend,
} from "@/lib/mock/communityStore";
import { getClubRequests, reviewClubRequest } from "@/lib/api/clubs";
import { useClub } from "@/lib/api/hooks/useClubs";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { JoinRequestQueue } from "@/components/dashboard/JoinRequestQueue";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { AppLoader } from "@/components/common/AppLoader";
import { LockIcon } from "@/components/icons";

export default function ClubRequestsPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const { t } = useLanguage();
  const { user, isLoading: isSessionLoading } = useSession();
  const { data: remoteClub, isLoading: isRemoteLoading } = useClub(clubId);
  const clubs = useMockClubs();
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
  }, [clubId]);

  const club = useMemo(
    () => remoteClub || clubs.find((c) => c.id === clubId),
    [remoteClub, clubs, clubId]
  );

  // Authority roles: President, General Secretary, Manager, Captain, Vice-Captain
  const authorityRoles = ["President", "General Secretary", "Manager", "Captain", "Vice-Captain"];
  const userRole = user.club?.id === clubId ? user.club?.role : null;
  const canManage =
    userRole && authorityRoles.some((r) => r.toLowerCase() === userRole.toLowerCase());

  const { data: backendRequests, isLoading: isRequestsLoading, refetch: refetchRequests } = useQuery({
    queryKey: ["club-requests", clubId],
    queryFn: () => getClubRequests(clubId).catch(() => []),
    enabled: !!clubId && Boolean(canManage),
    refetchInterval: 3000,
  });

  const combinedRequests = useMemo(() => {
    const fromBackend = (backendRequests || []).map((br: any) => ({
      id: br.id,
      targetType: "club" as const,
      targetId: br.clubId,
      personId: br.requesterUserId,
      requesterUserId: br.requesterUserId,
      status: br.status,
      createdAt: br.createdAt,
      requesterUser: br.requesterUser,
    }));

    const fromMock = mockRequests.filter(
      (r) => r.targetType === "club" && r.targetId === clubId
    );

    const bIds = new Set(fromBackend.map((r: any) => r.id));
    const all = [...fromBackend, ...fromMock.filter((r) => !bIds.has(r.id))];
    return all.filter((r) => !reviewedIds.has(r.id));
  }, [backendRequests, mockRequests, clubId, reviewedIds]);

  const handleApprove = async (requestId: string) => {
    // Instant optimistic UI update & instant toast (0 delay)
    setReviewedIds((prev) => new Set([...prev, requestId]));
    toast("Join request approved!", "success");
    const targetReq = combinedRequests.find((r) => r.id === requestId);
    approveClubRequest(
      requestId,
      clubId,
      targetReq?.personId || (targetReq as any)?.requesterUserId,
      (targetReq as any)?.requesterUser
    );

    try {
      await reviewClubRequest(clubId, requestId, "approved");
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
    rejectClubRequest(requestId);

    try {
      await reviewClubRequest(clubId, requestId, "rejected");
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
    (isRemoteLoading && !club) ||
    (!club && !synced) ||
    (canManage && isRequestsLoading && !backendRequests);

  if (isPageLoading) {
    return <AppLoader />;
  }

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
        <JoinRequestQueue requests={combinedRequests} onApprove={handleApprove} onReject={handleReject} />
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
