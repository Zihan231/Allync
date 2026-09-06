"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import {
  useMockCommunities,
  useMockPeople,
  useMockClubs,
  useMockJoinRequests,
  joinCommunity,
  leaveCommunity,
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
import { ShieldIcon, UsersIcon, FacebookIcon } from "@/components/icons";

type Tab = "overview" | "members" | "clubs" | "rankings" | "tournaments" | "freeAgents" | "transfers";

export default function CommunityDetailPage({ params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = use(params);
  const { t } = useLanguage();
  const { user, setCommunity } = useSession();
  const communities = useMockCommunities();
  const people = useMockPeople();
  const clubs = useMockClubs();
  const tournaments = useMockTournaments();
  const joinRequests = useMockJoinRequests();
  const [tab, setTab] = useState<Tab>("overview");

  const community = communities.find((c) => c.id === communityId);

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

  if (!community) {
    return <EmptyState icon={ShieldIcon} title={t.dashboard.community.emptyState} body="" />;
  }

  const isMine = user.community?.id === community.id;
  const canManage = isMine && user.community?.role === "President";
  const hasOtherCommunity = !!user.community && !isMine;
  const hasPendingRequest = joinRequests.some(
    (r) =>
      r.targetType === "community" &&
      r.targetId === community.id &&
      r.personId === user.personId &&
      r.status === "pending"
  );

  const handleJoin = () => {
    joinCommunity(user.personId, community.id);
    if (community.joinPolicy === "instant") {
      setCommunity({ id: community.id, name: community.name, role: "Member" });
    }
  };

  const handleLeave = () => {
    if (!window.confirm(t.dashboard.community.leaveConfirm)) return;
    leaveCommunity(user.personId);
    setCommunity(null);
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

          {isMine ? (
            <button
              onClick={handleLeave}
              className="rounded-full bg-danger-soft px-4 py-2 text-sm font-semibold text-danger-ink"
            >
              {t.dashboard.community.leaveButton}
            </button>
          ) : (
            <button
              onClick={handleJoin}
              disabled={hasOtherCommunity || hasPendingRequest}
              className="rounded-full bg-accent px-4 py-2 font-display text-sm font-semibold text-bg disabled:opacity-40"
            >
              {community.joinPolicy === "instant"
                ? t.dashboard.community.joinButton
                : t.dashboard.community.requestToJoinButton}
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
    </div>
  );
}
