"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockPeople, useMockClubs, useMockCommunities } from "@/lib/mock/communityStore";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { LeaderboardTable } from "@/components/dashboard/LeaderboardTable";
import { PlayerRankingsTable } from "@/components/dashboard/PlayerRankingsTable";
import { ClubRankingsTable } from "@/components/dashboard/ClubRankingsTable";
import { DualRangeSlider } from "@/components/dashboard/DualRangeSlider";
import { Pagination } from "@/components/dashboard/Pagination";
import {
  getPlayerRankings,
  getClubRankings,
  PLAYER_RANGES,
  PLAYER_METRIC_MAX,
  CLUB_METRIC_MAX,
  CLUB_QUICK_FILTERS,
  TOTAL_CLUBS,
  type PlayerRange,
  type ClubSeason,
} from "@/lib/mock/rankingsData";

type Tab = "players" | "clubs" | "communities";
const PAGE_SIZE = 20;

export default function RankingsPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("players");
  const people = useMockPeople();
  const clubs = useMockClubs();
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
          <PlayersRankingsPanel people={people} clubs={clubs} />
        ) : tab === "clubs" ? (
          <ClubsRankingsPanel clubs={clubs} />
        ) : (
          <LeaderboardTable
            rows={communityRows}
            hrefBuilder={(id) => `/dashboard/efootball/community/${id}`}
          />
        )}
      </div>
    </div>
  );
}

function QuickFilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-blue bg-blue-soft text-blue-ink"
          : "border-surface-line-strong text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function FilterCard({ title, onReset, children }: { title: string; onReset: () => void; children: React.ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-xl border border-surface-line bg-surface/50 p-5">
      <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
      <div className="mt-4 space-y-5">{children}</div>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 w-full rounded-full border border-surface-line-strong px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
      >
        {t.dashboard.rankings.resetAllFilters}
      </button>
    </div>
  );
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

function PlayersRankingsPanel({
  people,
  clubs,
}: {
  people: ReturnType<typeof useMockPeople>;
  clubs: ReturnType<typeof useMockClubs>;
}) {
  const { t } = useLanguage();
  const [range, setRange] = useState<PlayerRange>("all-time");
  const [rankRange, setRankRange] = useState<[number, number]>([1, PLAYER_METRIC_MAX.rank]);
  const [gfRange, setGfRange] = useState<[number, number]>([0, PLAYER_METRIC_MAX.goalsFor]);
  const [plRange, setPlRange] = useState<[number, number]>([0, PLAYER_METRIC_MAX.matchesPlayed]);
  const [winsRange, setWinsRange] = useState<[number, number]>([0, PLAYER_METRIC_MAX.totalWins]);
  const [page, setPage] = useState(1);

  const clubNameById = useMemo(() => new Map(clubs.map((c) => [c.id, c.name])), [clubs]);

  const allRows = useMemo(() => getPlayerRankings(range, people, clubNameById), [range, people, clubNameById]);

  const filtered = useMemo(
    () =>
      allRows.filter(
        (r) =>
          r.rank >= rankRange[0] &&
          r.rank <= rankRange[1] &&
          r.GF >= gfRange[0] &&
          r.GF <= gfRange[1] &&
          r.PL >= plRange[0] &&
          r.PL <= plRange[1] &&
          r.W >= winsRange[0] &&
          r.W <= winsRange[1]
      ),
    [allRows, rankRange, gfRange, plRange, winsRange]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetFilters() {
    setRankRange([1, PLAYER_METRIC_MAX.rank]);
    setGfRange([0, PLAYER_METRIC_MAX.goalsFor]);
    setPlRange([0, PLAYER_METRIC_MAX.matchesPlayed]);
    setWinsRange([0, PLAYER_METRIC_MAX.totalWins]);
    setPage(1);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {PLAYER_RANGES.map((r) => (
          <QuickFilterPill
            key={r.key}
            active={range === r.key}
            onClick={() => {
              setRange(r.key);
              setPage(1);
            }}
          >
            {r.label}
          </QuickFilterPill>
        ))}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-5">
          <PlayerRankingsTable rows={pageRows} />
          {filtered.length === 0 ? (
            <p className="text-sm text-ink-soft">{t.dashboard.rankings.noResults}</p>
          ) : null}
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
          <AbbreviationsPanel />
        </div>

        <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <FilterCard title={t.dashboard.rankings.metricsRangeTitle} onReset={resetFilters}>
            <DualRangeSlider
              label={t.dashboard.rankings.rankPositionLabel}
              min={1}
              max={PLAYER_METRIC_MAX.rank}
              value={rankRange}
              onChange={(v) => {
                setRankRange(v);
                setPage(1);
              }}
            />
            <DualRangeSlider
              label={t.dashboard.rankings.goalsForLabel}
              min={0}
              max={PLAYER_METRIC_MAX.goalsFor}
              value={gfRange}
              onChange={(v) => {
                setGfRange(v);
                setPage(1);
              }}
            />
            <DualRangeSlider
              label={t.dashboard.rankings.matchesPlayedLabel}
              min={0}
              max={PLAYER_METRIC_MAX.matchesPlayed}
              value={plRange}
              onChange={(v) => {
                setPlRange(v);
                setPage(1);
              }}
            />
            <DualRangeSlider
              label={t.dashboard.rankings.totalWinsLabel}
              min={0}
              max={PLAYER_METRIC_MAX.totalWins}
              value={winsRange}
              onChange={(v) => {
                setWinsRange(v);
                setPage(1);
              }}
            />
          </FilterCard>
        </div>
      </div>
    </div>
  );
}

const SORT_OPTIONS = [
  { key: "rank-asc", label: "sortRankAscending" as const },
  { key: "rating-desc", label: "sortRatingDescending" as const },
  { key: "wins-desc", label: "sortMostWins" as const },
  { key: "goals-desc", label: "sortMostGoals" as const },
];

function ClubsRankingsPanel({ clubs }: { clubs: ReturnType<typeof useMockClubs> }) {
  const { t } = useLanguage();
  const [quickFilter, setQuickFilter] = useState(CLUB_QUICK_FILTERS[0].key);
  const [season, setSeason] = useState<ClubSeason>("all-time");
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0].key);
  const [search, setSearch] = useState("");
  const [rankRange, setRankRange] = useState<[number, number]>([1, CLUB_METRIC_MAX.rank]);
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, CLUB_METRIC_MAX.rating]);
  const [mRange, setMRange] = useState<[number, number]>([0, CLUB_METRIC_MAX.matchesPlayed]);
  const [winsRange, setWinsRange] = useState<[number, number]>([0, CLUB_METRIC_MAX.totalWins]);
  const [gfRange, setGfRange] = useState<[number, number]>([0, CLUB_METRIC_MAX.goalsFor]);
  const [page, setPage] = useState(1);

  const allRows = useMemo(() => getClubRankings(clubs, season), [clubs, season]);

  const activeTiers = CLUB_QUICK_FILTERS.find((q) => q.key === quickFilter)?.tiers ?? null;

  const filtered = useMemo(() => {
    let rows = allRows.filter(
      (r) =>
        r.rank >= rankRange[0] &&
        r.rank <= rankRange[1] &&
        r.rating >= ratingRange[0] &&
        r.rating <= ratingRange[1] &&
        r.M >= mRange[0] &&
        r.M <= mRange[1] &&
        r.W >= winsRange[0] &&
        r.W <= winsRange[1] &&
        r.GF >= gfRange[0] &&
        r.GF <= gfRange[1]
    );
    if (activeTiers) rows = rows.filter((r) => activeTiers.includes(r.tier));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(q));
    }
    const sorted = [...rows];
    if (sortBy === "rank-asc") sorted.sort((a, b) => a.rank - b.rank);
    else if (sortBy === "rating-desc") sorted.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "wins-desc") sorted.sort((a, b) => b.W - a.W);
    else if (sortBy === "goals-desc") sorted.sort((a, b) => b.GF - a.GF);
    return sorted;
  }, [allRows, activeTiers, search, sortBy, rankRange, ratingRange, mRange, winsRange, gfRange]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetFilters() {
    setQuickFilter(CLUB_QUICK_FILTERS[0].key);
    setSeason("all-time");
    setSortBy(SORT_OPTIONS[0].key);
    setSearch("");
    setRankRange([1, CLUB_METRIC_MAX.rank]);
    setRatingRange([0, CLUB_METRIC_MAX.rating]);
    setMRange([0, CLUB_METRIC_MAX.matchesPlayed]);
    setWinsRange([0, CLUB_METRIC_MAX.totalWins]);
    setGfRange([0, CLUB_METRIC_MAX.goalsFor]);
    setPage(1);
  }

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-ink">
        {t.dashboard.rankings.clubRankingsTitle} ({TOTAL_CLUBS} {t.dashboard.rankings.clubsSuffix})
      </h2>

      <div className="mt-3 flex flex-wrap gap-2">
        {CLUB_QUICK_FILTERS.map((q) => (
          <QuickFilterPill
            key={q.key}
            active={quickFilter === q.key}
            onClick={() => {
              setQuickFilter(q.key);
              setPage(1);
            }}
          >
            {q.label}
          </QuickFilterPill>
        ))}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-5">
          <ClubRankingsTable rows={pageRows} />
          {filtered.length === 0 ? (
            <p className="text-sm text-ink-soft">{t.dashboard.rankings.noResults}</p>
          ) : null}
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
          <AbbreviationsPanel />
        </div>

        <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border border-surface-line bg-surface/50 p-5">
            <label className="block text-xs font-medium text-ink">{t.dashboard.rankings.seasonLabel}</label>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSeason("all-time");
                  setPage(1);
                }}
                className={`flex-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  season === "all-time" ? "border-accent bg-accent-soft text-accent-ink" : "border-surface-line-strong text-ink-soft"
                }`}
              >
                {t.dashboard.rankings.seasonAllTime}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSeason("2026");
                  setPage(1);
                }}
                className={`flex-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  season === "2026" ? "border-accent bg-accent-soft text-accent-ink" : "border-surface-line-strong text-ink-soft"
                }`}
              >
                2026
              </button>
            </div>

            <label className="mt-4 block text-xs font-medium text-ink">{t.dashboard.rankings.sortByLabel}</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="mt-2 w-full rounded-lg border border-surface-line-strong bg-surface px-3 py-2 text-sm text-ink"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {t.dashboard.rankings[opt.label]}
                </option>
              ))}
            </select>

            <label className="mt-4 block text-xs font-medium text-ink">{t.dashboard.rankings.searchLabel}</label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t.dashboard.rankings.searchClubPlaceholder}
              className="mt-2 w-full rounded-lg border border-surface-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
            />
          </div>

          <FilterCard title={t.dashboard.rankings.metricsRangeTitle} onReset={resetFilters}>
            <DualRangeSlider
              label={t.dashboard.rankings.rankPositionLabel}
              min={1}
              max={CLUB_METRIC_MAX.rank}
              value={rankRange}
              onChange={(v) => {
                setRankRange(v);
                setPage(1);
              }}
            />
            <DualRangeSlider
              label={t.dashboard.rankings.ratingPointsLabel}
              min={0}
              max={CLUB_METRIC_MAX.rating}
              value={ratingRange}
              onChange={(v) => {
                setRatingRange(v);
                setPage(1);
              }}
            />
            <DualRangeSlider
              label={t.dashboard.rankings.matchesPlayedLabel}
              min={0}
              max={CLUB_METRIC_MAX.matchesPlayed}
              value={mRange}
              onChange={(v) => {
                setMRange(v);
                setPage(1);
              }}
            />
            <DualRangeSlider
              label={t.dashboard.rankings.totalWinsLabel}
              min={0}
              max={CLUB_METRIC_MAX.totalWins}
              value={winsRange}
              onChange={(v) => {
                setWinsRange(v);
                setPage(1);
              }}
            />
            <DualRangeSlider
              label={t.dashboard.rankings.goalsForLabel}
              min={0}
              max={CLUB_METRIC_MAX.goalsFor}
              value={gfRange}
              onChange={(v) => {
                setGfRange(v);
                setPage(1);
              }}
            />
          </FilterCard>
        </div>
      </div>
    </div>
  );
}
