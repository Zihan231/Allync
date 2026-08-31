"use client";

import { use } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockPeople, useMockClubs, useMockCommunities } from "@/lib/mock/communityStore";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CoverPhoto } from "@/components/common/CoverPhoto";
import { Avatar } from "@/components/common/Avatar";
import { RankBadge } from "@/components/dashboard/RankBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { UsersIcon } from "@/components/icons";

export default function PlayerProfilePage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = use(params);
  const { t } = useLanguage();
  const people = useMockPeople();
  const clubs = useMockClubs();
  const communities = useMockCommunities();

  const person = people.find((p) => p.id === playerId);

  if (!person) {
    return <EmptyState icon={UsersIcon} title={t.dashboard.players.notFound} body="" />;
  }

  const club = person.clubId ? clubs.find((c) => c.id === person.clubId) : null;
  const community = person.communityId ? communities.find((c) => c.id === person.communityId) : null;
  const rank = [...people].sort((a, b) => b.points - a.points).findIndex((p) => p.id === person.id) + 1;

  return (
    <div>
      <CoverPhoto coverUrl={person.coverUrl} name={person.name} className="h-56 rounded-xl sm:h-72 lg:h-80" />

      <div className="-mt-14 flex items-end gap-4 px-1 sm:-mt-16">
        <div className="rounded-full border-4 border-bg bg-surface">
          <Avatar dpUrl={person.dpUrl} name={person.name} size="xl" mode="lightbox" />
        </div>
        <div className="pb-1">
          <h1 className="font-display text-2xl font-bold text-ink">{person.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <RankBadge rank={rank} />
            <span className="font-mono text-xs text-ink-faint">{person.points.toLocaleString()} {t.dashboard.players.rankLabel.toLowerCase()}</span>
          </div>
        </div>
      </div>

      {person.bio ? <p className="mt-6 max-w-xl text-sm leading-relaxed text-ink-soft">{person.bio}</p> : null}

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-surface-line bg-surface/40 p-4">
          <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
            {t.dashboard.players.clubLabel}
          </div>
          {club ? (
            <Link href={`/dashboard/efootball/clubs/${club.id}`} className="mt-2 flex items-center gap-2.5">
              <Avatar dpUrl={club.dpUrl} name={club.name} size="sm" mode="static" />
              <span className="text-sm font-medium text-ink">
                {club.name} · {person.clubRole}
              </span>
            </Link>
          ) : (
            <p className="mt-2 text-sm text-ink-faint">{t.dashboard.players.noAffiliation}</p>
          )}
        </div>

        <div className="rounded-xl border border-surface-line bg-surface/40 p-4">
          <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
            {t.dashboard.players.communityLabel}
          </div>
          {community ? (
            <Link href={`/dashboard/efootball/community/${community.id}`} className="mt-2 flex items-center gap-2.5">
              <Avatar dpUrl={community.dpUrl} name={community.name} size="sm" mode="static" />
              <span className="text-sm font-medium text-ink">
                {community.name} · {person.communityRole}
              </span>
            </Link>
          ) : (
            <p className="mt-2 text-sm text-ink-faint">{t.dashboard.players.noAffiliation}</p>
          )}
        </div>
      </div>
    </div>
  );
}
