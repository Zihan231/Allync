"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockCommunities, syncFromBackend, hasSyncedFromBackend } from "@/lib/mock/communityStore";
import { mockCommunities } from "@/lib/mock/communities";
import { AppLoader } from "@/components/common/AppLoader";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CoverPhoto } from "@/components/common/CoverPhoto";
import { ClubCrest } from "@/components/common/ClubCrest";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { SectionHeading } from "@/components/dashboard/SectionHeading";
import { Pagination } from "@/components/dashboard/Pagination";
import { PlusIcon, SearchIcon, UsersIcon } from "@/components/icons";

const DEMO_COMMUNITY_IDS = new Set(mockCommunities.map((community) => community.id));

export default function CommunityBrowsePage() {
  const { t } = useLanguage();
  const { user, isLoading: sessionLoading } = useSession();
  const syncedCommunities = useMockCommunities();
  const communities = useMemo(
    () => syncedCommunities.filter((community) => !DEMO_COMMUNITY_IDS.has(community.id)),
    [syncedCommunities],
  );
  const [loading, setLoading] = useState(() => !hasSyncedFromBackend());
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("all");
  const [joinPolicy, setJoinPolicy] = useState("all");
  const [location, setLocation] = useState("all");
  const [rating, setRating] = useState("all");
  const [clubCount, setClubCount] = useState("all");
  const [freeAgents, setFreeAgents] = useState("all");
  const [sort, setSort] = useState("rating");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  useEffect(() => {
    let mounted = true;
    syncFromBackend().finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const myCommunity = user.community ? communities.find((c) => c.id === user.community!.id) : null;
  const otherCommunities = communities.filter((c) => c.id !== user.community?.id);
  const locations = useMemo(
    () => [...new Set(otherCommunities.map((community) => community.location).filter(Boolean))].sort(),
    [otherCommunities],
  );
  const hasFilters =
    tier !== "all" ||
    joinPolicy !== "all" ||
    location !== "all" ||
    rating !== "all" ||
    clubCount !== "all" ||
    freeAgents !== "all" ||
    sort !== "rating";

  function resetFilters() {
    setTier("all");
    setJoinPolicy("all");
    setLocation("all");
    setRating("all");
    setClubCount("all");
    setFreeAgents("all");
    setSort("rating");
    setPage(1);
  }

  const filteredCommunities = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = otherCommunities.filter((c) => {
      const searchableText = `${c.name} ${c.rules || ""} ${c.location || ""}`.toLowerCase();
      return (
        (!q || searchableText.includes(q)) &&
        (tier === "all" || c.tier === tier) &&
        (joinPolicy === "all" || c.joinPolicy === joinPolicy) &&
        (location === "all" || c.location === location) &&
        (rating === "all" || (rating === "2000" ? c.points >= 2000 : c.points >= 3000)) &&
        (clubCount === "all" || (clubCount === "1" ? c.memberClubIds.length >= 1 : c.memberClubIds.length >= 5)) &&
        (freeAgents === "all" || c.freeAgentCount > 0)
      );
    });

    return matches.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "clubs") return b.memberClubIds.length - a.memberClubIds.length;
      return b.points - a.points;
    });
  }, [clubCount, freeAgents, joinPolicy, location, otherCommunities, rating, search, sort, tier]);

  const totalPages = Math.ceil(filteredCommunities.length / PAGE_SIZE) || 1;
  const paginatedCommunities = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredCommunities.slice(start, start + PAGE_SIZE);
  }, [filteredCommunities, page]);

  if (loading || sessionLoading) {
    return <AppLoader />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="eFootball"
        title={t.dashboard.community.browseTitle}
        action={
          !user.community ? (
            <Link
              href="/dashboard/efootball/community/create"
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 font-display text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5"
            >
              <PlusIcon className="h-4 w-4" />
              {t.dashboard.community.createCta}
            </Link>
          ) : null
        }
      />

      {myCommunity ? (
        <div className="mt-8">
          <SectionHeading tone="accent">{t.dashboard.community.myClubHeading}</SectionHeading>
          <CommunityCard community={myCommunity} isMine />
        </div>
      ) : null}

      <div className="mt-8">
        <SectionHeading tone="blue">{t.dashboard.community.allClubsHeading}</SectionHeading>

        <div className="mt-3 relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search communities..."
            className="w-full rounded-lg border border-surface-line-strong bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint"
          />
        </div>

        <div className="mt-4 space-y-4">
          <FilterGroup label="Explore by tier">
            {(["all", "Featured", "Verified", "Regional", "Open", "New"] as const).map((option) => (
              <FilterChip key={option} active={tier === option} onClick={() => { setTier(option); setPage(1); }}>
                {option === "all" ? "All tiers" : option}
              </FilterChip>
            ))}
          </FilterGroup>

          <FilterGroup label="Community features">
            <FilterChip active={joinPolicy === "instant"} onClick={() => { setJoinPolicy(joinPolicy === "instant" ? "all" : "instant"); setPage(1); }}>Instant entry</FilterChip>
            <FilterChip active={joinPolicy === "approval"} onClick={() => { setJoinPolicy(joinPolicy === "approval" ? "all" : "approval"); setPage(1); }}>Approval required</FilterChip>
            <FilterChip active={rating === "2000"} onClick={() => { setRating(rating === "2000" ? "all" : "2000"); setPage(1); }}>2,000+ rating</FilterChip>
            <FilterChip active={rating === "3000"} onClick={() => { setRating(rating === "3000" ? "all" : "3000"); setPage(1); }}>3,000+ rating</FilterChip>
            <FilterChip active={clubCount === "5"} onClick={() => { setClubCount(clubCount === "5" ? "all" : "5"); setPage(1); }}>5+ clubs</FilterChip>
            <FilterChip active={freeAgents === "available"} onClick={() => { setFreeAgents(freeAgents === "available" ? "all" : "available"); setPage(1); }}>Free agents available</FilterChip>
          </FilterGroup>

          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Filter by location" value={location} onChange={(e) => { setLocation(e.target.value); setPage(1); }} className="rounded-full border border-surface-line-strong bg-transparent px-3.5 py-1.5 text-xs font-medium text-ink-soft hover:text-ink">
              <option value="all">All locations</option>
              {locations.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select aria-label="Sort communities" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="rounded-full border border-surface-line-strong bg-transparent px-3.5 py-1.5 text-xs font-medium text-ink-soft hover:text-ink">
              <option value="rating">Highest rating</option>
              <option value="clubs">Most clubs</option>
              <option value="name">Name A–Z</option>
            </select>
            {hasFilters ? <button type="button" onClick={resetFilters} className="px-2 text-xs font-medium text-accent hover:text-accent-ink">Clear filters</button> : null}
          </div>
        </div>

        {filteredCommunities.length === 0 ? (
          <p className="mt-6 text-sm text-ink-soft">No communities found.</p>
        ) : (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedCommunities.map((c) => (
                <CommunityCard key={c.id} community={c} />
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-surface-line pt-6 sm:flex-row">
                <span className="font-mono text-xs text-ink-faint">
                  Showing {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filteredCommunities.length)} of {filteredCommunities.length} communities
                </span>
                <Pagination page={page} pageCount={totalPages} onPageChange={setPage} />
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="font-mono text-xs uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="mt-3 flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
        active ? "border-blue bg-blue-soft text-blue-ink" : "border-surface-line-strong text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function CommunityCard({
  community,
  isMine = false,
}: {
  community: ReturnType<typeof useMockCommunities>[number];
  isMine?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <Link
      href={`/dashboard/efootball/community/${community.id}`}
      className="group block overflow-hidden rounded-xl border border-surface-line bg-surface/40 transition-colors hover:border-surface-line-strong"
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: community.color }} />
      <div className="relative">
        <CoverPhoto
          coverUrl={community.coverUrl}
          name={community.name}
          color={community.color}
          className={isMine ? "h-48 sm:h-64" : "h-40 sm:h-48"}
          mode="static"
        />
        <div
          className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm"
          style={{ boxShadow: `0 0 0 1px ${community.color}66` }}
        >
          <UsersIcon className="h-3.5 w-3.5" style={{ color: community.color }} />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white">
            {t.dashboard.community.entityLabel}
          </span>
        </div>
      </div>
      <div className="flex items-start gap-3 p-4 pt-0">
        <div className="-mt-8 rounded-xl border-4 border-bg bg-surface">
          <ClubCrest
            name={community.name}
            color={community.color}
            initials={community.initials}
            imageUrl={community.dpUrl}
            size="lg"
            shape="square"
          />
        </div>
        <div className="mt-1 min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-ink">{community.name}</span>
            {isMine ? <StatusPill tone="success">{t.dashboard.community.myClubHeading}</StatusPill> : null}
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{community.rules}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-ink-faint">
            <span>{community.tier}</span>
            <span>{community.joinPolicy === "instant" ? "Instant entry" : "Approval required"}</span>
            {community.location ? <span>{community.location}</span> : null}
          </div>
          <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-ink-faint">
            <UsersIcon className="h-3.5 w-3.5" style={{ color: community.color }} />
            {community.points.toLocaleString()} rating · {community.memberClubIds.length} clubs · {community.freeAgentCount} free agents
          </div>
        </div>
      </div>
    </Link>
  );
}
