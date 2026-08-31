"use client";

import { use } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockClubs, useMockPeople, useMockJoinRequests, joinClub, leaveClub } from "@/lib/mock/communityStore";
import { mockCommunities } from "@/lib/mock";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CoverPhoto } from "@/components/common/CoverPhoto";
import { Avatar } from "@/components/common/Avatar";
import { StaffRow } from "@/components/dashboard/StaffRow";
import { RosterTable } from "@/components/dashboard/RosterTable";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { UsersIcon, TrophyIcon } from "@/components/icons";

export default function ClubDetailPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const { t } = useLanguage();
  const { user, setClub } = useSession();
  const clubs = useMockClubs();
  const people = useMockPeople();
  const joinRequests = useMockJoinRequests();

  const club = clubs.find((c) => c.id === clubId);

  if (!club) {
    return <EmptyState icon={UsersIcon} title={t.dashboard.clubs.emptyState} body="" />;
  }

  const members = people.filter((p) => p.clubId === club.id);
  const officials = members.filter((p) => p.clubRole === "President" || p.clubRole === "Manager");
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

  return (
    <div>
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
            <h1 className="font-display text-2xl font-bold text-ink">{club.name}</h1>
            <p className="font-mono text-xs text-ink-faint">{club.points.toLocaleString()} pts</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pb-1">
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

      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-soft">{club.description}</p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="font-display mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
            {t.dashboard.club.staffTitle}
          </h2>
          <StaffRow people={officials} />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-soft">
              {t.dashboard.club.rosterTitle}
            </h2>
            <StatusPill tone={members.length >= club.maxRoster - 1 ? "warning" : "neutral"}>
              {t.dashboard.clubs.rosterSizeLabel}: {members.length}/{club.maxRoster}
            </StatusPill>
          </div>
          <RosterTable roster={members} />
        </section>

        <section>
          <h2 className="font-display mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
            {t.dashboard.club.communitiesTitle}
          </h2>
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
        </section>
      </div>
    </div>
  );
}
