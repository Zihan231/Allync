"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Club, Community } from "@/lib/mock/types";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { useClubRankings } from "@/lib/api/hooks/useStats";
import { Avatar } from "../common/Avatar";
import { EmptyState } from "./EmptyState";
import { SearchIcon, TrophyIcon, UsersIcon } from "../icons";

type Person = ReturnType<typeof useMockPeople>[number];

export function CommunityClubsTab({
  community,
  memberClubs,
  allPeople,
}: {
  community: Community;
  memberClubs: Club[];
  allPeople: Person[];
}) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");

  // Member clubs' real ranks: global rank from the stats API, community rank = order among the ranked members.
  const { data: clubStats } = useClubRankings({ communityId: community.id, limit: 100 });
  const rankingById = useMemo(() => {
    const ranked = (clubStats?.data ?? []).filter((r) => r.rank != null);
    return new Map(ranked.map((r, i) => [r.id, { rank: r.rank, communityRank: i + 1 }]));
  }, [clubStats]);
  const memberCounts = useMemo(
    () => new Map(memberClubs.map((club) => [club.id, allPeople.filter((p) => p.clubId === club.id).length])),
    [memberClubs, allPeople]
  );

  const filtered = memberClubs.filter((club) => {
    const q = search.trim().toLowerCase();
    if (q && !club.name.toLowerCase().includes(q)) return false;
    return true;
  });


  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.dashboard.community.searchPlaceholder}
            className="w-full rounded-lg border border-surface-line-strong bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={UsersIcon} title={t.dashboard.rankings.noResults} body="" />
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((club) => {
            const r = rankingById.get(club.id);
            return (
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
                      {t.dashboard.community.communityRankLabel} #{r?.communityRank ?? "—"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[10px] font-bold text-accent-ink">
                      {t.dashboard.community.globalRankLabel} #{r?.rank ?? "—"}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
