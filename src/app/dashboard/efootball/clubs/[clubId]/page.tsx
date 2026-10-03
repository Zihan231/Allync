"use client";

import { Suspense, use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import { clubJoinBlockReason } from "@/lib/session/createPermissions";
import { useQueryClient } from "@tanstack/react-query";
import { useMockClubs, useMockPeople, leaveClub, syncFromBackend, hasSyncedFromBackend } from "@/lib/mock/communityStore";
import { AppLoader } from "@/components/common/AppLoader";
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
import { ClubFixturesTab } from "@/components/dashboard/ClubFixturesTab";
import { ClubSquadTab } from "@/components/dashboard/ClubSquadTab";
import { ClubTransfersTab } from "@/components/dashboard/ClubTransfersTab";
import { ClubRankingsTab } from "@/components/dashboard/ClubRankingsTab";
import { ClubTableTab } from "@/components/dashboard/ClubTableTab";
import { ClubRoundsTab } from "@/components/dashboard/ClubRoundsTab";
import { ClubRoundStatsTab } from "@/components/dashboard/ClubRoundStatsTab";
import { ClubMatchStatsTab } from "@/components/dashboard/ClubMatchStatsTab";
import { ClubTeamUpTab } from "@/components/dashboard/ClubTeamUpTab";
import { ClubTeamsTab } from "@/components/dashboard/ClubTeamsTab";
import { ClubTournamentsTab } from "@/components/dashboard/ClubTournamentsTab";
import { ClubLatestTournaments } from "@/components/dashboard/ClubLatestTournaments";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MakeOfferModal } from "@/components/dashboard/transfers/MakeOfferModal";
import { useLeaveClub } from "@/lib/api/hooks/useClubs";
import { useMyTransfers } from "@/lib/api/hooks/useTransfers";
import { UsersIcon, TrophyIcon, FacebookIcon, SettingsIcon, LockIcon } from "@/components/icons";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { useConfirm } from "@/lib/useConfirm";
import { useUrlTab } from "@/lib/navigation/useUrlTab";

type Tab =
  | "overview"
  | "fixtures"
  | "squad"
  | "teams"
  | "transfers"
  | "rankings"
  | "table"
  | "rounds"
  | "roundStats"
  | "matchStats"
  | "teamUp"
  | "tournaments";

const CLUB_TABS: readonly Tab[] = [
  "overview",
  "fixtures",
  "squad",
  "teams",
  "transfers",
  "rankings",
  "table",
  "rounds",
  "roundStats",
  "matchStats",
  "teamUp",
  "tournaments",
];

export default function ClubDetailPage({ params }: { params: Promise<{ clubId: string }> }) {
  return (
    <Suspense fallback={<AppLoader />}>
      <ClubDetailContent params={params} />
    </Suspense>
  );
}

function ClubDetailContent({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const { t, locale } = useLanguage();
  const { user, setClub, refreshSession } = useSession();
  const clubs = useMockClubs();
  const people = useMockPeople();
  const [tab, setTab] = useUrlTab(CLUB_TABS, "overview");
  const tabsRef = useRef<HTMLDivElement>(null);
  const { confirm, confirmProps } = useConfirm();
  const [loading, setLoading] = useState(() => !hasSyncedFromBackend());
  const [justLeft, setJustLeft] = useState(false);
  const [proposing, setProposing] = useState(false);
  const queryClient = useQueryClient();
  const leaveMutation = useLeaveClub(clubId);
  const { toasts, toast, dismiss } = useToast();

  useEffect(() => {
    let mounted = true;
    syncFromBackend(true).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [clubId]);

  const club = clubs.find(
    (c) =>
      c.id === clubId ||
      c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") === clubId ||
      c.name.toLowerCase() === clubId.toLowerCase()
  );

  const members = useMemo(
    () => people.filter((p) => p.clubId === club?.id || p.clubId === clubId),
    [people, club, clubId]
  );
  const insights = useMemo(() => (club ? getClubInsights(club, members) : null), [club, members]);

  const leftoverStaff = members.filter((p) => p.clubRole === "Manager");
  const squadTeams = Array.from(new Set(members.map((p) => p.squadTeam ?? "Main")));
  const communities = mockCommunities.filter((c) => club?.communityIds.includes(c.id));

  const currentUserPerson = useMemo(
    () => people.find((p) => p.id === user.id || p.id === user.personId),
    [people, user.id, user.personId]
  );

  const isMemberOfClub =
    !justLeft &&
    (user.club?.id === club?.id || currentUserPerson?.clubId === club?.id);

  const isMine = isMemberOfClub;
  const { data: myTransfers } = useMyTransfers(!isMine);

  const canManageClub = isMine && (user.club?.role === "President" || user.club?.role === "General Secretary" || currentUserPerson?.clubRole === "President" || currentUserPerson?.clubRole === "General Secretary");
  const canManageTeams = isMine && (user.club?.role === "President" || user.club?.role === "Manager" || currentUserPerson?.clubRole === "President" || currentUserPerson?.clubRole === "Manager");
  const communityBlockReason = isMine ? null : clubJoinBlockReason(user, t);
  const isTransferLeader = myTransfers?.clubRole === "President" || myTransfers?.clubRole === "General Secretary";
  const openDealHere = (myTransfers?.offers ?? []).some((o) => o.status === "pending" && o.toClub.id === club?.id);
  const scheduledMove = (myTransfers?.offers ?? []).some((o) => o.status === "scheduled");
  const lockedContract = myTransfers?.contract?.locked ? myTransfers.contract : null;
  // Why "Propose to join" is locked (first reason that applies), or null if it can be used.
  const proposalBlockedReason =
    communityBlockReason ||
    (isTransferLeader
      ? t.dashboard.transfers.notTransferable
      : openDealHere
        ? t.dashboard.transfers.proposalPendingNote
        : scheduledMove
          ? t.dashboard.transfers.scheduledBlocked
          : lockedContract
            ? format(t.dashboard.transfers.lockedUntil, {
                club: lockedContract.clubName,
                date: new Date(lockedContract.lockEndsAt).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
              })
            : null);
  // Locked (without a message) until the player's transfer status has loaded.
  const proposalLocked = Boolean(proposalBlockedReason) || (!isMine && !myTransfers);

  const handleLeave = async () => {
    if (!club) return;
    if (!await confirm(t.dashboard.clubs.leaveConfirm, { title: "Leave Club", variant: "danger", confirmLabel: "Leave" })) return;

    // Instant optimistic UI switch (0ms delay)
    setJustLeft(true);
    leaveClub(user.personId || user.id);
    if (user.id) leaveClub(user.id);
    setClub(null);
    toast(`You left ${club.name}.`, "info");

    try {
      await leaveMutation.mutateAsync();
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void queryClient.invalidateQueries({ queryKey: ["transfers"] });
      void refreshSession();
    } catch (err: unknown) {
      setJustLeft(false);
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast(message || "Failed to leave club on server.", "error");
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: t.dashboard.club.tabOverview },
    { key: "fixtures", label: t.dashboard.club.tabFixtures },
    { key: "squad", label: `${t.dashboard.club.tabSquad} (${members.length})` },
    { key: "teams", label: "Teams" },
    { key: "transfers", label: t.dashboard.club.tabTransfers },
    { key: "rankings", label: t.dashboard.club.tabRankings },
    { key: "table", label: t.dashboard.club.tabTable },
    { key: "rounds", label: t.dashboard.club.tabRounds },
    { key: "roundStats", label: t.dashboard.club.tabRoundStats },
    { key: "matchStats", label: t.dashboard.club.tabMatchStats },
    { key: "teamUp", label: t.dashboard.club.tabTeamUp },
    { key: "tournaments", label: t.dashboard.club.tabTournaments },
  ];

  if (loading) {
    return <AppLoader />;
  }

  if (!club || !insights) {
    return <EmptyState icon={UsersIcon} title={t.dashboard.clubs.emptyState} body="" />;
  }

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

      {/* Only the avatar overlaps the cover; name and actions always sit below it. */}
      <div className="relative z-10 flex flex-col gap-4 px-1 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-end gap-4">
          <div className="-mt-14 shrink-0 rounded-full border-4 border-bg bg-surface sm:-mt-16">
            <Avatar dpUrl={club.dpUrl} name={club.name} size="xl" mode="lightbox" shape="circle" />
          </div>
          <div className="min-w-0 pb-1 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-display text-2xl font-bold text-ink">{club.name}</h1>
              <StagePill stage={club.stage} />
            </div>
            <p className="mt-0.5 font-mono text-xs text-ink-faint">
              {club.points.toLocaleString()} pts
              {squadTeams.length ? ` · ${squadTeams.join(", ")} ${t.dashboard.club.teamsSuffix}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end lg:pt-3">
          {members.length > 0 ? (
            <button
              type="button"
              onClick={() => setTab("squad")}
              className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent/20"
            >
              <UsersIcon className="h-4 w-4" />
              All Players ({members.length})
            </button>
          ) : null}

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

          {canManageTeams && club.joinPolicy === "approval" ? (
            <Link
              href={`/dashboard/efootball/clubs/${club.id}/requests`}
              className="rounded-full border border-surface-line-strong px-4 py-2 text-sm font-medium text-ink"
            >
              {t.dashboard.clubs.requestsQueueTitle}
            </Link>
          ) : null}

          {/* Club leaders: editing, positions, officials, presidency and deletion live in Settings. */}
          {isMine ? (
            canManageClub ? (
              <Link
                href={`/dashboard/efootball/clubs/${club.id}/settings`}
                className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-4 py-2 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent hover:text-bg"
              >
                <SettingsIcon className="h-4 w-4" />
                {t.dashboard.clubSettings.button}
              </Link>
            ) : (
              <button
                onClick={handleLeave}
                className="rounded-full bg-danger-soft px-4 py-2 text-sm font-semibold text-danger-ink"
              >
                {t.dashboard.clubs.leaveButton}
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={() => setProposing(true)}
              disabled={proposalLocked}
              title={proposalBlockedReason ?? undefined}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 font-display text-sm font-semibold text-bg disabled:cursor-not-allowed disabled:opacity-40"
            >
              {proposalLocked ? <LockIcon className="h-3.5 w-3.5" /> : null}
              {t.dashboard.transfers.proposeJoin}
            </button>
          )}
        </div>
      </div>

      {proposalBlockedReason ? (
        <p className="mt-3 flex items-start gap-1.5 font-mono text-xs text-warning-ink">
          <LockIcon className="mt-px h-3.5 w-3.5 shrink-0" />
          <span>{proposalBlockedReason}</span>
        </p>
      ) : null}

      {club.motto ? (
        <div
          className="mt-4 flex max-w-2xl items-start gap-3 rounded-xl border-l-4 bg-surface/40 px-4 py-3"
          style={{ borderLeftColor: club.color, boxShadow: `0 0 0 1px ${club.color}26` }}
        >
          <span className="font-display text-3xl font-black leading-[0.6]" style={{ color: club.color }}>
            &ldquo;
          </span>
          <p className="pt-1 font-display text-base font-semibold italic leading-snug tracking-tight text-ink">
            {club.motto}
          </p>
        </div>
      ) : null}

      <div className="mt-6">
        <ClubLatestTournaments
          clubId={club.id}
          onViewAll={() => {
            setTab("tournaments");
            // After the tab renders, bring the tab bar (and the list under it) into view.
            requestAnimationFrame(() => tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
          }}
        />
      </div>

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

      {/* scroll-mt keeps the tab bar clear of the sticky top bar when scrolled to */}
      <div ref={tabsRef} className="mt-8 flex scroll-mt-20 flex-wrap gap-2">
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
        {tab === "overview" ? (
          <div className="space-y-6">
            {/* Club officials and key numbers */}
            <ClubMetaGrid club={club} members={members} />
            {leftoverStaff.length ? <StaffRow people={leftoverStaff} /> : null}
            <ClubOverviewTab club={club} members={members} insights={insights} />
          </div>
        ) : null}
        {tab === "fixtures" ? <ClubFixturesTab club={club} members={members} /> : null}
        {tab === "squad" ? (
          <ClubSquadTab club={club} members={members} />
        ) : null}
        {tab === "teams" ? <ClubTeamsTab clubId={club.id} canManage={canManageTeams} club={club} /> : null}
        {tab === "transfers" ? <ClubTransfersTab club={club} /> : null}
        {tab === "rankings" ? <ClubRankingsTab club={club} members={members} /> : null}
        {tab === "table" ? <ClubTableTab club={club} /> : null}
        {tab === "rounds" ? <ClubRoundsTab club={club} members={members} /> : null}
        {tab === "roundStats" ? <ClubRoundStatsTab club={club} members={members} /> : null}
        {tab === "matchStats" ? <ClubMatchStatsTab club={club} members={members} /> : null}
        {tab === "teamUp" ? <ClubTeamUpTab club={club} members={members} /> : null}
        {tab === "tournaments" ? (
          <ClubTournamentsTab
            clubId={club.id}
            canCreate={
              isMine &&
              (user.club?.role === "President" ||
                user.club?.role === "General Secretary" ||
                currentUserPerson?.clubRole === "President" ||
                currentUserPerson?.clubRole === "General Secretary")
            }
          />
        ) : null}
      </div>

      {proposing ? (
        <MakeOfferModal
          mode="proposal"
          clubId={club.id}
          onClose={() => setProposing(false)}
          onToast={toast}
        />
      ) : null}
      <ConfirmDialog {...confirmProps} />
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
