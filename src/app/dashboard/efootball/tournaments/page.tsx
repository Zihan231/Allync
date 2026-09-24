"use client";

import { Suspense, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useTournaments } from "@/lib/api/hooks/useTournaments";
import type { TournamentType } from "@/lib/api/tournaments";
import { useUrlTab } from "@/lib/navigation/useUrlTab";
import { AppLoader } from "@/components/common/AppLoader";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatTile } from "@/components/dashboard/StatTile";
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
} from "@/components/icons";

const PAGE_SIZE = 9;
const TOURNAMENT_TABS: readonly TournamentType[] = ["cvc", "pvp"];

export default function TournamentsPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <TournamentsContent />
    </Suspense>
  );
}

function TournamentsContent() {
  const { t } = useLanguage();
  const { user, isLoading: isSessionLoading } = useSession();
  const [activeTab, setActiveTab] = useUrlTab(TOURNAMENT_TABS, "cvc");
  const [search, setSearch] = useState("");
  const [feeFilter, setFeeFilter] = useState<"all" | "free" | "paid">("all");
  const [prizeFilter, setPrizeFilter] = useState<"all" | "with_prize" | "friendly">("all");
  const [sortBy, setSortBy] = useState<"startAt" | "prizePoolBdt">("startAt");
  const [page, setPage] = useState(1);

  // Fetch backend tournaments
  const { data: tournaments = [], isLoading } = useTournaments({
    type: activeTab,
    sortBy,
  });

  const joinedTournaments = useMemo(() => {
    const userIds = [user?.id, user?.personId].filter(
      (id): id is string => Boolean(id),
    );

    return tournaments.filter((tournament) =>
      tournament.participants?.some(
        (participant) =>
          (participant.userId !== null && userIds.includes(participant.userId)) ||
          (participant.clubId !== null && participant.clubId === user?.club?.id),
      ),
    );
  }, [tournaments, user?.club?.id, user?.id, user?.personId]);

  // Client-side search and filters
  const filtered = useMemo(() => {
    return joinedTournaments.filter((tour) => {
      // Search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = tour.name?.toLowerCase().includes(query);
        const matchComm = tour.community?.name?.toLowerCase().includes(query);
        if (!matchName && !matchComm) return false;
      }

      // Fee filter
      if (feeFilter === "free" && (tour.isPaid || (tour.entryFeeBdt && tour.entryFeeBdt > 0))) {
        return false;
      }
      if (feeFilter === "paid" && (!tour.isPaid && (!tour.entryFeeBdt || tour.entryFeeBdt <= 0))) {
        return false;
      }

      // Prize filter
      if (prizeFilter === "with_prize" && (!tour.prizePoolBdt || tour.prizePoolBdt <= 0)) {
        return false;
      }
      if (prizeFilter === "friendly" && tour.prizePoolBdt && tour.prizePoolBdt > 0) {
        return false;
      }

      return true;
    });
  }, [joinedTournaments, search, feeFilter, prizeFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats calculation across the current active tab
  const stats = useMemo(() => {
    const liveCount = joinedTournaments.filter(
      (tour) => tour.status === "ongoing" || tour.status === "live",
    ).length;
    const openCount = joinedTournaments.filter(
      (tour) => tour.status === "open" || tour.status === "registration_open",
    ).length;
    const totalPrizePool = joinedTournaments.reduce(
      (sum, tour) => sum + (tour.prizePoolBdt || 0),
      0,
    );
    return { liveCount, openCount, totalPrizePool };
  }, [joinedTournaments]);

  function handleTabChange(tab: TournamentType) {
    setActiveTab(tab);
    setPage(1);
  }

  return (
    <div className="relative">
      <div className="glow-gold pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[600px] -translate-x-1/2 blur-[100px] opacity-30" />

      <PageHeader
        eyebrow="Your eFootball Competitions"
        title={t.dashboard.shell.navMyTournaments || "My Tournaments"}
      />

      {/* Stats row */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatTile
          label={t.dashboard.tournaments.liveNowLabel || "Live Now"}
          value={String(stats.liveCount)}
          icon={FlameIcon}
        />
        <StatTile
          label={t.dashboard.tournaments.openForEntryLabel || "Open for Entry"}
          value={String(stats.openCount)}
          icon={TrophyIcon}
        />
        <StatTile
          label={t.dashboard.tournaments.totalPrizePoolLabel || "Total Prize Pool"}
          value={`৳ ${stats.totalPrizePool.toLocaleString()}`}
          icon={WalletIcon}
        />
      </div>

      {/* Top Tabs: Club Tournaments (CvC) vs Player Tournaments (PvP) */}
      <div className="mt-8 flex border-b border-surface-line">
        <button
          onClick={() => handleTabChange("cvc")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 font-display text-sm font-semibold transition-colors ${
            activeTab === "cvc"
              ? "border-accent text-accent-ink"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          <UsersIcon className="h-4 w-4" />
          My Club Tournaments (CvC)
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              activeTab === "cvc" ? "bg-accent/20 text-accent-ink" : "bg-surface-line text-ink-faint"
            }`}
          >
            {activeTab === "cvc" ? joinedTournaments.length : "•"}
          </span>
        </button>

        <button
          onClick={() => handleTabChange("pvp")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 font-display text-sm font-semibold transition-colors ${
            activeTab === "pvp"
              ? "border-accent text-accent-ink"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          <CrosshairIcon className="h-4 w-4" />
          My Player Tournaments (PvP)
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              activeTab === "pvp" ? "bg-accent/20 text-accent-ink" : "bg-surface-line text-ink-faint"
            }`}
          >
            {activeTab === "pvp" ? joinedTournaments.length : "•"}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by tournament or community name..."
            className="w-full rounded-xl border border-surface-line bg-surface/60 py-2 pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Entry Fee Filters */}
          <div className="flex items-center rounded-lg border border-surface-line bg-surface/50 p-1 text-xs">
            <button
              onClick={() => setFeeFilter("all")}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                feeFilter === "all" ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"
              }`}
            >
              All Fees
            </button>
            <button
              onClick={() => setFeeFilter("free")}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                feeFilter === "free" ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"
              }`}
            >
              Free Entry
            </button>
            <button
              onClick={() => setFeeFilter("paid")}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                feeFilter === "paid" ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"
              }`}
            >
              Paid Entry
            </button>
          </div>

          {/* Prize Pool Filters */}
          <div className="flex items-center rounded-lg border border-surface-line bg-surface/50 p-1 text-xs">
            <button
              onClick={() => setPrizeFilter("all")}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                prizeFilter === "all" ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"
              }`}
            >
              All Prizes
            </button>
            <button
              onClick={() => setPrizeFilter("with_prize")}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                prizeFilter === "with_prize" ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"
              }`}
            >
              With Prize
            </button>
            <button
              onClick={() => setPrizeFilter("friendly")}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                prizeFilter === "friendly" ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"
              }`}
            >
              Friendly
            </button>
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "startAt" | "prizePoolBdt")}
            className="rounded-lg border border-surface-line bg-surface px-3 py-1.5 text-xs text-ink-soft outline-none focus:border-accent [color-scheme:dark]"
          >
            <option value="startAt">Starts Soonest</option>
            <option value="prizePoolBdt">Highest Prize Pool</option>
          </select>
        </div>
      </div>

      {/* Tournament Cards Grid */}
      <div className="mt-6">
        {isLoading || isSessionLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : filtered.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((tour) => (
                <TournamentCard
                  key={tour.id}
                  tournament={tour}
                  href={`/dashboard/efootball/tournaments/${tour.id}`}
                />
              ))}
            </div>
            {pageCount > 1 && (
              <div className="mt-8">
                <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={TrophyIcon}
            title={activeTab === "cvc" ? "No Joined Club Tournaments" : "No Joined Player Tournaments"}
            body={
              search || feeFilter !== "all" || prizeFilter !== "all"
                ? "Try clearing your search query or filters."
                : "Join a tournament from its community page and it will appear here."
            }
          />
        )}
      </div>
    </div>
  );
}
