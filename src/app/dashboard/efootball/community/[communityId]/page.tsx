"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { getMyCommunityRequest } from "@/lib/api/communities";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  hasSyncedFromBackend,
  syncFromBackend,
  useMockCommunities,
  useMockPeople,
  useMockClubs,
  useMockJoinRequests,
  addPendingJoinRequest,
  leaveCommunity,
  removePendingJoinRequest,
} from "@/lib/mock/communityStore";
import { useMockTournaments } from "@/lib/mock/store";
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
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TransferAuthorityModal } from "@/components/dashboard/TransferAuthorityModal";
import { AppLoader } from "@/components/common/AppLoader";
import { ShieldIcon, UsersIcon, FacebookIcon, SwapIcon, ClockIcon, PlusIcon, TrophyIcon } from "@/components/icons";
import { TournamentCard } from "@/components/dashboard/TournamentCard";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ToastContainer } from "@/components/common/Toast";
import { useToast } from "@/lib/useToast";
import { useConfirm } from "@/lib/useConfirm";
import { useCommunity, useJoinCommunity, useLeaveCommunity } from "@/lib/api/hooks/useCommunities";

type Tab = "overview" | "members" | "clubs" | "rankings" | "tournaments";

export default function CommunityDetailPage({ params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = use(params);
  const { t } = useLanguage();
  const { user, setCommunity, refreshSession } = useSession();
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
  const [isPendingLocal, setIsPendingLocal] = useState(false);
  const [justLeft, setJustLeft] = useState(false);
  const queryClient = useQueryClient();

  const { data: myRequestData, refetch: refetchMyRequest } = useQuery({
    queryKey: ["community-my-request", communityId],
    queryFn: () => getMyCommunityRequest(communityId),
    enabled: !!communityId,
    refetchInterval: 3000,
  });

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
  const allMembers = useMemo(() => {
    const direct = people.filter((p) => p.communityId === community?.id);
    const seen = new Set(direct.map((p) => p.id));
    const fromClubs = clubMembers.filter((p) => !seen.has(p.id));
    return [...direct, ...fromClubs];
  }, [people, community, clubMembers]);
  const communityTournaments = useMemo(
    () => tournaments.filter((tour) => tour.communityId === community?.id),
    [tournaments, community]
  );

  const currentUserPerson = useMemo(
    () => people.find((p) => p.id === user.id || p.id === user.personId),
    [people, user.id, user.personId]
  );

  const isMemberOfCommunity =
    !justLeft &&
    (user.community?.id === community?.id || currentUserPerson?.communityId === community?.id);

  const isMine = isMemberOfCommunity;

  // Reactively auto-clear pending status and sync session as soon as request is accepted
  useEffect(() => {
    if (justLeft) return;
    if (
      (currentUserPerson?.communityId === community?.id || (myRequestData && !myRequestData.hasPendingRequest && (myRequestData.request as any)?.status === "approved")) &&
      user.community?.id !== community?.id
    ) {
      if (isPendingLocal) {
        setIsPendingLocal(false);
      }
      if (community) {
        setCommunity({
          id: community.id,
          name: community.name,
          role: currentUserPerson?.communityRole || "Member",
        });
        void refreshSession();
      }
    }
  }, [currentUserPerson?.communityId, currentUserPerson?.communityRole, myRequestData, community, isPendingLocal, user.community?.id, setCommunity, refreshSession]);

  const canHandoverAuthority = isMine && (
    user.community?.role === "President" ||
    user.community?.role === "General Secretary" ||
    user.community?.role === "Vice President" ||
    currentUserPerson?.communityRole === "President" ||
    currentUserPerson?.communityRole === "General Secretary" ||
    currentUserPerson?.communityRole === "Vice President"
  );
  const isPresident = isMine && (user.community?.role === "President" || currentUserPerson?.communityRole === "President");
  const canManage = isPresident;
  const hasOtherCommunity = !!user.community && !isMine;

  const hasPendingRequest =
    !isMine &&
    !isMemberOfCommunity &&
    (isPendingLocal ||
      Boolean(myRequestData?.hasPendingRequest) ||
      joinRequests.some(
        (r) =>
          r.targetType === "community" &&
          r.targetId === community?.id &&
          (r.personId === user.personId || r.personId === user.id) &&
          r.status === "pending"
      ));

  const handleJoin = async () => {
    if (!community || hasOtherCommunity || hasPendingRequest || joinMutation.isPending) return;
    setJustLeft(false);

    if (community.joinPolicy === "approval") {
      setIsPendingLocal(true);
      addPendingJoinRequest("community", community.id, user.personId || user.id);
      try {
        await joinMutation.mutateAsync();
        toast("Join request sent! Awaiting approval by community leadership.", "info");
      } catch (err: any) {
        toast("Join request sent! Awaiting approval by community leadership.", "info");
      }
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
  const handleLeave = async () => {
    if (!community) return;
    if (!await confirm(t.dashboard.community.leaveConfirm, { title: "Leave Community", variant: "danger", confirmLabel: "Leave" })) return;

    // Instant optimistic UI switch (0ms delay)
    setJustLeft(true);
    setIsPendingLocal(false);
    leaveCommunity(user.personId || user.id);
    if (user.id) leaveCommunity(user.id);
    removePendingJoinRequest("community", community.id, user.personId || user.id);
    if (user.id) removePendingJoinRequest("community", community.id, user.id);
    setCommunity(null);
    queryClient.setQueryData(["community-my-request", community.id], { hasPendingRequest: false, request: null });
    toast(`You left ${community.name}.`, "info");

    try {
      await leaveMutation.mutateAsync();
      void queryClient.invalidateQueries({ queryKey: ["community-my-request", community.id] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void refreshSession();
    } catch (err: any) {
      setJustLeft(false);
      toast(err?.response?.data?.message || "Failed to leave community on server.", "error");
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: t.dashboard.community.tabOverview },
    { key: "members", label: t.dashboard.community.tabMembers },
    { key: "clubs", label: t.dashboard.community.tabClubs },
    { key: "rankings", label: t.dashboard.community.tabRankings },
    { key: "tournaments", label: t.dashboard.community.tabTournaments },
  ];

  const isLoading = (isRemoteLoading && !community) || (!community && !synced);

  if (isLoading) {
    return <AppLoader />;
  }

  if (!community) {
    return <EmptyState icon={ShieldIcon} title={t.dashboard.community.emptyState} body="" />;
  }

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
          ) : hasPendingRequest ? (
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500/15 border border-amber-500/40 px-5 py-2 font-display text-sm font-semibold text-amber-400 cursor-default"
            >
              <ClockIcon className="h-4 w-4 text-amber-400 animate-pulse" />
              <span>Requested</span>
            </button>
          ) : (
            <button
              onClick={handleJoin}
              disabled={hasOtherCommunity || joinMutation.isPending}
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

      {/* Community Tournaments Section (in place of relocated meta info) */}
      <div className="mt-6">
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent-ink">
              <TrophyIcon className="h-4 w-4" />
            </span>
            <h2 className="font-display text-base font-bold text-ink">
              {t.dashboard.community.tabTournaments}
            </h2>
            <span className="rounded-full bg-surface-line px-2 py-0.5 font-mono text-xs font-semibold text-ink-muted">
              {communityTournaments.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {canManage ? (
              <Link
                href={`/dashboard/efootball/tournaments/create?communityId=${community.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 font-display text-xs font-semibold text-bg transition-opacity hover:opacity-90 shadow-sm"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                {t.dashboard.shell.navCreateTournament}
              </Link>
            ) : null}
            {communityTournaments.length > 0 && tab !== "tournaments" ? (
              <button
                type="button"
                onClick={() => setTab("tournaments")}
                className="font-mono text-xs font-semibold text-accent-ink hover:underline"
              >
                View all &rarr;
              </button>
            ) : null}
          </div>
        </div>

        {communityTournaments.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {communityTournaments.slice(0, 3).map((tour) => (
              <TournamentCard
                key={tour.id}
                tournament={tour}
                href={`/dashboard/efootball/tournaments/${tour.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-surface-line bg-surface/30 p-6 text-center backdrop-blur-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent-ink">
              <TrophyIcon className="h-6 w-6" />
            </div>
            <h3 className="font-display mt-3 text-sm font-bold text-ink">
              {t.dashboard.tournaments.noTournaments}
            </h3>
            <p className="mx-auto mt-1 max-w-md text-xs text-ink-faint">
              {canManage
                ? "Host the first tournament for your community to bring member clubs and players together."
                : "Upcoming tournaments organized by this community will appear here."}
            </p>
            {canManage ? (
              <div className="mt-4">
                <Link
                  href={`/dashboard/efootball/tournaments/create?communityId=${community.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 font-display text-xs font-semibold text-bg shadow-sm transition-all hover:opacity-90"
                >
                  <PlusIcon className="h-4 w-4" />
                  {t.dashboard.shell.navCreateTournament}
                </Link>
              </div>
            ) : null}
          </div>
        )}
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
          <CommunityOverviewTab
            community={community}
            memberClubs={memberClubs}
            peopleByClub={peopleByClub}
            clubMembers={clubMembers}
            allPeople={people}
            allCommunities={communities}
            tournamentsCount={communityTournaments.length}
          />
        ) : null}
        {tab === "members" ? <CommunityMembersTab members={allMembers} memberClubs={memberClubs} /> : null}
        {tab === "clubs" ? <CommunityClubsTab community={community} memberClubs={memberClubs} allPeople={people} /> : null}
        {tab === "rankings" ? <CommunityRankingsTab memberClubs={memberClubs} /> : null}
        {tab === "tournaments" ? <CommunityTournamentsTab tournaments={communityTournaments} /> : null}
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
