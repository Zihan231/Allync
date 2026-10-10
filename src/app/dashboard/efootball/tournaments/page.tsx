"use client";

import { Suspense, useMemo, useState, type ComponentType } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format, formatNodes } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import { useTournaments } from "@/lib/api/hooks/useTournaments";
import type { BackendTournament, TournamentType } from "@/lib/api/tournaments";
import { useUrlTab } from "@/lib/navigation/useUrlTab";
import { AppLoader } from "@/components/common/AppLoader";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TournamentCard } from "@/components/dashboard/TournamentCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Pagination } from "@/components/dashboard/Pagination";
import {
  TrophyIcon,
  FlameIcon,
  WalletIcon,
  UsersIcon,
  CrosshairIcon,
  SearchIcon,
  ShieldIcon,
  CheckIcon,
  CloseIcon,
} from "@/components/icons";

const PAGE_SIZE = 9;
const TOURNAMENT_TABS: readonly TournamentType[] = ["cvc", "pvp"];

type StatusFilter = "all" | "upcoming" | "live" | "completed";
type RelationFilter = "all" | "hosted" | "joined";
type FeeFilter = "all" | "free" | "paid";
type PrizeFilter = "all" | "with_prize" | "friendly";
type PlatformFilter = "all" | "mobile" | "console";
type SortKey = "status" | "recent" | "prize" | "platform";

interface Filters {
  search: string;
  status: StatusFilter;
  relation: RelationFilter;
  fee: FeeFilter;
  prize: PrizeFilter;
  platform: PlatformFilter;
}

const DEFAULT_FILTERS: Filters = { search: "", status: "all", relation: "all", fee: "all", prize: "all", platform: "all" };

/** Upcoming (registration / pre-start), live, or history (completed / cancelled). */
function statusGroup(status: string | undefined): Exclude<StatusFilter, "all"> {
  const s = (status ?? "").toLowerCase();
  if (s === "ongoing" || s === "live") return "live";
  if (s === "completed" || s === "cancelled") return "completed";
  return "upcoming";
}

const isPaid = (tour: BackendTournament) => (tour.entryFeeBdt ?? 0) > 0;
const hasPrize = (tour: BackendTournament) => (tour.prizePoolBdt ?? 0) > 0;
const startMs = (tour: BackendTournament) => new Date(tour.startAt).getTime() || 0;
const platformOf = (tour: BackendTournament) => tour.platform ?? "mobile";

/** Does `tour` pass every filter, except the one named in `skip` (used for per-option counts)? */
function matches(tour: BackendTournament, f: Filters, skip?: keyof Filters): boolean {
  if (skip !== "status" && f.status !== "all" && statusGroup(tour.status) !== f.status) return false;
  if (skip !== "relation" && f.relation === "hosted" && !tour.hostedByMe) return false;
  if (skip !== "relation" && f.relation === "joined" && !tour.joinedByMe) return false;
  if (skip !== "fee" && f.fee === "free" && isPaid(tour)) return false;
  if (skip !== "fee" && f.fee === "paid" && !isPaid(tour)) return false;
  if (skip !== "prize" && f.prize === "with_prize" && !hasPrize(tour)) return false;
  if (skip !== "prize" && f.prize === "friendly" && hasPrize(tour)) return false;
  if (skip !== "platform" && f.platform !== "all" && platformOf(tour) !== f.platform) return false;
  const query = f.search.trim().toLowerCase();
  if (skip !== "search" && query) {
    const inName = tour.name?.toLowerCase().includes(query);
    const inCommunity = tour.community?.name?.toLowerCase().includes(query);
    if (!inName && !inCommunity) return false;
  }
  return true;
}

const STATUS_RANK = { live: 0, upcoming: 1, completed: 2 } as const;

function sortTournaments(list: BackendTournament[], sort: SortKey): BackendTournament[] {
  return [...list].sort((a, b) => {
    // Console first, then the usual status order within each platform.
    if (sort === "platform" && platformOf(a) !== platformOf(b)) return platformOf(a) === "console" ? -1 : 1;
    if (sort === "prize") return (b.prizePoolBdt ?? 0) - (a.prizePoolBdt ?? 0) || startMs(b) - startMs(a);
    if (sort === "recent") return startMs(b) - startMs(a);
    // Live first, then upcoming (soonest first), then history (most recent first).
    const ga = statusGroup(a.status);
    const gb = statusGroup(b.status);
    if (ga !== gb) return STATUS_RANK[ga] - STATUS_RANK[gb];
    return ga === "completed" ? startMs(b) - startMs(a) : startMs(a) - startMs(b);
  });
}

// Theme tokens only (see globals.css). Full class strings so Tailwind picks them up.
const STAT_TONES = {
  blue: {
    card: "border-blue/30 from-blue/[0.12]",
    bar: "bg-blue",
    icon: "bg-blue text-bg shadow-[0_6px_18px_-6px_rgba(76,141,255,0.8)]",
    value: "text-blue-ink",
  },
  danger: {
    card: "border-danger/30 from-danger/[0.12]",
    bar: "bg-danger",
    icon: "bg-danger text-white shadow-[0_6px_18px_-6px_rgba(244,63,94,0.8)]",
    value: "text-danger-ink",
  },
  success: {
    card: "border-success/30 from-success/[0.12]",
    bar: "bg-success",
    icon: "bg-success text-bg shadow-[0_6px_18px_-6px_rgba(52,211,153,0.75)]",
    value: "text-success-ink",
  },
  neutral: {
    card: "border-surface-line-strong from-ink-soft/[0.08]",
    bar: "bg-ink-soft",
    icon: "bg-surface-line-strong text-ink",
    value: "text-ink",
  },
  accent: {
    card: "border-accent/35 from-accent/[0.14]",
    bar: "bg-accent",
    icon: "bg-accent text-bg shadow-[0_6px_18px_-6px_rgba(217,165,68,0.85)]",
    value: "text-accent-ink",
  },
} as const;

function StatCard({
  tone,
  label,
  value,
  icon: Icon,
  pulse = false,
  wide = false,
}: {
  tone: keyof typeof STAT_TONES;
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  pulse?: boolean;
  /** Spans the full row on the two-column (small screen) layout. */
  wide?: boolean;
}) {
  const styles = STAT_TONES[tone];
  return (
    <div
      className={`relative flex min-w-0 items-center justify-between gap-3 overflow-hidden rounded-2xl border bg-gradient-to-r to-surface/40 py-3.5 pl-5 pr-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)] ${styles.card} ${
        wide ? "col-span-2 lg:col-span-1" : ""
      }`}
    >
      <span aria-hidden className={`absolute inset-y-3 left-0 w-1 rounded-r-full ${styles.bar}`} />
      <div className="min-w-0">
        <div className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint" title={label}>
          {label}
        </div>
        <div className={`mt-1.5 flex items-center gap-2 font-display text-2xl font-black leading-none ${styles.value}`}>
          <span className="truncate">{value}</span>
          {pulse ? (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inset-0 animate-ping rounded-full bg-danger/70" />
              <span className="relative h-2 w-2 rounded-full bg-danger" />
            </span>
          ) : null}
        </div>
      </div>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>
        <Icon className="h-5 w-5" />
      </span>
    </div>
  );
}

export default function TournamentsPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <TournamentsContent />
    </Suspense>
  );
}

function TournamentsContent() {
  const { t } = useLanguage();
  const m = t.dashboard.myTournaments;
  const { user, isLoading: isSessionLoading } = useSession();
  const [activeTab, setActiveTab] = useUrlTab(TOURNAMENT_TABS, "cvc");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>("status");
  const [page, setPage] = useState(1);

  // The user's tournaments (both types), filtered on the server: ones they (or their club)
  // entered, plus — for community Presidents / Vice Presidents — every tournament their
  // community hosts.
  const { data: scopedTournaments, isLoading } = useTournaments(
    { scope: "mine" },
    isSessionLoading ? null : user?.id,
  );
  // Guard: keep only rows the server marked as the viewer's, so a server that ignores
  // `scope` (e.g. an outdated build) can't list everyone's tournaments here.
  const myTournaments = useMemo(
    () => (scopedTournaments ?? []).filter((tour) => tour.hostedByMe || tour.joinedByMe),
    [scopedTournaments],
  );
  const typeCounts = {
    cvc: myTournaments.filter((tour) => tour.type === "cvc").length,
    pvp: myTournaments.filter((tour) => tour.type === "pvp").length,
  };
  const tabTournaments = useMemo(
    () => myTournaments.filter((tour) => tour.type === activeTab),
    [myTournaments, activeTab],
  );
  const hostsTournaments = myTournaments.some((tour) => tour.hostedByMe);

  const filtered = useMemo(
    () => sortTournaments(tabTournaments.filter((tour) => matches(tour, filters)), sort),
    [tabTournaments, filters, sort],
  );

  // Each option's count applies every other active filter, so it's what clicking it shows.
  const countFor = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    tabTournaments.filter((tour) => matches(tour, { ...filters, [key]: value }, undefined)).length;

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Overview of the active tab (independent of the filters below).
  const stats = useMemo(
    () => ({
      hosted: tabTournaments.filter((tour) => tour.hostedByMe).length,
      live: tabTournaments.filter((tour) => statusGroup(tour.status) === "live").length,
      open: tabTournaments.filter((tour) => tour.status === "open" || tour.status === "registration_open").length,
      completed: tabTournaments.filter((tour) => statusGroup(tour.status) === "completed").length,
      prizePool: tabTournaments.reduce((sum, tour) => sum + (tour.prizePoolBdt ?? 0), 0),
    }),
    [tabTournaments],
  );

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }
  const activeFilterCount = (Object.keys(DEFAULT_FILTERS) as Array<keyof Filters>).filter(
    (key) => filters[key].trim() !== DEFAULT_FILTERS[key],
  ).length;
  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  function handleTabChange(tab: TournamentType) {
    setActiveTab(tab);
    setPage(1);
  }

  const pill = (active: boolean) =>
    `rounded-md px-2.5 py-1 font-medium transition-colors ${active ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"}`;
  const group = "flex flex-wrap items-center rounded-lg border border-surface-line bg-surface/50 p-1 text-xs";

  const optionGroup = <K extends keyof Filters>(key: K, options: ReadonlyArray<readonly [Filters[K], string]>) => (
    <div className={group}>
      {options.map(([value, label]) => (
        <button key={String(value)} type="button" onClick={() => updateFilter(key, value)} className={pill(filters[key] === value)}>
          {label} <span className="opacity-70">({countFor(key, value)})</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="relative">
      <div className="glow-gold pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[600px] -translate-x-1/2 blur-[100px] opacity-30" />

      <PageHeader eyebrow={m.eyebrow} title={t.dashboard.shell.navMyTournaments} />

      {/* Stats row (active tab): each stat has its own colour so they read at a glance */}
      <div className={`mt-8 grid grid-cols-2 gap-3 sm:gap-4 ${hostsTournaments ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        {hostsTournaments ? (
          <StatCard tone="blue" label={m.statHosted} value={String(stats.hosted)} icon={ShieldIcon} />
        ) : null}
        <StatCard
          tone="danger"
          label={t.dashboard.tournaments.liveNowLabel}
          value={String(stats.live)}
          icon={FlameIcon}
          pulse={stats.live > 0}
        />
        <StatCard tone="success" label={t.dashboard.tournaments.openForEntryLabel} value={String(stats.open)} icon={TrophyIcon} />
        <StatCard tone="neutral" label={m.statCompleted} value={String(stats.completed)} icon={CheckIcon} />
        <StatCard
          tone="accent"
          label={t.dashboard.tournaments.totalPrizePoolLabel}
          value={`৳ ${stats.prizePool.toLocaleString()}`}
          icon={WalletIcon}
          wide
        />
      </div>

      {/* Top Tabs: Club Tournaments (CvC) vs Player Tournaments (PvP) */}
      <div className="mt-8 flex overflow-x-auto border-b border-surface-line">
        {(
          [
            ["cvc", m.tabCvc, UsersIcon],
            ["pvp", m.tabPvp, CrosshairIcon],
          ] as const
        ).map(([tab, label, Icon]) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTabChange(tab)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-6 py-3 font-display text-sm font-semibold transition-colors ${
              activeTab === tab ? "border-accent text-accent-ink" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab ? "bg-accent/20 text-accent-ink" : "bg-surface-line text-ink-faint"
              }`}
            >
              {typeCounts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Status (upcoming / live / history) and — for hosts — hosted vs joined */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {optionGroup("status", [
          ["all", m.statusAll],
          ["upcoming", m.statusUpcoming],
          ["live", m.statusLive],
          ["completed", m.statusCompleted],
        ])}
        {hostsTournaments
          ? optionGroup("relation", [
              ["all", m.relationAll],
              ["hosted", m.relationHosted],
              ["joined", m.relationJoined],
            ])
          : null}
      </div>

      {/* Search, fee / prize filters and sorting */}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder={m.searchPlaceholder}
            className="w-full rounded-xl border border-surface-line bg-surface/60 py-2 pl-10 pr-9 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
          {filters.search ? (
            <button
              type="button"
              onClick={() => updateFilter("search", "")}
              aria-label={m.clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-faint hover:text-ink"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {optionGroup("fee", [
            ["all", m.feeAll],
            ["free", m.feeFree],
            ["paid", m.feePaid],
          ])}
          {optionGroup("prize", [
            ["all", m.prizeAll],
            ["with_prize", m.prizeWith],
            ["friendly", m.prizeFriendly],
          ])}
          {optionGroup("platform", [
            ["all", m.platformAll],
            ["mobile", m.platformMobile],
            ["console", m.platformConsole],
          ])}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setPage(1);
            }}
            aria-label={m.sortLabel}
            className="rounded-lg border border-surface-line bg-surface px-3 py-1.5 text-xs text-ink-soft outline-none focus:border-accent [color-scheme:dark]"
          >
            <option value="status">{m.sortStatus}</option>
            <option value="recent">{m.sortRecent}</option>
            <option value="prize">{m.sortPrize}</option>
            <option value="platform">{m.sortPlatform}</option>
          </select>
        </div>
      </div>

      {/* Result summary */}
      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-ink-faint">
        <span>
          {formatNodes(m.showing, {
            shown: <strong className="text-ink">{filtered.length}</strong>,
            total: tabTournaments.length,
          })}
        </span>
        {activeFilterCount ? (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 rounded-full border border-surface-line-strong px-3 py-1 font-semibold text-ink-soft transition-colors hover:border-accent hover:text-accent-ink"
          >
            <CloseIcon className="h-3 w-3" />
            {format(m.clearFilters, { count: activeFilterCount })}
          </button>
        ) : null}
      </div>

      {/* Tournament Cards Grid */}
      <div className="mt-4">
        {isLoading || isSessionLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : filtered.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((tour) => (
                <TournamentCard key={tour.id} tournament={tour} href={`/dashboard/efootball/tournaments/${tour.id}`} />
              ))}
            </div>
            {pageCount > 1 && (
              <div className="mt-8">
                <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={TrophyIcon}
            title={activeTab === "cvc" ? m.emptyCvc : m.emptyPvp}
            body={activeFilterCount ? m.emptyFiltered : m.emptyBody}
          />
        )}
      </div>
    </div>
  );
}
