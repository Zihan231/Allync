"use client";

import { Suspense, use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format, formatNodes } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import { useMockPeople } from "@/lib/mock/communityStore";
import {
  useTournament,
  useJoinTournament,
  useSubmitTournamentLineup,
  useGenerateTournamentBracket,
  useDeleteTournament,
} from "@/lib/api/hooks/useTournaments";
import { EditTournamentModal } from "@/components/dashboard/EditTournamentModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useConfirm } from "@/lib/useConfirm";
import { useCommunityMembers } from "@/lib/api/hooks/useCommunities";
import { getClub } from "@/lib/api/clubs";
import { getTeams, getClubMembers, type Team, type ClubMemberProfile } from "@/lib/api/teams";
import type { BackendClub } from "@/lib/api/types";
import type {
  TournamentLineupPlayer,
  TournamentParticipant,
} from "@/lib/api/tournaments";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { AppLoader } from "@/components/common/AppLoader";
import { useUrlTab } from "@/lib/navigation/useUrlTab";
import { useCountdown } from "@/lib/hooks/useCountdown";
import {
  TrophyIcon,
  BracketIcon,
  UsersIcon,
  CrosshairIcon,
  WalletIcon,
  CalendarIcon,
  ArrowRightIcon,
  ClockIcon,
  CheckIcon,
  LockIcon,
  ShieldIcon,
  FlameIcon,
} from "@/components/icons";

type TournamentDetailTab = "bracket" | "participants" | "lineup";
const TOURNAMENT_DETAIL_TABS: readonly TournamentDetailTab[] = [
  "bracket",
  "participants",
  "lineup",
];

export default function TournamentDetailPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  return (
    <Suspense fallback={<AppLoader />}>
      <TournamentDetailRoute params={params} />
    </Suspense>
  );
}

function TournamentDetailRoute({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = use(params);
  return (
    <TournamentDetailView
      tournamentId={tournamentId}
      backHref="/dashboard/efootball/tournaments"
      context="my-tournaments"
    />
  );
}

export function TournamentDetailView({
  tournamentId,
  backHref,
  context,
}: {
  tournamentId: string;
  backHref: string;
  context: "community" | "my-tournaments";
}) {
  const { t, locale } = useLanguage();
  const td = t.dashboard.tournamentDetail;
  const dateLocale = locale === "bn" ? "bn-BD" : "en-US";
  const { user, isLoading: isSessionLoading } = useSession();
  const router = useRouter();

  function handleBack() {
    router.push(backHref);
  }

  const { data: tournament, isLoading, refetch } = useTournament(tournamentId);
  const { data: communityMembers = [], isLoading: isLoadingCommunityMembers } =
    useCommunityMembers(tournament?.communityId ?? "");
  const joinMutation = useJoinTournament(tournamentId);
  const submitLineupMutation = useSubmitTournamentLineup(tournamentId);
  const generateBracketMutation = useGenerateTournamentBracket(tournamentId);
  const deleteMutation = useDeleteTournament(tournamentId);
  const { confirm, confirmProps } = useConfirm();
  const [showEditModal, setShowEditModal] = useState(false);
  const tm = t.dashboard.tournamentManage;
  const people = useMockPeople();
  const viewerIsParticipant = Boolean(
    tournament?.participants?.some((participant) =>
      tournament.type === "cvc"
        ? participant.clubId === user?.club?.id
        : participant.userId === user?.id || participant.userId === user?.personId,
    ),
  );

  useEffect(() => {
    if (
      context !== "my-tournaments" ||
      isSessionLoading ||
      !tournament ||
      viewerIsParticipant
    ) {
      return;
    }

    router.replace(
      `/dashboard/efootball/community/${tournament.communityId}/tournaments/${tournament.id}`,
    );
  }, [context, isSessionLoading, router, tournament, viewerIsParticipant]);

  // Club and teams state for CvC
  const [userClubDetails, setUserClubDetails] = useState<BackendClub | null>(null);
  const [clubTeams, setClubTeams] = useState<Team[]>([]);
  const [clubMembers, setClubMembers] = useState<ClubMemberProfile[]>([]);
  const [loadingClubData, setLoadingClubData] = useState(false);

  // Active tab and builder states
  const [activeTab, setActiveTab] = useUrlTab(TOURNAMENT_DETAIL_TABS, "bracket");
  const [submissionType, setSubmissionType] = useState<"preset" | "custom">("preset");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [customStarters, setCustomStarters] = useState<TournamentLineupPlayer[]>([]);
  const [customSubs, setCustomSubs] = useState<TournamentLineupPlayer[]>([]);
  const [actionError, setActionError] = useState<string>("");
  const [actionSuccess, setActionSuccess] = useState<string>("");

  // Countdown to 2-hour cutoff
  const countdown = useCountdown(tournament?.teamSubmissionDeadline);

  // Fetch user's club details to verify membership in community
  useEffect(() => {
    let isMounted = true;
    async function fetchClubInfo() {
      if (!user?.club?.id) return;
      setLoadingClubData(true);
      try {
        const [club, teams, members] = await Promise.all([
          getClub(user.club.id),
          getTeams(user.club.id).catch(() => []),
          getClubMembers(user.club.id).catch(() => []),
        ]);
        if (isMounted) {
          setUserClubDetails(club);
          setClubTeams(teams);
          setClubMembers(members);
          if (teams.length > 0) {
            setSelectedTeamId(teams[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load club info for tournament", err);
      } finally {
        if (isMounted) setLoadingClubData(false);
      }
    }
    fetchClubInfo();
    return () => {
      isMounted = false;
    };
  }, [user?.club?.id]);

  const currentUserPerson = useMemo(
    () => people.find((p) => p.id === user?.id || p.id === user?.personId),
    [people, user?.id, user?.personId]
  );

  if (
    isLoading ||
    isSessionLoading ||
    (context === "my-tournaments" && tournament && !viewerIsParticipant)
  ) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-accent border-t-transparent shadow-[0_0_20px_rgba(217,165,68,0.4)]" />
        <span className="font-display text-xs font-semibold tracking-wider text-accent-ink uppercase">{td.loadingArena}</span>
      </div>
    );
  }

  if (!tournament) {
    return (
      <EmptyState
        icon={TrophyIcon}
        title={td.notFoundTitle}
        body={td.notFoundBody}
      />
    );
  }

  // Normalized Status
  const rawStatus = (tournament.status || "open").toLowerCase();
  const isRegistrationOpen = rawStatus === "open" || rawStatus === "registration_open";
  const isOngoing = rawStatus === "ongoing" || rawStatus === "live";
  const isCompleted = rawStatus === "completed";
  const isRegistrationClosed = rawStatus === "registration_closed" || rawStatus === "submission_phase";

  // Permissions and Eligibility Checks
  const isOrganizer =
    tournament.creatorId === user?.id ||
    tournament.createdById === user?.id ||
    tournament.community?.creatorId === user?.id ||
    tournament.community?.presidentId === user?.id ||
    tournament.community?.vicePresidentId === user?.id ||
    (user?.community?.id === tournament.communityId &&
      (user?.community?.role === "President" || user?.community?.role === "Vice President"));

  const currentUserIds = [user?.id, user?.personId].filter(
    (id): id is string => Boolean(id),
  );
  const isCurrentUserId = (candidateId?: string) =>
    Boolean(candidateId && currentUserIds.includes(candidateId));
  const currentCommunityMembership = communityMembers.find((member) =>
    isCurrentUserId(member.id),
  );
  const hostingCommunityRole =
    currentCommunityMembership?.communityRole ??
    (user?.community?.id === tournament.communityId
      ? user.community.role
      : currentUserPerson?.communityId === tournament.communityId
        ? currentUserPerson.communityRole
        : null);
  const isHostingCommunityLeader =
    hostingCommunityRole === "President" ||
    hostingCommunityRole === "Vice President" ||
    isCurrentUserId(tournament.community?.creatorId) ||
    isCurrentUserId(tournament.community?.presidentId) ||
    isCurrentUserId(tournament.community?.vicePresidentId);
  const canShowJoinAction =
    !isLoadingCommunityMembers && !isHostingCommunityLeader;

  const isCvC = tournament.type === "cvc";

  // Check if current user / club is already participating
  const myParticipation = tournament.participants?.find((p) => {
    if (isCvC) {
      return p.clubId === user?.club?.id;
    }
    return p.userId === user?.id || p.userId === user?.personId;
  });

  const isRegistered = Boolean(myParticipation);

  // Authority to join:
  // For CvC: Must be President or General Secretary of the club
  const canJoinCvC =
    user?.club &&
    (user.club.role === "President" || user.club.role === "General Secretary");

  // Community membership: Club must belong to tournament.communityId
  const clubBelongsToCommunity =
    userClubDetails?.communityIds?.includes(tournament.communityId) ||
    user?.community?.id === tournament.communityId;

  // Player community membership for PvP
  const playerBelongsToCommunity =
    user?.community?.id === tournament.communityId ||
    currentUserPerson?.communityId === tournament.communityId ||
    tournament.creatorId === user?.id ||
    tournament.creatorId === user?.personId ||
    tournament.createdById === user?.id ||
    tournament.community?.creatorId === user?.id ||
    tournament.community?.presidentId === user?.id ||
    tournament.community?.vicePresidentId === user?.id;

  // Authority to submit lineup: President, General Secretary, or Manager
  const canSubmitLineup =
    isCvC &&
    isRegistered &&
    user?.club &&
    (user.club.role === "President" ||
      user.club.role === "General Secretary" ||
      user.club.role === "Manager");

  const isSubmissionOpen = !countdown.isPast;

  // Date labels
  const startsDate = new Date(tournament.startAt);
  const startsDateLabel = startsDate.toLocaleDateString(dateLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const startsTimeLabel = startsDate.toLocaleTimeString(dateLocale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const deadlineDate = new Date(tournament.teamSubmissionDeadline);
  const deadlineTimeLabel = deadlineDate.toLocaleTimeString(dateLocale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Relative kick-off text
  const msUntilStart = startsDate.getTime() - Date.now();
  const daysUntilStart = Math.ceil(msUntilStart / (1000 * 60 * 60 * 24));
  const relativeStartLabel =
    msUntilStart > 0
      ? daysUntilStart === 1
        ? td.tomorrow
        : format(td.inDays, { days: daysUntilStart })
      : td.started;

  // Capacity calculations
  const participantsCount = tournament.participants?.length || 0;
  const capacityPercent = Math.min(100, Math.round((participantsCount / (tournament.maxParticipants || 16)) * 100));

  // Handle Registration
  async function handleJoinTournament() {
    if (!tournament) return;
    setActionError("");
    setActionSuccess("");
    try {
      await joinMutation.mutateAsync(isCvC ? { clubId: user?.club?.id } : {});
      setActionSuccess(
        isCvC
          ? format(td.toastClubJoined, { club: user?.club?.name ?? "" })
          : td.toastJoined,
      );
      refetch();
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || err?.message || td.errJoin,
      );
    }
  }

  // Handle Lineup Submission
  async function handleSubmitLineup() {
    if (!tournament || !myParticipation) return;
    setActionError("");
    setActionSuccess("");

    let startersPayload: TournamentLineupPlayer[] = [];
    let subsPayload: TournamentLineupPlayer[] = [];

    if (submissionType === "preset") {
      const selectedTeam = clubTeams.find((t) => t.id === selectedTeamId);
      if (!selectedTeam) {
        setActionError(td.errSelectPreset);
        return;
      }
      const starters = selectedTeam.members.filter((m) => m.lineupStatus === "Starter");
      const subs = selectedTeam.members.filter((m) => m.lineupStatus === "Sub");

      if (starters.length !== tournament.startersCount) {
        setActionError(
          format(td.errPresetStarters, {
            team: selectedTeam.name,
            count: starters.length,
            required: tournament.startersCount,
          }),
        );
        return;
      }
      if (subs.length !== tournament.subsCount) {
        setActionError(
          format(td.errPresetSubs, {
            team: selectedTeam.name,
            count: subs.length,
            required: tournament.subsCount,
          }),
        );
        return;
      }

      startersPayload = starters.map((m) => ({
        profileId: m.id,
        userId: m.userId,
        name: m.user?.name || "Player",
        gamePosition: m.gamePosition || "CMF",
        lineupStatus: "Starter",
      }));
      subsPayload = subs.map((m) => ({
        profileId: m.id,
        userId: m.userId,
        name: m.user?.name || "Player",
        gamePosition: m.gamePosition || "SUB",
        lineupStatus: "Sub",
      }));
    } else {
      // Custom Lineup
      if (customStarters.length !== tournament.startersCount) {
        setActionError(
          format(td.errCustomStarters, { required: tournament.startersCount, count: customStarters.length }),
        );
        return;
      }
      if (customSubs.length !== tournament.subsCount) {
        setActionError(
          format(td.errCustomSubs, { required: tournament.subsCount, count: customSubs.length }),
        );
        return;
      }
      startersPayload = customStarters;
      subsPayload = customSubs;
    }

    try {
      await submitLineupMutation.mutateAsync({
        participantId: myParticipation.id,
        payload: {
          starters: startersPayload,
          substitutes: subsPayload,
        },
      });
      setActionSuccess(td.toastLineupLocked);
      refetch();
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || err?.message || td.errLineup,
      );
    }
  }

  async function handleDeleteTournament() {
    if (!tournament) return;
    const confirmed = await confirm(format(tm.deleteConfirm, { name: tournament.name }), {
      title: tm.deleteTitle,
      variant: "danger",
      confirmLabel: tm.deleteConfirmLabel,
      cancelLabel: tm.cancel,
    });
    if (!confirmed) return;

    setActionError("");
    setActionSuccess("");
    try {
      await deleteMutation.mutateAsync();
      router.push(`/dashboard/efootball/community/${tournament.communityId}?tab=tournaments`);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionError(message || (err as Error)?.message || tm.errDelete);
    }
  }

  // Handle Generate Bracket
  async function handleGenerateBracket() {
    setActionError("");
    setActionSuccess("");
    try {
      await generateBracketMutation.mutateAsync();
      setActionSuccess(td.toastBracketGenerated);
      refetch();
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || err?.message || td.errBracket,
      );
    }
  }

  return (
    <div className="relative pb-16">
      {/* Ambient background glows with gold, blue, and emerald radiance */}
      <div className="pointer-events-none absolute -top-10 left-1/4 -z-10 h-96 w-96 rounded-full bg-accent/20 blur-[130px]" />
      <div className="pointer-events-none absolute top-40 right-10 -z-10 h-80 w-80 rounded-full bg-blue-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute top-96 left-10 -z-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-[120px]" />

      {/* HERO BANNER CARD */}
      <div className="relative overflow-hidden rounded-3xl border border-accent/40 bg-gradient-to-b from-surface-line/80 via-surface/90 to-surface p-6 sm:p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        {/* Top glowing accent line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-accent via-blue-400 to-transparent shadow-[0_0_15px_rgba(217,165,68,0.8)]" />

        {/* Back breadcrumb */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="group inline-flex items-center gap-2 rounded-full border border-surface-line-strong bg-surface/80 px-4 py-1.5 text-xs font-semibold text-ink-soft transition-all hover:border-accent hover:text-accent-ink hover:shadow-[0_0_12px_rgba(217,165,68,0.2)] cursor-pointer"
          >
            <span className="transition-transform group-hover:-translate-x-1">&larr;</span>
            <span>{td.back}</span>
          </button>

          {/* Status Indicator + organizer actions */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isOrganizer ? (
              <>
                {!isCompleted ? (
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    className="inline-flex items-center rounded-full border border-accent/40 bg-accent-soft px-3.5 py-1 text-xs font-bold text-accent-ink transition-colors hover:bg-accent hover:text-bg"
                  >
                    {tm.edit}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleDeleteTournament}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center rounded-full border border-danger/40 bg-danger-soft px-3.5 py-1 text-xs font-bold text-danger-ink transition-colors hover:bg-danger hover:text-white disabled:opacity-50"
                >
                  {deleteMutation.isPending ? tm.deleting : tm.delete}
                </button>
              </>
            ) : null}
            <div className="flex items-center gap-2 rounded-full border border-surface-line-strong bg-surface-raised px-3.5 py-1 text-xs font-bold">
              <span
                className={`h-2 w-2 rounded-full ${
                  tournament.status === "ongoing"
                    ? "bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                    : tournament.status === "open"
                      ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                      : "bg-slate-400"
                }`}
              />
              <span
                className={`${
                  tournament.status === "ongoing"
                    ? "text-rose-400"
                    : tournament.status === "open"
                      ? "text-emerald-400"
                      : "text-ink-soft"
                }`}
              >
                {tournament.status === "ongoing"
                  ? td.statusLive
                  : tournament.status === "open"
                    ? td.statusOpen
                    : tournament.status === "registration_closed"
                      ? td.statusClosed
                      : td.statusCompleted}
              </span>
            </div>
          </div>
        </div>

        {/* Tournament Title & Community Information */}
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3 max-w-3xl">


            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)]">
              {tournament.name}
            </h1>

            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 font-mono text-[11px] font-bold text-blue-300">
                <CrosshairIcon className="h-3.5 w-3.5 text-blue-400" />
                {isCvC
                  ? tournament.preset === "custom"
                    ? format(td.badgeCvcCustom, { count: tournament.startersCount })
                    : format(td.badgeCvcPreset, { count: tournament.startersCount })
                  : td.badgePvp}
              </span>

              {tournament.prizePoolBdt && tournament.prizePoolBdt > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-3.5 py-1 font-mono text-[11px] font-extrabold text-amber-300 shadow-[0_0_15px_rgba(217,165,68,0.25)]">
                  <TrophyIcon className="h-3.5 w-3.5 text-amber-400" />
                  {format(td.badgePrizePool, { amount: tournament.prizePoolBdt.toLocaleString() })}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-surface-line bg-surface-raised px-3 py-1 font-mono text-[11px] text-ink-faint">
                  {td.badgeFriendly}
                </span>
              )}

              {tournament.isPaid && tournament.entryFeeBdt && tournament.entryFeeBdt > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/15 px-3 py-1 font-mono text-[11px] font-bold text-warning-ink">
                  <WalletIcon className="h-3 w-3 text-warning-ink" />
                  {format(td.badgeEntryFee, { amount: tournament.entryFeeBdt.toLocaleString() })}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 font-mono text-[11px] font-bold text-emerald-400">
                  {td.badgeFreeEntry}
                </span>
              )}

              <span className="inline-flex items-center rounded-full border border-surface-line-strong bg-surface/60 px-3 py-1 font-mono text-[11px] text-ink-soft">
                eFootball 2026
              </span>
            </div>
          </div>

          {/* Quick Header CTA */}
          <div className="flex flex-wrap items-center gap-3">
            {canShowJoinAction && !isRegistered && isRegistrationOpen && (
              <>
                {isCvC ? (
                  canJoinCvC && clubBelongsToCommunity ? (
                    <button
                      onClick={handleJoinTournament}
                      disabled={joinMutation.isPending}
                      className="relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-accent via-amber-400 to-accent px-6 py-3 font-display text-sm font-black text-bg shadow-[0_0_25px_rgba(217,165,68,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_35px_rgba(217,165,68,0.6)] disabled:opacity-40 cursor-pointer"
                    >
                      <FlameIcon className="h-4 w-4" />
                      {joinMutation.isPending ? td.joining : format(td.registerClub, { club: user?.club?.name ?? "" })}
                    </button>
                  ) : user?.club ? (
                    <div className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300">
                      <UsersIcon className="h-3.5 w-3.5 text-amber-400" />
                      <span>{format(td.presidentRegisters, { club: user?.club?.name ?? "" })}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-full border border-surface-line-strong bg-surface-raised px-4 py-2 text-xs font-medium text-ink-soft">
                      <UsersIcon className="h-3.5 w-3.5 text-ink-muted" />
                      <span>{td.joinClubToParticipate}</span>
                    </div>
                  )
                ) : (
                  !playerBelongsToCommunity ? (
                    <div className="flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300">
                      <span>{td.mustBeMember}</span>
                      <Link
                        href={`/dashboard/efootball/community/${tournament.communityId}`}
                        className="underline text-accent-ink hover:text-white"
                      >
                        {td.joinCommunity}
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={handleJoinTournament}
                      disabled={joinMutation.isPending}
                      className="relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-accent via-amber-400 to-accent px-7 py-3.5 font-display text-sm font-black text-bg shadow-[0_0_25px_rgba(217,165,68,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_35px_rgba(217,165,68,0.6)] disabled:opacity-40 cursor-pointer"
                    >
                      <FlameIcon className="h-4 w-4" />
                      {joinMutation.isPending ? td.joining : td.participate}
                    </button>
                  )
                )}
              </>
            )}

            {isRegistered && (
              <>
                {isCvC ? (
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-300">
                      <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                      {format(td.clubEnrolled, { club: user?.club?.name || td.clubFallback })}
                    </span>
                    <button
                      onClick={() => setActiveTab("lineup")}
                      className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-5 py-2.5 font-display text-xs font-bold text-accent-ink transition-all hover:bg-accent hover:text-bg hover:shadow-[0_0_20px_rgba(217,165,68,0.3)] cursor-pointer"
                    >
                      <ShieldIcon className="h-4 w-4" />
                      {myParticipation?.lineup ? td.manageLineup : td.submitLineup}
                    </button>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-5 py-2.5 text-xs font-bold text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.25)]">
                    <CheckIcon className="h-4 w-4 text-emerald-400" />
                    {td.enrolledAsPlayer}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ACTION MESSAGES */}
      {actionError && (
        <div className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.15)]">
          {actionSuccess}
        </div>
      )}

      {/* 2-HOUR CUTOFF COCKPIT COUNTDOWN BANNER */}
      {isCvC && isRegistrationOpen && (
        <div className="relative mt-8 overflow-hidden rounded-3xl border border-accent/40 bg-gradient-to-r from-accent/15 via-surface/85 to-blue-500/10 p-6 md:p-8 backdrop-blur-xl shadow-[0_10px_35px_-10px_rgba(217,165,68,0.25)]">
          {/* Subtle grid texture overlay */}
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Left Description & Cutoff Milestones */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-bg shadow-[0_0_15px_rgba(217,165,68,0.5)]">
                  <ClockIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    {td.cutoffTitle}
                  </h3>
                  <p className="text-xs text-accent-ink font-medium">
                    {format(td.cutoffTimes, {
                      deadline: deadlineTimeLabel,
                      time: startsTimeLabel,
                      date: startsDateLabel,
                    })}
                  </p>
                </div>
              </div>

              <p className="max-w-xl text-xs text-ink-soft leading-relaxed">
                {td.cutoffBodyBefore} <strong>{td.cutoffBodyStrong}</strong>
                {td.cutoffBodyAfter}
              </p>
            </div>

            {/* Right Glowing Digital Timer */}
            {isSubmissionOpen ? (
              <div className="flex items-center gap-3 self-start lg:self-auto rounded-2xl border border-accent/40 bg-black/40 p-4 shadow-[0_0_25px_rgba(0,0,0,0.5)] backdrop-blur-md">
                {countdown.days > 0 && (
                  <>
                    <div className="text-center min-w-[52px]">
                      <div className="font-mono text-2xl sm:text-3xl font-black text-accent-ink drop-shadow-[0_0_10px_rgba(217,165,68,0.5)]">
                        {String(countdown.days).padStart(2, "0")}
                      </div>
                      <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink-faint mt-0.5">{td.days}</div>
                    </div>
                    <span className="font-mono text-2xl font-black text-accent/50">:</span>
                  </>
                )}
                <div className="text-center min-w-[52px]">
                  <div className="font-mono text-2xl sm:text-3xl font-black text-accent-ink drop-shadow-[0_0_10px_rgba(217,165,68,0.5)]">
                    {String(countdown.hours).padStart(2, "0")}
                  </div>
                  <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink-faint mt-0.5">{td.hours}</div>
                </div>
                <span className="font-mono text-2xl font-black text-accent/50">:</span>
                <div className="text-center min-w-[52px]">
                  <div className="font-mono text-2xl sm:text-3xl font-black text-accent-ink drop-shadow-[0_0_10px_rgba(217,165,68,0.5)]">
                    {String(countdown.minutes).padStart(2, "0")}
                  </div>
                  <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink-faint mt-0.5">{td.mins}</div>
                </div>
                <span className="font-mono text-2xl font-black text-accent/50">:</span>
                <div className="text-center min-w-[52px]">
                  <div className="font-mono text-2xl sm:text-3xl font-black text-accent-ink drop-shadow-[0_0_10px_rgba(217,165,68,0.5)]">
                    {String(countdown.seconds).padStart(2, "0")}
                  </div>
                  <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink-faint mt-0.5">{td.secs}</div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-rose-500/40 bg-rose-500/15 px-6 py-3.5 text-center shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                <div className="font-display text-sm font-bold text-rose-300">{td.cutoffClosedTitle}</div>
                <div className="text-xs text-rose-300/80">{td.cutoffClosedBody}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4 COLOR-CODED METRIC STAT TILES */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Format */}
        <div className="group relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-surface/80 to-surface p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/50 hover:shadow-[0_10px_30px_-10px_rgba(59,130,246,0.3)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-blue-300">{td.formatPreset}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.3)]">
              {isCvC ? <UsersIcon className="h-4 w-4" /> : <CrosshairIcon className="h-4 w-4" />}
            </div>
          </div>
          <div className="mt-3 font-display text-lg font-black text-white">
            {isCvC
              ? tournament.preset === "custom"
                ? td.squadCustom
                : format(td.squadPreset, { count: tournament.startersCount })
              : td.match1v1}
          </div>
          <div className="mt-1 text-xs text-blue-200/70">
            {isCvC
              ? format(td.startersSubs, { starters: tournament.startersCount, subs: tournament.subsCount })
              : td.singleKnockout}
          </div>
        </div>

        {/* Metric 2: Entrants Capacity */}
        <div className="group relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-surface/80 to-surface p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/50 hover:shadow-[0_10px_30px_-10px_rgba(168,85,247,0.3)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-purple-300">{td.registeredTeams}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
              <UsersIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-lg font-black text-white">{participantsCount}</span>
            <span className="font-mono text-xs text-ink-faint">{format(td.maxSuffix, { max: tournament.maxParticipants })}</span>
          </div>
          {/* Capacity Progress bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-line">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-500"
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Prize Pool & Financials */}
        <div className="group relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-surface/80 to-surface p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-[0_10px_30px_-10px_rgba(217,165,68,0.3)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent" />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300">{td.prizeFees}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(217,165,68,0.3)]">
              <TrophyIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-display text-lg font-black text-accent-ink">
            {tournament.prizePoolBdt && tournament.prizePoolBdt > 0
              ? `৳ ${tournament.prizePoolBdt.toLocaleString()}`
              : td.friendlyCup}
          </div>
          <div className="mt-1 text-xs text-amber-200/70">
            {tournament.isPaid && tournament.entryFeeBdt && tournament.entryFeeBdt > 0
              ? format(td.entryFeeAmount, { amount: tournament.entryFeeBdt.toLocaleString() })
              : td.freeToEnter}
          </div>
        </div>

        {/* Metric 4: Schedule */}
        <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-surface/80 to-surface p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/50 hover:shadow-[0_10px_30px_-10px_rgba(52,211,153,0.3)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-300">{td.matchSchedule}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]">
              <CalendarIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-display text-lg font-black text-white">
            {startsDateLabel}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-200/70">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <span>{format(td.kickoff, { time: startsTimeLabel, relative: relativeStartLabel })}</span>
          </div>
        </div>
      </div>

      {/* PARTICIPATION / LINEUP ACTION BANNER */}
      <div className="mt-8 rounded-3xl border border-surface-line bg-gradient-to-r from-surface/90 via-surface-line/40 to-surface/90 p-6 md:p-8 backdrop-blur-md shadow-lg">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-bold text-white">
                {isCvC ? td.clubParticipation : td.playerParticipation}
              </h3>
              {isRegistered && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  <CheckIcon className="h-3 w-3" />
                  {td.enrolled}
                </span>
              )}
            </div>
            <p className="text-xs text-ink-soft max-w-xl">
              {isRegistered
                ? isCvC
                  ? myParticipation?.lineup
                    ? td.infoLineupLocked
                    : td.infoClubEnrolled
                  : td.infoPlayerEnrolled
                : isHostingCommunityLeader
                  ? td.infoLeadersCannotJoin
                  : isCvC
                  ? td.infoCvcWhoRegisters
                  : !playerBelongsToCommunity
                    ? td.infoPvpMustBeMember
                    : td.infoPvpRegister}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Join Tournament Button */}
            {canShowJoinAction && !isRegistered && isRegistrationOpen && (
              <>
                {isCvC ? (
                  !user?.club ? (
                    <div className="rounded-xl border border-surface-line bg-surface-raised px-4 py-2 text-xs text-ink-faint">
                      {td.needClub}
                    </div>
                  ) : !canJoinCvC ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300">
                      {format(td.onlyLeadersRegister, { club: user.club.name })}
                    </div>
                  ) : !clubBelongsToCommunity ? (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300">
                      {format(td.clubMustBeMember, { community: tournament.community?.name || td.thisCommunity })}
                    </div>
                  ) : (
                    <button
                      onClick={handleJoinTournament}
                      disabled={joinMutation.isPending}
                      className="rounded-full bg-gradient-to-r from-accent via-amber-400 to-accent px-6 py-3 font-display text-sm font-black text-bg shadow-[0_0_20px_rgba(217,165,68,0.4)] transition-all hover:scale-105 disabled:opacity-40"
                    >
                      {joinMutation.isPending ? td.registeringClub : format(td.registerClub, { club: user.club.name })}
                    </button>
                  )
                ) : (
                  !playerBelongsToCommunity ? (
                    <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-300">
                      <span>{td.pvpMustBelong}</span>
                      <Link
                        href={`/dashboard/efootball/community/${tournament.communityId}`}
                        className="rounded-full bg-rose-500/20 px-3 py-1 font-bold text-rose-200 hover:bg-rose-500/30 transition-colors"
                      >
                        {td.joinCommunity}
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={handleJoinTournament}
                      disabled={joinMutation.isPending}
                      className="rounded-full bg-gradient-to-r from-accent via-amber-400 to-accent px-6 py-3 font-display text-sm font-black text-bg shadow-[0_0_20px_rgba(217,165,68,0.4)] transition-all hover:scale-105 disabled:opacity-40"
                    >
                      {joinMutation.isPending ? td.joining : td.participate}
                    </button>
                  )
                )}
              </>
            )}

            {/* Lineup Submission CTA for CvC */}
            {isRegistered && isCvC && (
              <>
                {myParticipation?.lineup ? (
                  <div className="flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                    <CheckIcon className="h-4 w-4 text-emerald-400" />
                    {format(td.lineupReady, {
                      starters: myParticipation.lineup.starters.length,
                      subs: myParticipation.lineup.substitutes.length,
                    })}
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveTab("lineup")}
                    disabled={!isSubmissionOpen || !canSubmitLineup}
                    className="rounded-full bg-gradient-to-r from-amber-500 to-accent px-6 py-2.5 font-display text-xs font-black text-bg shadow-[0_0_20px_rgba(217,165,68,0.3)] transition-all hover:scale-105 disabled:opacity-40"
                  >
                    {td.buildLineup}
                  </button>
                )}
              </>
            )}

            {/* Organizer Generate Bracket Button */}
            {isOrganizer && (
              <button
                onClick={handleGenerateBracket}
                disabled={
                  generateBracketMutation.isPending ||
                  !tournament.participants ||
                  tournament.participants.length < 2
                }
                className="rounded-full border border-purple-500/40 bg-purple-500/15 px-5 py-2.5 font-display text-xs font-bold text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all hover:bg-purple-500 hover:text-white disabled:opacity-40"
              >
                {generateBracketMutation.isPending
                  ? td.generatingBracket
                  : tournament.bracket
                    ? td.regenerateBracket
                    : td.generateBracket}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS WITH RADIANT ACCENTS */}
      <div className="mt-10 flex border-b border-surface-line">
        <button
          onClick={() => setActiveTab("bracket")}
          className={`flex items-center gap-2.5 border-b-2 px-6 py-3.5 font-display text-sm font-bold transition-all ${
            activeTab === "bracket"
              ? "border-accent text-accent-ink drop-shadow-[0_0_10px_rgba(217,165,68,0.4)]"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          <BracketIcon className="h-4 w-4" />
          <span>{td.tabBracket}</span>
        </button>

        <button
          onClick={() => setActiveTab("participants")}
          className={`flex items-center gap-2.5 border-b-2 px-6 py-3.5 font-display text-sm font-bold transition-all ${
            activeTab === "participants"
              ? "border-accent text-accent-ink drop-shadow-[0_0_10px_rgba(217,165,68,0.4)]"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          <UsersIcon className="h-4 w-4" />
          <span>{td.tabParticipants}</span>
          <span className="rounded-full bg-surface-line px-2 py-0.5 text-xs text-ink-faint">
            {tournament.participants?.length || 0}
          </span>
        </button>

        {isCvC && isRegistered && (
          <button
            onClick={() => setActiveTab("lineup")}
            className={`flex items-center gap-2.5 border-b-2 px-6 py-3.5 font-display text-sm font-bold transition-all ${
              activeTab === "lineup"
                ? "border-accent text-accent-ink drop-shadow-[0_0_10px_rgba(217,165,68,0.4)]"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            <ShieldIcon className="h-4 w-4" />
            <span>{td.tabLineup}</span>
            {myParticipation?.lineup && (
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            )}
          </button>
        )}
      </div>

      {/* TAB CONTENT: BRACKET */}
      {activeTab === "bracket" && (
        <div className="mt-8">
          {tournament.bracket?.rounds && tournament.bracket.rounds.length > 0 ? (
            <div className="overflow-x-auto pb-6">
              <div className="flex min-w-max gap-8">
                {tournament.bracket.rounds.map((round: any) => (
                  <div key={round.round} className="flex w-72 flex-col gap-4">
                    {/* Round Header Badge */}
                    <div className="flex items-center justify-between border-b border-surface-line pb-2.5">
                      <span className="font-mono text-xs font-black uppercase tracking-wider text-accent-ink">
                        {round.roundName}
                      </span>
                      <span className="rounded-full bg-surface-line px-2 py-0.5 font-mono text-[10px] text-ink-faint">
                        {round.matches.length} {round.matches.length === 1 ? td.match : td.matches}
                      </span>
                    </div>

                    {/* Round Matches */}
                    <div className="flex flex-1 flex-col justify-around gap-4">
                      {round.matches.map((m: any) => (
                        <div
                          key={m.id}
                          className="group relative overflow-hidden rounded-2xl border border-surface-line bg-gradient-to-b from-surface/90 to-surface-raised/90 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-accent/40 hover:shadow-[0_8px_25px_-8px_rgba(217,165,68,0.25)]"
                        >
                          {/* Participant A */}
                          <div className="flex items-center justify-between py-1.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-surface-line font-mono text-[10px] font-bold text-ink-soft">
                                {m.participantA?.name?.slice(0, 2).toUpperCase() || "—"}
                              </span>
                              <span
                                className={`truncate text-xs font-semibold ${
                                  m.participantA
                                    ? m.winnerId === m.participantA.id
                                      ? "text-accent-ink font-bold"
                                      : "text-ink"
                                    : "text-ink-faint"
                                }`}
                              >
                                {m.participantA?.name || td.tbdBye}
                              </span>
                            </div>
                            {m.scoreA !== null ? (
                              <span className="font-mono text-xs font-black text-accent-ink">
                                {m.scoreA}
                              </span>
                            ) : null}
                          </div>

                          <div className="my-1.5 h-px bg-surface-line/60" />

                          {/* Participant B */}
                          <div className="flex items-center justify-between py-1.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-surface-line font-mono text-[10px] font-bold text-ink-soft">
                                {m.participantB?.name?.slice(0, 2).toUpperCase() || "—"}
                              </span>
                              <span
                                className={`truncate text-xs font-semibold ${
                                  m.participantB
                                    ? m.winnerId === m.participantB.id
                                      ? "text-accent-ink font-bold"
                                      : "text-ink"
                                    : "text-ink-faint"
                                }`}
                              >
                                {m.participantB?.name || td.tbdBye}
                              </span>
                            </div>
                            {m.scoreB !== null ? (
                              <span className="font-mono text-xs font-black text-accent-ink">
                                {m.scoreB}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-3xl border border-surface-line bg-gradient-to-b from-surface/60 to-surface/30 p-12 text-center backdrop-blur-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent-ink shadow-[0_0_20px_rgba(217,165,68,0.2)]">
                <BracketIcon className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-white">{td.bracketEmptyTitle}</h3>
              <p className="mx-auto mt-1.5 max-w-md text-xs text-ink-soft leading-relaxed">
                {isSubmissionOpen
                  ? td.bracketEmptyOpen
                  : td.bracketEmptyClosed}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PARTICIPANTS */}
      {activeTab === "participants" && (
        <div className="mt-8">
          {tournament.participants && tournament.participants.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tournament.participants.map((p) => {
                const name = isCvC ? p.club?.name || td.clubFallback : p.user?.name || td.playerFallback;
                const hasLineup = Boolean(p.lineup);

                return (
                  <div
                    key={p.id}
                    className="group relative overflow-hidden rounded-2xl border border-surface-line bg-gradient-to-b from-surface/80 to-surface-raised/80 p-5 backdrop-blur-sm transition-all duration-300 hover:border-accent/40 hover:shadow-[0_8px_25px_-8px_rgba(217,165,68,0.2)]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-surface-line font-display text-sm font-black text-accent-ink shadow-sm">
                          {name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-display text-sm font-bold text-white group-hover:text-accent-ink transition-colors">
                            {name}
                          </div>
                          <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
                            {format(td.joinedOn, { date: new Date(p.joinedAt).toLocaleDateString(dateLocale) })}
                          </div>
                        </div>
                      </div>

                      {isCvC && (
                        <span
                          className={`rounded-full px-3 py-1 font-mono text-[10px] font-bold ${
                            hasLineup
                              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                              : "bg-surface-line border border-surface-line-strong text-ink-faint"
                          }`}
                        >
                          {hasLineup ? td.lineupReadyShort : td.awaitingLineup}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={UsersIcon}
              title={td.noEntrantsTitle}
              body={td.noEntrantsBody}
            />
          )}
        </div>
      )}

      {/* TAB CONTENT: LINEUP BUILDER (CvC) */}
      {activeTab === "lineup" && isCvC && (
        <div className="mt-8 rounded-3xl border border-accent/30 bg-gradient-to-b from-surface/90 via-surface-line/20 to-surface/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-surface-line pb-6">
            <div>
              <h3 className="font-display text-lg font-black text-white">
                {td.builderTitle}
              </h3>
              <p className="mt-1 text-xs text-ink-soft">
                {formatNodes(td.requiredSquad, {
                  starters: (
                    <span className="font-bold text-emerald-400">
                      {format(td.startersCount, { count: tournament.startersCount })}
                    </span>
                  ),
                  subs: (
                    <span className="font-bold text-blue-400">
                      {format(td.substitutesCount, { count: tournament.subsCount })}
                    </span>
                  ),
                  total: tournament.startersCount + tournament.subsCount,
                })}
              </p>
            </div>

            {/* Mode Toggle: Preset Squad vs Custom */}
            {isSubmissionOpen && (
              <div className="flex items-center rounded-2xl border border-surface-line-strong bg-black/40 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSubmissionType("preset")}
                  className={`rounded-xl px-4 py-2 font-display text-xs font-bold transition-all ${
                    submissionType === "preset"
                      ? "bg-accent text-bg shadow-[0_0_15px_rgba(217,165,68,0.4)]"
                      : "text-ink-soft hover:text-white"
                  }`}
                >
                  {td.savedSquad}
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionType("custom")}
                  className={`rounded-xl px-4 py-2 font-display text-xs font-bold transition-all ${
                    submissionType === "custom"
                      ? "bg-accent text-bg shadow-[0_0_15px_rgba(217,165,68,0.4)]"
                      : "text-ink-soft hover:text-white"
                  }`}
                >
                  {td.customRoster}
                </button>
              </div>
            )}
          </div>

          {!isSubmissionOpen ? (
            <div className="mt-8 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-center text-xs font-semibold text-rose-300">
              {td.windowClosed}
            </div>
          ) : !canSubmitLineup ? (
            <div className="mt-8 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-center text-xs font-semibold text-amber-300">
              {td.noAuthority}
            </div>
          ) : (
            <div className="mt-8 space-y-8">
              {/* OPTION 1: PICK SAVED CLUB SQUAD PRESET */}
              {submissionType === "preset" ? (
                <div className="space-y-4">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-accent-ink">
                    {td.selectSavedSquad}
                  </span>

                  {clubTeams.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {clubTeams.map((team) => {
                        const isSelected = selectedTeamId === team.id;
                        const starters = team.members.filter((m) => m.lineupStatus === "Starter");
                        const subs = team.members.filter((m) => m.lineupStatus === "Sub");
                        const isValid =
                          starters.length === tournament.startersCount &&
                          subs.length === tournament.subsCount;

                        return (
                          <button
                            key={team.id}
                            type="button"
                            onClick={() => setSelectedTeamId(team.id)}
                            className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 ${
                              isSelected
                                ? "border-accent bg-gradient-to-br from-accent/20 via-surface to-surface shadow-[0_0_25px_rgba(217,165,68,0.25)]"
                                : "border-surface-line bg-surface/60 hover:border-surface-line-strong hover:bg-surface"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-display text-base font-black text-white">
                                {team.name}
                              </div>
                              {isSelected && (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-bg shadow-[0_0_10px_rgba(217,165,68,0.6)]">
                                  <CheckIcon className="h-3.5 w-3.5" />
                                </div>
                              )}
                            </div>

                            <div className="mt-3 flex items-center gap-2 font-mono text-xs text-ink-soft">
                              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300 font-bold">
                                {format(td.startersCount, { count: starters.length })}
                              </span>
                              <span>·</span>
                              <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-blue-300 font-bold">
                                {format(td.subsCount, { count: subs.length })}
                              </span>
                            </div>

                            {!isValid && (
                              <div className="mt-3 text-[11px] font-semibold text-amber-300">
                                {format(td.requires, { starters: tournament.startersCount, subs: tournament.subsCount })}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-surface-line bg-surface/40 p-6 text-xs text-ink-soft">
                      {format(td.noSavedSquads, { club: user?.club?.name ?? "" })}
                    </div>
                  )}
                </div>
              ) : (
                /* OPTION 2: CUSTOM PLAYER SELECTION */
                <div className="space-y-8">
                  {/* Starters Picker */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
                        {format(td.selectStarters, { count: customStarters.length, required: tournament.startersCount })}
                      </span>
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {clubMembers.map((member) => {
                        const isStarter = customStarters.some((s) => s.profileId === member.id);
                        const isSub = customSubs.some((s) => s.profileId === member.id);

                        return (
                          <button
                            key={member.id}
                            type="button"
                            disabled={isSub}
                            onClick={() => {
                              if (isStarter) {
                                setCustomStarters(customStarters.filter((s) => s.profileId !== member.id));
                              } else {
                                if (customStarters.length >= tournament.startersCount) return;
                                setCustomStarters([
                                  ...customStarters,
                                  {
                                    profileId: member.id,
                                    userId: member.userId,
                                    name: member.user?.name || "Player",
                                    gamePosition: member.gamePosition || "CMF",
                                    lineupStatus: "Starter",
                                  },
                                ]);
                              }
                            }}
                            className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs transition-all ${
                              isStarter
                                ? "border-emerald-500 bg-emerald-500/20 text-white font-bold shadow-[0_0_12px_rgba(52,211,153,0.3)]"
                                : isSub
                                  ? "opacity-25 border-surface-line cursor-not-allowed"
                                  : "border-surface-line bg-surface/50 text-ink-soft hover:border-surface-line-strong hover:text-white"
                            }`}
                          >
                            <span className="truncate">{member.user?.name || td.playerFallback}</span>
                            <span className="rounded-md bg-black/40 px-2 py-0.5 font-mono text-[10px] text-accent font-bold">
                              {member.gamePosition || "CMF"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subs Picker */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-blue-400">
                        {format(td.selectSubs, { count: customSubs.length, required: tournament.subsCount })}
                      </span>
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {clubMembers.map((member) => {
                        const isStarter = customStarters.some((s) => s.profileId === member.id);
                        const isSub = customSubs.some((s) => s.profileId === member.id);

                        return (
                          <button
                            key={member.id}
                            type="button"
                            disabled={isStarter}
                            onClick={() => {
                              if (isSub) {
                                setCustomSubs(customSubs.filter((s) => s.profileId !== member.id));
                              } else {
                                if (customSubs.length >= tournament.subsCount) return;
                                setCustomSubs([
                                  ...customSubs,
                                  {
                                    profileId: member.id,
                                    userId: member.userId,
                                    name: member.user?.name || "Player",
                                    gamePosition: member.gamePosition || "SUB",
                                    lineupStatus: "Sub",
                                  },
                                ]);
                              }
                            }}
                            className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs transition-all ${
                              isSub
                                ? "border-blue-500 bg-blue-500/20 text-white font-bold shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                                : isStarter
                                  ? "opacity-25 border-surface-line cursor-not-allowed"
                                  : "border-surface-line bg-surface/50 text-ink-soft hover:border-surface-line-strong hover:text-white"
                            }`}
                          >
                            <span className="truncate">{member.user?.name || td.playerFallback}</span>
                            <span className="rounded-md bg-black/40 px-2 py-0.5 font-mono text-[10px] text-blue-300 font-bold">
                              {member.gamePosition || "SUB"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Official Lineup Action */}
              <div className="pt-6 border-t border-surface-line">
                <button
                  type="button"
                  onClick={handleSubmitLineup}
                  disabled={submitLineupMutation.isPending}
                  className="rounded-full bg-gradient-to-r from-accent via-amber-400 to-accent px-8 py-3.5 font-display text-sm font-black text-bg shadow-[0_0_25px_rgba(217,165,68,0.4)] transition-all hover:scale-105 disabled:opacity-40"
                >
                  {submitLineupMutation.isPending ? td.lockingLineup : td.confirmLineup}
                </button>
              </div>
            </div>
          )}

          {/* Currently Submitted Lineup Preview */}
          {myParticipation?.lineup && (
            <div className="mt-10 border-t border-surface-line pt-8">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-base font-bold text-white">
                  {td.lockedLineup}
                </h4>
                <span className="font-mono text-xs text-emerald-400 font-bold">
                  {td.verifiedSquad}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink-faint">
                {format(td.submittedOn, {
                  date: new Date(myParticipation.lineup.submittedAt).toLocaleString(dateLocale),
                })}
              </p>

              <div className="mt-5 grid gap-6 md:grid-cols-2">
                {/* Starters Column */}
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <div className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center justify-between">
                    <span>{format(td.startingXI, { count: myParticipation.lineup.starters.length })}</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  </div>
                  <div className="grid gap-2">
                    {myParticipation.lineup.starters.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-surface-line bg-surface/80 px-3.5 py-2.5 text-xs"
                      >
                        <span className="font-semibold text-white">{s.name}</span>
                        <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                          {s.gamePosition}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Substitutes Column */}
                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4">
                  <div className="font-mono text-xs font-bold uppercase tracking-wider text-blue-400 mb-3 flex items-center justify-between">
                    <span>{format(td.bench, { count: myParticipation.lineup.substitutes.length })}</span>
                    <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                  </div>
                  <div className="grid gap-2">
                    {myParticipation.lineup.substitutes.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-surface-line bg-surface/80 px-3.5 py-2.5 text-xs"
                      >
                        <span className="font-semibold text-white">{s.name}</span>
                        <span className="rounded-md bg-blue-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-300">
                          {s.gamePosition}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isOrganizer && showEditModal ? (
        <EditTournamentModal
          onClose={() => setShowEditModal(false)}
          onSaved={(message) => {
            setActionError("");
            setActionSuccess(message);
          }}
          tournament={tournament}
        />
      ) : null}
      <ConfirmDialog {...confirmProps} />
    </div>
  );
}
