"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMyGames } from "@/lib/api/hooks/useTournaments";
import type { MyGameHostKind, MyGameState } from "@/lib/api/tournaments";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatTile } from "@/components/dashboard/StatTile";
import { MyGameCard } from "@/components/dashboard/MyGameCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Pagination } from "@/components/dashboard/Pagination";
import { AppLoader } from "@/components/common/AppLoader";
import { BellIcon, CalendarIcon, ClockIcon, GavelIcon, SearchIcon, ShieldIcon, TrophyIcon, UsersIcon } from "@/components/icons";

const PAGE_SIZE = 6;
const STATES: MyGameState[] = ["to_play", "waiting", "review", "finished"];
const SEGMENTS = ["all", "club", "community"] as const;
type Segment = (typeof SEGMENTS)[number];

/**
 * The signed-in player's games across every tournament, split by host
 * (club / community tournaments), with search, a state filter and pages.
 * Filters live in the URL so they survive opening a match and coming back.
 */
export default function MatchesPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <MatchesContent />
    </Suspense>
  );
}

function MatchesContent() {
  const { t } = useLanguage();
  const mm = t.dashboard.myMatches;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const segmentParam = searchParams.get("segment");
  const segment: Segment = SEGMENTS.includes(segmentParam as Segment) ? (segmentParam as Segment) : "all";
  const host: MyGameHostKind | undefined = segment === "all" ? undefined : segment;
  const hostId = host ? searchParams.get("host") || undefined : undefined;
  const stateParam = searchParams.get("state");
  const state = STATES.includes(stateParam as MyGameState) ? (stateParam as MyGameState) : undefined;
  const search = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  /** Updates the URL filters; any change other than the page goes back to page 1. */
  const setParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!("page" in changes)) next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Search box: typed text is applied to the URL once typing pauses.
  const [searchInput, setSearchInput] = useState(search);
  const [syncedSearch, setSyncedSearch] = useState(search);
  if (search !== syncedSearch) {
    setSyncedSearch(search);
    setSearchInput(search);
  }
  useEffect(() => {
    if (searchInput.trim() === search) return;
    const timer = window.setTimeout(() => setParams({ q: searchInput.trim() || null }), 300);
    return () => window.clearTimeout(timer);
    // setParams is rebuilt each render; the timer only needs the typed text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, search]);

  const { data, isLoading, isFetching, isError, refetch } = useMyGames({
    host,
    hostId,
    state,
    search: search || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const facets = data?.facets;
  const games = data?.data ?? [];
  const pageCount = data?.meta.totalPages ?? 1;
  const hasFilters = Boolean(host || state || search);
  const hostOptions = (facets?.hosts ?? []).filter((h) => h.kind === host);

  const stateLabel: Record<MyGameState, string> = {
    to_play: mm.stateToPlay,
    waiting: mm.stateWaiting,
    review: mm.stateReview,
    finished: mm.stateFinished,
  };
  const segmentLabel: Record<Segment, string> = {
    all: mm.segmentAll,
    club: mm.segmentClub,
    community: mm.segmentCommunity,
  };
  const segmentCount = (s: Segment) =>
    !facets ? null : s === "all" ? facets.hostKinds.club + facets.hostKinds.community : facets.hostKinds[s];
  const stateTotal = facets ? STATES.reduce((sum, s) => sum + facets.states[s], 0) : null;

  return (
    <div className="relative">
      <div className="glow-blue pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[600px] -translate-x-1/2 blur-[100px] opacity-30" />

      <PageHeader eyebrow="eFootball" title={t.dashboard.shell.navMatches} />

      {/* Counts for the chosen segment (and search) */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label={mm.stateToPlay} value={facets ? String(facets.states.to_play) : "–"} icon={BellIcon} />
        <StatTile label={mm.stateWaiting} value={facets ? String(facets.states.waiting) : "–"} icon={ClockIcon} />
        <StatTile label={mm.stateReview} value={facets ? String(facets.states.review) : "–"} icon={GavelIcon} />
        <StatTile label={mm.stateFinished} value={facets ? String(facets.states.finished) : "–"} icon={TrophyIcon} />
      </div>

      {/* Segments: all / club tournaments / community tournaments */}
      <div className="mt-8 flex border-b border-surface-line" role="tablist">
        {SEGMENTS.map((s) => {
          const Icon = s === "club" ? ShieldIcon : s === "community" ? UsersIcon : CalendarIcon;
          const count = segmentCount(s);
          return (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={segment === s}
              onClick={() => setParams({ segment: s === "all" ? null : s, host: null })}
              className={`-mb-px flex min-w-0 items-center gap-2 border-b-2 px-3 py-3 font-display text-sm font-semibold transition-colors sm:px-5 ${
                segment === s ? "border-accent text-accent-ink" : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              <Icon className="hidden h-4 w-4 shrink-0 sm:block" />
              <span className="truncate">{segmentLabel[s]}</span>
              {count !== null ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                    segment === s ? "bg-accent text-bg" : "bg-surface-line text-ink-faint"
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Search and host */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={mm.searchPlaceholder}
            aria-label={mm.searchPlaceholder}
            className="w-full rounded-xl border border-surface-line bg-surface/60 py-2.5 pl-10 pr-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-accent"
          />
        </div>
        {host ? (
          <select
            value={hostId ?? ""}
            onChange={(e) => setParams({ host: e.target.value || null })}
            aria-label={mm.hostFilterLabel}
            className="rounded-xl border border-surface-line bg-surface/60 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent sm:w-64 [color-scheme:dark]"
          >
            <option value="">{host === "club" ? mm.allClubs : mm.allCommunities}</option>
            {hostOptions.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.count})
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {/* State filter */}
      <div className="mt-4 flex flex-wrap gap-2">
        {([undefined, ...STATES] as const).map((s) => {
          const active = state === s;
          const count = !facets ? null : s ? facets.states[s] : stateTotal;
          return (
            <button
              key={s ?? "all"}
              type="button"
              onClick={() => setParams({ state: s ?? null })}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active ? "border-accent bg-accent-soft text-accent-ink" : "border-surface-line-strong text-ink-soft hover:text-ink"
              }`}
            >
              {s ? stateLabel[s] : mm.stateAll}
              {count !== null ? <span className="font-mono text-[11px] opacity-70">{count}</span> : null}
            </button>
          );
        })}
      </div>

      {/* Games */}
      <div className={`mt-6 transition-opacity ${isFetching && !isLoading ? "opacity-60" : ""}`}>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl border border-surface-line bg-surface/40" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-danger/35 bg-danger-soft/20 p-6 text-center">
            <p className="text-sm text-danger-ink">{mm.loadError}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 rounded-full border border-surface-line-strong px-4 py-1.5 text-sm font-semibold text-ink"
            >
              {mm.retry}
            </button>
          </div>
        ) : games.length ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {games.map((game) => (
                <MyGameCard key={game.id} game={game} />
              ))}
            </div>
            {pageCount > 1 ? (
              <div className="mt-6">
                <Pagination
                  page={page}
                  pageCount={pageCount}
                  onPageChange={(p) => setParams({ page: p > 1 ? String(p) : null })}
                />
              </div>
            ) : null}
          </>
        ) : hasFilters ? (
          <div className="text-center">
            <EmptyState icon={SearchIcon} title={mm.emptyFilteredTitle} body={mm.emptyFilteredBody} />
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                router.replace(pathname, { scroll: false });
              }}
              className="mt-4 rounded-full border border-surface-line-strong px-4 py-1.5 text-sm font-semibold text-ink"
            >
              {mm.clearFilters}
            </button>
          </div>
        ) : (
          <EmptyState icon={CalendarIcon} title={mm.emptyTitle} body={mm.emptyBody} />
        )}
      </div>
    </div>
  );
}
