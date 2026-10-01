"use client";

import { Suspense, useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockCommunities } from "@/lib/mock/communityStore";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { LeaderboardTable } from "@/components/dashboard/LeaderboardTable";
import { PlayerRankingsTable } from "@/components/dashboard/PlayerRankingsTable";
import { ClubRankingsTable } from "@/components/dashboard/ClubRankingsTable";
import { Pagination } from "@/components/dashboard/Pagination";
import { StatsInfoPanel } from "@/components/dashboard/StatsInfoPanel";
import { SearchIcon } from "@/components/icons";
import { AppLoader } from "@/components/common/AppLoader";
import { useUrlTab } from "@/lib/navigation/useUrlTab";
import { useClubRankings, usePlayerRankings } from "@/lib/api/hooks/useStats";
import { STATS_PERIODS, type StatsPeriod } from "@/lib/api/stats";

type Tab = "players" | "clubs" | "communities";
const RANKING_TABS: readonly Tab[] = ["players", "clubs", "communities"];
const PAGE_SIZE = 20;

export default function RankingsPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <RankingsContent />
    </Suspense>
  );
}

function RankingsContent() {
  const { t } = useLanguage();
  const [tab, setTab] = useUrlTab(RANKING_TABS, "players");
  const communities = useMockCommunities();

  const tabs: { key: Tab; label: string }[] = [
    { key: "players", label: t.dashboard.rankings.tabPlayers },
    { key: "clubs", label: t.dashboard.rankings.tabClubs },
    { key: "communities", label: t.dashboard.rankings.tabCommunities },
  ];

  const communityRows = [...communities]
    .sort((a, b) => b.points - a.points)
    .map((c) => ({ id: c.id, name: c.name, dpUrl: c.dpUrl, points: c.points }));

  return (
    <div>
      <PageHeader eyebrow="eFootball" title={t.dashboard.rankings.pageTitle} />

      <div className="mt-6 flex gap-2">
        {tabs.map((tb) => (
          <button
            key={tb.key}
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

      <div className="mt-6">
        {tab === "players" ? (
          <PlayersRankingsPanel />
        ) : tab === "clubs" ? (
          <ClubsRankingsPanel />
        ) : (
          <LeaderboardTable rows={communityRows} hrefBuilder={(id) => `/dashboard/efootball/community/${id}`} />
        )}
      </div>
    </div>
  );
}

/** Period pills + search box shared by the player and club panels; search applies once typing pauses. */
function useRankingControls() {
  const [period, setPeriod] = useState<StatsPeriod>("all-time");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const choosePeriod = (next: StatsPeriod) => {
    setPeriod(next);
    setPage(1);
  };

  return { period, choosePeriod, searchInput, setSearchInput, search, page, setPage };
}

function Controls({
  period,
  onPeriod,
  searchInput,
  onSearch,
  placeholder,
}: {
  period: StatsPeriod;
  onPeriod: (p: StatsPeriod) => void;
  searchInput: string;
  onSearch: (v: string) => void;
  placeholder: string;
}) {
  const { t } = useLanguage();
  const r = t.dashboard.rankings;
  const periodLabel: Record<StatsPeriod, string> = {
    "all-time": r.periodAllTime,
    "this-week": r.periodThisWeek,
    "last-week": r.periodLastWeek,
    "this-month": r.periodThisMonth,
    "last-month": r.periodLastMonth,
  };
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="flex flex-wrap gap-2">
        {STATS_PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPeriod(p)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              period === p ? "border-blue bg-blue-soft text-blue-ink" : "border-surface-line-strong text-ink-soft hover:text-ink"
            }`}
          >
            {periodLabel[p]}
          </button>
        ))}
      </div>
      <div className="relative lg:ml-auto lg:w-72">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full rounded-xl border border-surface-line bg-surface/60 py-2 pl-10 pr-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-accent"
        />
      </div>
    </div>
  );
}

function ListState({
  isLoading,
  isError,
  onRetry,
  isEmpty,
  emptyText,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  isEmpty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  if (isLoading) return <div className="h-64 animate-pulse rounded-xl border border-surface-line bg-surface/40" />;
  if (isError)
    return (
      <div className="rounded-xl border border-danger/35 bg-danger-soft/20 p-6 text-center">
        <p className="text-sm text-danger-ink">{t.dashboard.rankings.loadError}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-full border border-surface-line-strong px-4 py-1.5 text-sm font-semibold text-ink"
        >
          {t.dashboard.rankings.retry}
        </button>
      </div>
    );
  if (isEmpty) return <p className="rounded-xl border border-dashed border-surface-line p-6 text-center text-sm text-ink-soft">{emptyText}</p>;
  return <>{children}</>;
}

function AbbreviationsPanel() {
  const { t } = useLanguage();
  return (
    <div className="rounded-xl border border-surface-line bg-surface/30 p-5">
      <h3 className="font-display text-sm font-bold text-ink">{t.dashboard.rankings.abbreviationsTitle}</h3>
      <p className="mt-2 text-xs leading-relaxed text-ink-faint">{t.dashboard.rankings.abbreviationsText}</p>
    </div>
  );
}

function PlayersRankingsPanel() {
  const { t } = useLanguage();
  const r = t.dashboard.rankings;
  const c = useRankingControls();
  const { data, isLoading, isFetching, isError, refetch } = usePlayerRankings({
    period: c.period,
    search: c.search || undefined,
    page: c.page,
    limit: PAGE_SIZE,
  });

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-ink">
        {r.playerRankingsTitle}
        {data ? <span className="ml-2 text-sm font-medium text-ink-faint">({data.meta.total.toLocaleString()} {r.playersSuffix})</span> : null}
      </h2>
      <div className="mt-3">
        <Controls
          period={c.period}
          onPeriod={c.choosePeriod}
          searchInput={c.searchInput}
          onSearch={c.setSearchInput}
          placeholder={r.searchPlayerPlaceholder}
        />
      </div>
      <StatsInfoPanel variant="players" className="mt-4" />
      <div className={`mt-5 space-y-5 transition-opacity ${isFetching && !isLoading ? "opacity-60" : ""}`}>
        <ListState
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          isEmpty={!data?.data.length}
          emptyText={c.search ? r.emptySearch : r.emptyPlayers}
        >
          <PlayerRankingsTable rows={data?.data ?? []} />
          {(data?.meta.totalPages ?? 1) > 1 ? (
            <Pagination page={c.page} pageCount={data!.meta.totalPages} onPageChange={c.setPage} />
          ) : null}
        </ListState>
        <AbbreviationsPanel />
      </div>
    </div>
  );
}

function ClubsRankingsPanel() {
  const { t } = useLanguage();
  const r = t.dashboard.rankings;
  const c = useRankingControls();
  const { data, isLoading, isFetching, isError, refetch } = useClubRankings({
    period: c.period,
    search: c.search || undefined,
    page: c.page,
    limit: PAGE_SIZE,
  });

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-ink">
        {r.clubRankingsTitle}
        {data ? <span className="ml-2 text-sm font-medium text-ink-faint">({data.meta.total.toLocaleString()} {r.clubsSuffix})</span> : null}
      </h2>
      <div className="mt-3">
        <Controls
          period={c.period}
          onPeriod={c.choosePeriod}
          searchInput={c.searchInput}
          onSearch={c.setSearchInput}
          placeholder={r.searchClubPlaceholder2}
        />
      </div>
      <StatsInfoPanel variant="clubs" className="mt-4" />
      <div className={`mt-5 space-y-5 transition-opacity ${isFetching && !isLoading ? "opacity-60" : ""}`}>
        <ListState
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          isEmpty={!data?.data.length}
          emptyText={c.search ? r.emptySearch : r.emptyClubs}
        >
          <ClubRankingsTable rows={data?.data ?? []} />
          {(data?.meta.totalPages ?? 1) > 1 ? (
            <Pagination page={c.page} pageCount={data!.meta.totalPages} onPageChange={c.setPage} />
          ) : null}
        </ListState>
        <AbbreviationsPanel />
      </div>
    </div>
  );
}
