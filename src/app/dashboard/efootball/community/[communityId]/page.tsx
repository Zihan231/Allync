"use client";

import { use } from "react";
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
import { PageHeader } from "@/components/dashboard/PageHeader";
import { BackButton } from "@/components/dashboard/BackButton";
import { CoverPhoto } from "@/components/common/CoverPhoto";
import { Avatar } from "@/components/common/Avatar";
import { StaffRow } from "@/components/dashboard/StaffRow";
import { TournamentListItem } from "@/components/dashboard/TournamentListItem";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SectionHeading } from "@/components/dashboard/SectionHeading";
import { ShieldIcon, UsersIcon, TrophyIcon, ArrowRightIcon } from "@/components/icons";

export default function CommunityDetailPage({ params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = use(params);
  const { t } = useLanguage();
  const { user, setCommunity } = useSession();
  const communities = useMockCommunities();
  const people = useMockPeople();
  const clubs = useMockClubs();
  const tournaments = useMockTournaments();
  const joinRequests = useMockJoinRequests();

  const community = communities.find((c) => c.id === communityId);

  if (!community) {
    return <EmptyState icon={ShieldIcon} title={t.dashboard.community.emptyState} body="" />;
  }

  const officials = people.filter((p) => p.communityId === community.id && p.communityRole !== "Member");
  const memberClubs = clubs.filter((c) => community.memberClubIds.includes(c.id));
  const communityTournaments = tournaments.filter((tour) => tour.communityId === community.id);

  const globalClubRanks = new Map(
    [...clubs].sort((a, b) => b.points - a.points).map((c, i) => [c.id, i + 1])
  );
  const communityClubRanks = new Map(
    [...memberClubs].sort((a, b) => b.points - a.points).map((c, i) => [c.id, i + 1])
  );
  const memberCounts = new Map(
    memberClubs.map((club) => [club.id, people.filter((p) => p.clubId === club.id).length])
  );
  const totalClubMembers = [...memberCounts.values()].reduce((sum, n) => sum + n, 0);

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

  return (
    <div>
      <BackButton href="/dashboard/efootball/community" />
      <div className="relative">
        <CoverPhoto
          coverUrl={community.coverUrl}
          name={community.name}
          color="#4c8dff"
          className="h-56 rounded-xl sm:h-72 lg:h-80"
        />
        <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 shadow-[0_0_0_1px_rgba(76,141,255,0.4)] backdrop-blur-sm">
          <UsersIcon className="h-4 w-4 text-blue-ink" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
            {t.dashboard.community.entityLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="-mt-14 flex items-end gap-4 sm:-mt-16">
          <div className="rounded-xl border-4 border-bg bg-surface">
            <Avatar dpUrl={community.dpUrl} name={community.name} size="xl" mode="lightbox" shape="square" />
          </div>
          <div className="pb-1">
            <h1 className="font-display text-2xl font-bold text-ink">{community.name}</h1>
            <p className="font-mono text-xs text-ink-faint">{community.points.toLocaleString()} pts</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pb-1">
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

      <div className="mt-6 max-w-2xl rounded-xl border border-surface-line bg-surface/40 p-4">
        <h2 className="font-display mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-warning-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          {t.dashboard.community.rulesLabel}
        </h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">{community.rules}</p>
      </div>

      <div className="mt-8 space-y-8">
        <section>
          <SectionHeading tone="blue">{t.dashboard.community.staffTitle}</SectionHeading>
          <StaffRow people={officials} />
        </section>

        <section>
          <SectionHeading
            tone="accent"
            action={
              <span className="font-mono text-[11px] text-ink-faint">
                {memberClubs.length} {t.dashboard.rankings.tabClubs.toLowerCase()} · {totalClubMembers}{" "}
                {t.dashboard.community.totalMembersLabel}
              </span>
            }
          >
            {t.dashboard.community.memberClubsTitle}
          </SectionHeading>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {memberClubs.map((club) => (
              <Link
                key={club.id}
                href={`/dashboard/efootball/clubs/${club.id}`}
                className="group flex items-center gap-3 rounded-xl border border-surface-line bg-surface/40 p-3.5 transition-colors hover:border-accent"
              >
                <div className="rounded-full border-2 border-bg bg-surface">
                  <Avatar dpUrl={club.dpUrl} name={club.name} size="md" mode="static" shape="circle" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{club.name}</span>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-soft px-2 py-0.5 font-mono text-[10px] font-bold text-blue-ink">
                      {t.dashboard.community.communityRankLabel} #{communityClubRanks.get(club.id) ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[10px] font-bold text-accent-ink">
                      {t.dashboard.community.globalRankLabel} #{globalClubRanks.get(club.id) ?? 0}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 font-mono text-[11px] text-ink-faint">
                    <span className="inline-flex items-center gap-1">
                      <TrophyIcon className="h-3 w-3" style={{ color: club.color }} />
                      {club.points.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <UsersIcon className="h-3 w-3" />
                      {memberCounts.get(club.id) ?? 0}/{club.maxRoster}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href="/dashboard/efootball/clubs"
            className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-wide text-blue-ink transition-colors hover:text-ink"
          >
            {t.dashboard.community.seeAllClubsCta}
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </section>

        <section>
          <SectionHeading tone="danger">{t.dashboard.community.tournamentsTitle}</SectionHeading>
          <div className="space-y-2">
            {communityTournaments.map((tour) => (
              <TournamentListItem key={tour.id} tournament={tour} href={`/dashboard/efootball/tournaments/${tour.id}`} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
