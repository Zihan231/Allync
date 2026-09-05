"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockClubs, useMockPeople, useMockJoinRequests, joinClub, leaveClub } from "@/lib/mock/communityStore";
import { mockCommunities } from "@/lib/mock";
import { getClubInsights } from "@/lib/mock/clubInsights";
import { BackButton } from "@/components/dashboard/BackButton";
import { CoverPhoto } from "@/components/common/CoverPhoto";
import { Avatar } from "@/components/common/Avatar";
import { StaffRow } from "@/components/dashboard/StaffRow";
import { SectionHeading } from "@/components/dashboard/SectionHeading";
import { StagePill } from "@/components/dashboard/StagePill";
import { ClubMetaGrid } from "@/components/dashboard/ClubMetaGrid";
import { ClubOverviewTab } from "@/components/dashboard/ClubOverviewTab";
import { ClubSquadTab } from "@/components/dashboard/ClubSquadTab";
import { ClubTransfersTab } from "@/components/dashboard/ClubTransfersTab";
import { ClubRankingsTab } from "@/components/dashboard/ClubRankingsTab";
import { ClubTableTab } from "@/components/dashboard/ClubTableTab";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { UsersIcon, TrophyIcon, FacebookIcon } from "@/components/icons";

type Tab = "overview" | "squad" | "transfers" | "rankings" | "table";

export default function ClubDetailPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const { t } = useLanguage();
  const { user, setClub } = useSession();
  const clubs = useMockClubs();
  const people = useMockPeople();
  const joinRequests = useMockJoinRequests();
  const [tab, setTab] = useState<Tab>("overview");

  const club = clubs.find((c) => c.id === clubId);

  const members = useMemo(() => people.filter((p) => p.clubId === clubId), [people, clubId]);
  const insights = useMemo(() => (club ? getClubInsights(club, members) : null), [club, members]);

  if (!club || !insights) {
    return <EmptyState icon={UsersIcon} title={t.dashboard.clubs.emptyState} body="" />;
  }

  const leftoverStaff = members.filter((p) => p.clubRole === "Manager");
  const squadTeams = Array.from(new Set(members.map((p) => p.squadTeam ?? "Main")));
  const communities = mockCommunities.filter((c) => club.communityIds.includes(c.id));

  const isMine = user.club?.id === club.id;
  const canManage = isMine && (user.club?.role === "President" || user.club?.role === "Manager");
  const hasOtherClub = !!user.club && !isMine;
  const hasPendingRequest = joinRequests.some(
    (r) => r.targetType === "club" && r.targetId === club.id && r.personId === user.personId && r.status === "pending"
  );

  const handleJoin = () => {
    joinClub(user.personId, club.id);
    if (club.joinPolicy === "instant") {
      setClub({ id: club.id, name: club.name, role: "Player" });
    }
  };

  const handleLeave = () => {
    if (!window.confirm(t.dashboard.clubs.leaveConfirm)) return;
    leaveClub(user.personId);
    setClub(null);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: t.dashboard.club.tabOverview },
    { key: "squad", label: t.dashboard.club.tabSquad },
    { key: "transfers", label: t.dashboard.club.tabTransfers },
    { key: "rankings", label: t.dashboard.club.tabRankings },
    { key: "table", label: t.dashboard.club.tabTable },
  ];

  return (
    <div>
      <BackButton href="/dashboard/efootball/clubs" />
      <div className="relative">
        <CoverPhoto coverUrl={club.coverUrl} name={club.name} color={club.color} className="h-56 rounded-xl sm:h-72 lg:h-80" />
        <div
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm"
          style={{ boxShadow: `0 0 0 1px ${club.color}66` }}
        >
          <TrophyIcon className="h-4 w-4" style={{ color: club.color }} />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
            {t.dashboard.clubs.entityLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="-mt-14 flex items-end gap-4 sm:-mt-16">
          <div className="rounded-full border-4 border-bg bg-surface">
            <Avatar dpUrl={club.dpUrl} name={club.name} size="xl" mode="lightbox" shape="circle" />
          </div>
          <div className="pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-ink">{club.name}</h1>
              <StagePill stage={club.stage} />
            </div>
            <p className="font-mono text-xs text-ink-faint">
              {club.points.toLocaleString()} pts
              {squadTeams.length ? ` · ${squadTeams.join(", ")} ${t.dashboard.club.teamsSuffix}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pb-1">
          {club.facebookUrl ? (
            <a
              href={club.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-surface-line-strong px-4 py-2 text-sm font-medium text-ink"
            >
              <FacebookIcon className="h-4 w-4" />
              {t.dashboard.club.contactFacebook}
            </a>
          ) : null}

          {canManage ? (
            <>
              <Link
                href={`/dashboard/efootball/clubs/${club.id}/edit`}
                className="rounded-full border border-surface-line-strong px-4 py-2 text-sm font-medium text-ink"
              >
                {t.dashboard.clubs.editButton}
              </Link>
              {club.joinPolicy === "approval" ? (
                <Link
                  href={`/dashboard/efootball/clubs/${club.id}/requests`}
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
              {t.dashboard.clubs.leaveButton}
            </button>
          ) : (
            <button
              onClick={handleJoin}
              disabled={hasOtherClub || hasPendingRequest}
              className="rounded-full bg-accent px-4 py-2 font-display text-sm font-semibold text-bg disabled:opacity-40"
            >
              {club.joinPolicy === "instant" ? t.dashboard.clubs.joinButton : t.dashboard.clubs.requestToJoinButton}
            </button>
          )}
        </div>
      </div>

      {hasPendingRequest ? (
        <p className="mt-3 font-mono text-xs text-warning-ink">{t.dashboard.clubs.pendingRequestNotice}</p>
      ) : null}

      {club.motto ? <p className="mt-4 max-w-2xl text-sm italic leading-relaxed text-ink-soft">&ldquo;{club.motto}&rdquo;</p> : null}

      <div className="mt-6">
        <ClubMetaGrid club={club} members={members} />
      </div>

      {leftoverStaff.length ? (
        <div className="mt-5">
          <StaffRow people={leftoverStaff} />
        </div>
      ) : null}

      {communities.length ? (
        <div className="mt-6">
          <SectionHeading tone="success">{t.dashboard.club.communitiesTitle}</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {communities.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/efootball/community/${c.id}`}
                className="rounded-full border border-surface-line-strong bg-bg-raised px-3 py-1.5 text-xs font-medium text-ink hover:border-accent"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            type="button"
            onClick={() => setTab(tb.key)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              tab === tb.key
                ? "border-accent bg-accent-soft text-accent-ink"
                : "border-surface-line-strong text-ink-soft hover:text-ink"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "overview" ? <ClubOverviewTab club={club} members={members} insights={insights} /> : null}
        {tab === "squad" ? (
          <ClubSquadTab club={club} members={members} contractDaysById={insights.contractDaysById} />
        ) : null}
        {tab === "transfers" ? <ClubTransfersTab club={club} allPeople={people} /> : null}
        {tab === "rankings" ? <ClubRankingsTab club={club} members={members} /> : null}
        {tab === "table" ? <ClubTableTab club={club} /> : null}
      </div>
    </div>
  );
}
