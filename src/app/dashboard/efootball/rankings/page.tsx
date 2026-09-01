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
import { FilterModal } from "@/components/dashboard/FilterModal";
import { FilterIcon } from "@/components/icons";
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

type Range2 = [number, number];

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

function FiltersButton({ onClick, active }: { onClick: () => void; active: boolean }) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative ml-auto flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
        active
          ? "bg-accent text-bg"
          : "bg-surface-line-strong/70 text-ink hover:bg-surface-line-strong"
      }`}
    >
      <FilterIcon className="h-3.5 w-3.5" />
      {t.dashboard.rankings.filtersButton}
      {active ? (
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-bg bg-blue" />
      ) : null}
    </button>
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

function isFullRange(v: Range2, min: number, max: number) {
  return v[0] === min && v[1] === max;
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

  const [rankRange, setRankRange] = useState<Range2>([1, PLAYER_METRIC_MAX.rank]);
  const [gfRange, setGfRange] = useState<Range2>([0, PLAYER_METRIC_MAX.goalsFor]);
  const [plRange, setPlRange] = useState<Range2>([0, PLAYER_METRIC_MAX.matchesPlayed]);
  const [winsRange, setWinsRange] = useState<Range2>([0, PLAYER_METRIC_MAX.totalWins]);
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [draftRank, setDraftRank] = useState<Range2>(rankRange);
  const [draftGf, setDraftGf] = useState<Range2>(gfRange);
  const [draftPl, setDraftPl] = useState<Range2>(plRange);
  const [draftWins, setDraftWins] = useState<Range2>(winsRange);

  const filtersActive =
    !isFullRange(rankRange, 1, PLAYER_METRIC_MAX.rank) ||
    !isFullRange(gfRange, 0, PLAYER_METRIC_MAX.goalsFor) ||
    !isFullRange(plRange, 0, PLAYER_METRIC_MAX.matchesPlayed) ||
    !isFullRange(winsRange, 0, PLAYER_METRIC_MAX.totalWins);

  function openModal() {
    setDraftRank(rankRange);
    setDraftGf(gfRange);
    setDraftPl(plRange);
    setDraftWins(winsRange);
    setModalOpen(true);
  }

  function applyModal() {
    setRankRange(draftRank);
    setGfRange(draftGf);
    setPlRange(draftPl);
    setWinsRange(draftWins);
    setPage(1);
    setModalOpen(false);
  }

  function resetModal() {
    const full: [Range2, Range2, Range2, Range2] = [
      [1, PLAYER_METRIC_MAX.rank],
      [0, PLAYER_METRIC_MAX.goalsFor],
      [0, PLAYER_METRIC_MAX.matchesPlayed],
      [0, PLAYER_METRIC_MAX.totalWins],
    ];
    setDraftRank(full[0]);
    setDraftGf(full[1]);
    setDraftPl(full[2]);
    setDraftWins(full[3]);
    setRankRange(full[0]);
    setGfRange(full[1]);
    setPlRange(full[2]);
    setWinsRange(full[3]);
    setPage(1);
    setModalOpen(false);
  }

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

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
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
        <FiltersButton onClick={openModal} active={filtersActive} />
      </div>

      <div className="mt-5 space-y-5">
        <PlayerRankingsTable rows={pageRows} />
        {filtered.length === 0 ? <p className="text-sm text-ink-soft">{t.dashboard.rankings.noResults}</p> : null}
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        <AbbreviationsPanel />
      </div>

      <FilterModal
        open={modalOpen}
        title={t.dashboard.rankings.metricsRangeTitle}
        onClose={() => setModalOpen(false)}
        onApply={applyModal}
        onReset={resetModal}
        applyLabel={t.dashboard.rankings.applyFilters}
        resetLabel={t.dashboard.rankings.resetAllFilters}
      >
        <DualRangeSlider
          label={t.dashboard.rankings.rankPositionLabel}
          min={1}
          max={PLAYER_METRIC_MAX.rank}
          value={draftRank}
          onChange={setDraftRank}
        />
        <DualRangeSlider
          label={t.dashboard.rankings.goalsForLabel}
          min={0}
          max={PLAYER_METRIC_MAX.goalsFor}
          value={draftGf}
          onChange={setDraftGf}
        />
        <DualRangeSlider
          label={t.dashboard.rankings.matchesPlayedLabel}
          min={0}
          max={PLAYER_METRIC_MAX.matchesPlayed}
          value={draftPl}
          onChange={setDraftPl}
        />
        <DualRangeSlider
          label={t.dashboard.rankings.totalWinsLabel}
          min={0}
          max={PLAYER_METRIC_MAX.totalWins}
          value={draftWins}
          onChange={setDraftWins}
        />
      </FilterModal>
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
  const [page, setPage] = useState(1);

  const [season, setSeason] = useState<ClubSeason>("all-time");
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0].key);
  const [search, setSearch] = useState("");
  const [rankRange, setRankRange] = useState<Range2>([1, CLUB_METRIC_MAX.rank]);
  const [ratingRange, setRatingRange] = useState<Range2>([0, CLUB_METRIC_MAX.rating]);
  const [mRange, setMRange] = useState<Range2>([0, CLUB_METRIC_MAX.matchesPlayed]);
  const [winsRange, setWinsRange] = useState<Range2>([0, CLUB_METRIC_MAX.totalWins]);
  const [gfRange, setGfRange] = useState<Range2>([0, CLUB_METRIC_MAX.goalsFor]);

  const [modalOpen, setModalOpen] = useState(false);
  const [draftSeason, setDraftSeason] = useState<ClubSeason>(season);
  const [draftSortBy, setDraftSortBy] = useState(sortBy);
  const [draftSearch, setDraftSearch] = useState(search);
  const [draftRank, setDraftRank] = useState<Range2>(rankRange);
  const [draftRating, setDraftRating] = useState<Range2>(ratingRange);
  const [draftM, setDraftM] = useState<Range2>(mRange);
  const [draftWins, setDraftWins] = useState<Range2>(winsRange);
  const [draftGf, setDraftGf] = useState<Range2>(gfRange);

  const filtersActive =
    season !== "all-time" ||
    sortBy !== SORT_OPTIONS[0].key ||
    search.trim() !== "" ||
    !isFullRange(rankRange, 1, CLUB_METRIC_MAX.rank) ||
    !isFullRange(ratingRange, 0, CLUB_METRIC_MAX.rating) ||
    !isFullRange(mRange, 0, CLUB_METRIC_MAX.matchesPlayed) ||
    !isFullRange(winsRange, 0, CLUB_METRIC_MAX.totalWins) ||
    !isFullRange(gfRange, 0, CLUB_METRIC_MAX.goalsFor);

  function openModal() {
    setDraftSeason(season);
    setDraftSortBy(sortBy);
    setDraftSearch(search);
    setDraftRank(rankRange);
    setDraftRating(ratingRange);
    setDraftM(mRange);
    setDraftWins(winsRange);
    setDraftGf(gfRange);
    setModalOpen(true);
  }

  function applyModal() {
    setSeason(draftSeason);
    setSortBy(draftSortBy);
    setSearch(draftSearch);
    setRankRange(draftRank);
    setRatingRange(draftRating);
    setMRange(draftM);
    setWinsRange(draftWins);
    setGfRange(draftGf);
    setPage(1);
    setModalOpen(false);
  }

  function resetModal() {
    setSeason("all-time");
    setSortBy(SORT_OPTIONS[0].key);
    setSearch("");
    setRankRange([1, CLUB_METRIC_MAX.rank]);
    setRatingRange([0, CLUB_METRIC_MAX.rating]);
    setMRange([0, CLUB_METRIC_MAX.matchesPlayed]);
    setWinsRange([0, CLUB_METRIC_MAX.totalWins]);
    setGfRange([0, CLUB_METRIC_MAX.goalsFor]);
    setPage(1);
    setModalOpen(false);
  }

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

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-ink">
        {t.dashboard.rankings.clubRankingsTitle} ({TOTAL_CLUBS} {t.dashboard.rankings.clubsSuffix})
      </h2>

      <div className="mt-3 flex flex-wrap items-center gap-2">
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
        <FiltersButton onClick={openModal} active={filtersActive} />
      </div>

      <div className="mt-5 space-y-5">
        <ClubRankingsTable rows={pageRows} />
        {filtered.length === 0 ? <p className="text-sm text-ink-soft">{t.dashboard.rankings.noResults}</p> : null}
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        <AbbreviationsPanel />
      </div>

      <FilterModal
        open={modalOpen}
        title={t.dashboard.rankings.customFiltersTitle}
        onClose={() => setModalOpen(false)}
        onApply={applyModal}
        onReset={resetModal}
        applyLabel={t.dashboard.rankings.applyFilters}
        resetLabel={t.dashboard.rankings.resetAllFilters}
      >
        <div>
          <label className="block text-xs font-medium text-ink">{t.dashboard.rankings.seasonLabel}</label>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setDraftSeason("all-time")}
              className={`flex-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                draftSeason === "all-time" ? "border-accent bg-accent-soft text-accent-ink" : "border-surface-line-strong text-ink-soft"
              }`}
            >
              {t.dashboard.rankings.seasonAllTime}
            </button>
            <button
              type="button"
              onClick={() => setDraftSeason("2026")}
              className={`flex-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                draftSeason === "2026" ? "border-accent bg-accent-soft text-accent-ink" : "border-surface-line-strong text-ink-soft"
              }`}
            >
              2026
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink">{t.dashboard.rankings.sortByLabel}</label>
          <select
            value={draftSortBy}
            onChange={(e) => setDraftSortBy(e.target.value)}
            className="mt-2 w-full rounded-lg border border-surface-line-strong bg-surface px-3 py-2 text-sm text-ink"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {t.dashboard.rankings[opt.label]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink">{t.dashboard.rankings.searchLabel}</label>
          <input
            type="text"
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
            placeholder={t.dashboard.rankings.searchClubPlaceholder}
            className="mt-2 w-full rounded-lg border border-surface-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
          />
        </div>

        <div className="border-t border-surface-line pt-5">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {t.dashboard.rankings.metricsRangeTitle}
          </h4>
          <div className="mt-4 space-y-5">
            <DualRangeSlider
              label={t.dashboard.rankings.rankPositionLabel}
              min={1}
              max={CLUB_METRIC_MAX.rank}
              value={draftRank}
              onChange={setDraftRank}
            />
            <DualRangeSlider
              label={t.dashboard.rankings.ratingPointsLabel}
              min={0}
              max={CLUB_METRIC_MAX.rating}
              value={draftRating}
              onChange={setDraftRating}
            />
            <DualRangeSlider
              label={t.dashboard.rankings.matchesPlayedLabel}
              min={0}
              max={CLUB_METRIC_MAX.matchesPlayed}
              value={draftM}
              onChange={setDraftM}
            />
            <DualRangeSlider
              label={t.dashboard.rankings.totalWinsLabel}
              min={0}
              max={CLUB_METRIC_MAX.totalWins}
              value={draftWins}
              onChange={setDraftWins}
            />
            <DualRangeSlider
              label={t.dashboard.rankings.goalsForLabel}
              min={0}
              max={CLUB_METRIC_MAX.goalsFor}
              value={draftGf}
              onChange={setDraftGf}
            />
          </div>
        </div>
      </FilterModal>
    </div>
  );
}
