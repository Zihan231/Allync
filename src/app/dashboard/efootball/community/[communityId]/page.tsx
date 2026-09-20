"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import {
  hasSyncedFromBackend,
  syncFromBackend,
  useMockCommunities,
  useMockPeople,
  useMockClubs,
  useMockJoinRequests,
} from "@/lib/mock/communityStore";
import { useMockTournaments } from "@/lib/mock/store";
import { getCommunityFreeAgents, getCommunityTransferLog } from "@/lib/mock/communityInsights";
import { BackButton } from "@/components/dashboard/BackButton";
import { CoverPhoto } from "@/components/common/CoverPhoto";
import { ClubCrest } from "@/components/common/ClubCrest";
import { CommunityTierPill } from "@/components/dashboard/CommunityTierPill";
import { CommunityMetaGrid } from "@/components/dashboard/CommunityMetaGrid";
import { CommunityOverviewTab } from "@/components/dashboard/CommunityOverviewTab";
import { CommunityMembersTab } from "@/components/dashboard/CommunityMembersTab";
import { CommunityClubsTab } from "@/components/dashboard/CommunityClubsTab";
import { CommunityRankingsTab } from "@/components/dashboard/CommunityRankingsTab";
import { CommunityTournamentsTab } from "@/components/dashboard/CommunityTournamentsTab";
import { CommunityFreeAgentsTab } from "@/components/dashboard/CommunityFreeAgentsTab";
import { CommunityTransfersTab } from "@/components/dashboard/CommunityTransfersTab";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TransferAuthorityModal } from "@/components/dashboard/TransferAuthorityModal";
import { AppLoader } from "@/components/common/AppLoader";
import { ShieldIcon, UsersIcon, FacebookIcon, SwapIcon, TrashIcon } from "@/components/icons";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ToastContainer } from "@/components/common/Toast";
import { useToast } from "@/lib/useToast";
import { useConfirm } from "@/lib/useConfirm";
import { useCommunity, useJoinCommunity, useLeaveCommunity, useDeleteCommunity } from "@/lib/api/hooks/useCommunities";

type Tab = "overview" | "members" | "clubs" | "rankings" | "tournaments" | "freeAgents" | "transfers";

export default function CommunityDetailPage({ params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = use(params);
  const { t } = useLanguage();
  const { user, setCommunity, refreshSession } = useSession();
  const router = useRouter();
  const deleteMutation = useDeleteCommunity();
  const [synced, setSynced] = useState(() => hasSyncedFromBackend());

  useEffect(() => {
    let mounted = true;
    syncFromBackend().finally(() => {
      if (mounted) setSynced(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const { data: remoteCommunity, isLoading: isRemoteLoading } = useCommunity(communityId);
  const communities = useMockCommunities();
  const people = useMockPeople();
  const clubs = useMockClubs();
  const tournaments = useMockTournaments();
  const joinRequests = useMockJoinRequests();
  const [tab, setTab] = useState<Tab>("overview");
  const [showTransferAuthorityModal, setShowTransferAuthorityModal] = useState(false);

  const community = useMemo(() => {
    return remoteCommunity || communities.find((c) => c.id === communityId);
  }, [remoteCommunity, communities, communityId]);
  const { confirm, confirmProps } = useConfirm();
  const joinMutation = useJoinCommunity(communityId);
  const leaveMutation = useLeaveCommunity(communityId);
  const { toasts, toast, dismiss } = useToast();

  const memberClubs = useMemo(
    () => clubs.filter((c) => community?.memberClubIds.includes(c.id)),
    [clubs, community]
  );
  const peopleByClub = useMemo(() => {
    const map = new Map<string, typeof people>();
    memberClubs.forEach((club) => map.set(club.id, people.filter((p) => p.clubId === club.id)));
    return map;
  }, [memberClubs, people]);
  const clubMembers = useMemo(() => memberClubs.flatMap((c) => peopleByClub.get(c.id) ?? []), [memberClubs, peopleByClub]);
  const allMembers = useMemo(
    () => people.filter((p) => p.communityId === community?.id),
    [people, community]
  );
  const freeAgents = useMemo(
    () => (community ? getCommunityFreeAgents(community, people) : []),
    [community, people]
  );
  const transferEntries = useMemo(() => getCommunityTransferLog(memberClubs, people), [memberClubs, people]);
  const realIds = useMemo(() => new Set(people.map((p) => p.id)), [people]);
  const communityTournaments = useMemo(
    () => tournaments.filter((tour) => tour.communityId === community?.id),
    [tournaments, community]
  );

  const isLoading = (isRemoteLoading && !community) || (!community && !synced);

  if (isLoading) {
    return <AppLoader />;
  }

  if (!community) {
    return <EmptyState icon={ShieldIcon} title={t.dashboard.community.emptyState} body="" />;
  }

  const isMine = user.community?.id === community.id;
  const canHandoverAuthority = isMine && (
    user.community?.role === "President" ||
    user.community?.role === "General Secretary" ||
    user.community?.role === "Vice President"
  );
  const isPresident = isMine && user.community?.role === "President";
  const canManage = isPresident;
  const hasOtherCommunity = !!user.community && !isMine;
  const hasPendingRequest = joinRequests.some(
    (r) =>
      r.targetType === "community" &&
      r.targetId === community.id &&
      r.personId === user.personId &&
      r.status === "pending"
  );


  const handleJoin = async () => {
    if (community.joinPolicy === "approval") {
      toast("Join request sent! Awaiting approval.", "info");
      return;
    }
    try {
      await joinMutation.mutateAsync();
      setCommunity({ id: community.id, name: community.name, role: "Member" });
      toast(`You joined ${community.name}!`, "success");
      void refreshSession();
    } catch (err: any) {
      toast(err?.response?.data?.message || "Failed to join community.", "error");
    }
  };

  
  const handleDeleteCommunity = async () => {
    if (!isPresident) return;
    if (!await confirm(`Delete ${community.name}? This cannot be undone. All community data will be permanently removed.`, {
      title: "Delete Community",
      variant: "danger",
      confirmLabel: "Delete Forever",
    })) return;

    try {
      await deleteMutation.mutateAsync(community.id);
      setCommunity(null);
      router.push("/dashboard/efootball/community");
    } catch (err: any) {
      toast(err?.response?.data?.message || err?.message || "Failed to delete community.", "error");
    }
  };

  const handleLeave = async () => {
    if (!await confirm(t.dashboard.community.leaveConfirm, { title: "Leave Community", variant: "danger", confirmLabel: "Leave" })) return;
    try {
      await leaveMutation.mutateAsync();
      setCommunity(null);
      toast(`You left ${community.name}.`, "info");
      void refreshSession();
    } catch (err: any) {
      toast(err?.response?.data?.message || "Failed to leave community.", "error");
    }
  };
  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: t.dashboard.community.tabOverview },
    { key: "members", label: t.dashboard.community.tabMembers },
    { key: "clubs", label: t.dashboard.community.tabClubs },
    { key: "rankings", label: t.dashboard.community.tabRankings },
    { key: "tournaments", label: t.dashboard.community.tabTournaments },
    { key: "freeAgents", label: t.dashboard.community.tabFreeAgents },
    { key: "transfers", label: t.dashboard.community.tabTransfers },
  ];

  return (
    <div>
      <BackButton href="/dashboard/efootball/community" />
      <div className="relative">
        <CoverPhoto
          coverUrl={community.coverUrl}
          name={community.name}
          color={community.color}
          className="h-56 rounded-xl sm:h-72 lg:h-80"
        />
        <div
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm"
          style={{ boxShadow: `0 0 0 1px ${community.color}66` }}
        >
          <UsersIcon className="h-4 w-4" style={{ color: community.color }} />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
            {t.dashboard.community.entityLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="-mt-14 flex items-end gap-4 sm:-mt-16">
          <div className="rounded-xl border-4 border-bg bg-surface">
            <ClubCrest
              name={community.name}
              color={community.color}
              initials={community.initials}
              imageUrl={community.dpUrl}
              size="xl"
              shape="square"
            />
          </div>
          <div className="pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-ink">{community.name}</h1>
              <CommunityTierPill tier={community.tier} />
            </div>
            <p className="font-mono text-xs text-ink-faint">
              {community.points.toLocaleString()} pts
              {community.location ? ` · ${community.location}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pb-1">
          {community.facebookUrl ? (
            <a
              href={community.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-surface-line-strong px-4 py-2 text-sm font-medium text-ink"
            >
              <FacebookIcon className="h-4 w-4" />
              {t.dashboard.community.contactFacebook}
            </a>
          ) : null}

          {canManage ? (
            <>
              <Link
                href={`/dashboard/efootball/community/${community.id}/edit`}
                className="rounded-full border border-surface-line-strong px-4 py-2 text-sm font-medium text-ink"
              >
                {t.dashboard.community.editButton}
              </Link>
              {community.joinPolicy === "approval" ? (
                <Link
                  href={`/dashboard/efootball/community/${community.id}/requests`}
                  className="rounded-full border border-surface-line-strong px-4 py-2 text-sm font-medium text-ink"
                >
                  {t.dashboard.clubs.requestsQueueTitle}
                </Link>
              ) : null}
            </>
          ) : null}

          
          {isPresident ? (
            <button
              type="button"
              onClick={handleDeleteCommunity}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-danger/40 bg-danger-soft px-5 py-2 text-sm font-semibold text-danger-ink transition-colors hover:bg-danger-soft/80 shadow-sm disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
              {deleteMutation.isPending ? "Deleting..." : "Delete Community"}
            </button>
          ) : null}
          {isMine ? (
            canHandoverAuthority ? (
              <button
                type="button"
                onClick={() => setShowTransferAuthorityModal(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-5 py-2 text-sm font-semibold text-warning-ink transition-colors hover:bg-warning/20 shadow-sm"
              >
                <SwapIcon className="h-4 w-4" />
                Transfer Authority
              </button>
            ) : (
              <button
                onClick={handleLeave}
                disabled={leaveMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-danger-soft px-5 py-2 text-sm font-semibold text-danger-ink transition-all hover:bg-danger-soft/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {leaveMutation.isPending ? (
                  <>
                    <svg className="h-4 w-4 animate-spin text-danger-ink" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span>Leaving...</span>
                  </>
                ) : (
                  t.dashboard.community.leaveButton
                )}
              </button>
            )
          ) : (
            <button
              onClick={handleJoin}
              disabled={hasOtherCommunity || hasPendingRequest || joinMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2 font-display text-sm font-semibold text-bg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {joinMutation.isPending ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-bg" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>Joining...</span>
                </>
              ) : (
                community.joinPolicy === "instant"
                  ? t.dashboard.community.joinButton
                  : t.dashboard.community.requestToJoinButton
              )}
            </button>
          )}
        </div>
      </div>

      {hasPendingRequest ? (
        <p className="mt-3 font-mono text-xs text-warning-ink">{t.dashboard.clubs.pendingRequestNotice}</p>
      ) : null}

      {community.motto ? (
        <div
          className="mt-4 flex max-w-2xl items-start gap-3 rounded-xl border-l-4 bg-surface/40 px-4 py-3"
          style={{ borderLeftColor: community.color, boxShadow: `0 0 0 1px ${community.color}26` }}
        >
          <span className="font-display text-3xl font-black leading-[0.6]" style={{ color: community.color }}>
            &ldquo;
          </span>
          <p className="pt-1 font-display text-base font-semibold italic leading-snug tracking-tight text-ink">
            {community.motto}
          </p>
        </div>
      ) : null}

      <div className="mt-6">
        <CommunityMetaGrid community={community} memberClubs={memberClubs} allPeople={people} allCommunities={communities} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            type="button"
            onClick={() => setTab(tb.key)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              tab === tb.key ? "border-accent bg-accent-soft text-accent-ink" : "border-surface-line-strong text-ink-soft hover:text-ink"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" ? (
          <CommunityOverviewTab community={community} memberClubs={memberClubs} peopleByClub={peopleByClub} clubMembers={clubMembers} />
        ) : null}
        {tab === "members" ? <CommunityMembersTab members={allMembers} memberClubs={memberClubs} /> : null}
        {tab === "clubs" ? <CommunityClubsTab community={community} memberClubs={memberClubs} allPeople={people} /> : null}
        {tab === "rankings" ? <CommunityRankingsTab memberClubs={memberClubs} /> : null}
        {tab === "tournaments" ? <CommunityTournamentsTab tournaments={communityTournaments} /> : null}
        {tab === "freeAgents" ? <CommunityFreeAgentsTab freeAgents={freeAgents} /> : null}
        {tab === "transfers" ? <CommunityTransfersTab entries={transferEntries} realIds={realIds} /> : null}
      </div>
      <TransferAuthorityModal
        open={showTransferAuthorityModal}
        onClose={() => setShowTransferAuthorityModal(false)}
        entityType="community"
        entityId={community?.id ?? ""}
        entityName={community?.name ?? ""}
        members={allMembers}
        onSuccess={() => toast("Authority transferred successfully. You are now a regular member.", "success")}
      />

      <ConfirmDialog {...confirmProps} />
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

    </div>
  );
}
