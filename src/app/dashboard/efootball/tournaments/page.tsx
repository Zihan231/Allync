"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockTournaments } from "@/lib/mock/store";
import type { TournamentFormat } from "@/lib/mock/types";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatTile } from "@/components/dashboard/StatTile";
import { TournamentCard, FORMAT_META } from "@/components/dashboard/TournamentCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Pagination } from "@/components/dashboard/Pagination";
import { TrophyIcon, PlusIcon, FlameIcon, WalletIcon } from "@/components/icons";

const filters: (TournamentFormat | "all")[] = ["all", "playerVsPlayer", "clubVsClub", "open", "default", "custom"];
const PAGE_SIZE = 9;

export default function TournamentsPage() {
  const { t } = useLanguage();
  const allTournaments = useMockTournaments();
  const tournaments = useMemo(() => allTournaments.filter((tour) => tour.game === "efootball"), [allTournaments]);
  const [filter, setFilter] = useState<TournamentFormat | "all">("all");
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the filter changes, without a setState-in-effect
  // render pass — the standard React pattern for adjusting state during render.
  const [prevFilter, setPrevFilter] = useState(filter);
  if (filter !== prevFilter) {
    setPrevFilter(filter);
    setPage(1);
  }

  const filterLabel: Record<TournamentFormat | "all", string> = {
    all: t.dashboard.tournaments.filterAll,
    default: t.dashboard.tournaments.filterDefault,
    custom: t.dashboard.tournaments.filterCustom,
    clubVsClub: t.dashboard.tournaments.filterClubVsClub,
    open: t.dashboard.tournaments.filterOpen,
    playerVsPlayer: t.dashboard.tournaments.filterPlayerVsPlayer,
  };

  const filtered = filter === "all" ? tournaments : tournaments.filter((tour) => tour.format === filter);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    const liveCount = tournaments.filter((tour) => tour.status === "live").length;
    const openCount = tournaments.filter((tour) => tour.status === "open").length;
    const totalPrizePool = tournaments.reduce((sum, tour) => sum + (tour.prizePoolBdt ?? 0), 0);
    return { liveCount, openCount, totalPrizePool };
  }, [tournaments]);

  return (
    <div className="relative">
      <div className="glow-gold pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[600px] -translate-x-1/2 blur-[100px] opacity-30" />

      <PageHeader
        eyebrow="eFootball"
        title={t.dashboard.shell.navTournaments}
        action={
          <Link
            href="/dashboard/efootball/tournaments/create"
            className="group inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 font-display text-sm font-semibold text-bg shadow-[0_0_20px_rgba(217,165,68,0.3)] transition-transform hover:-translate-y-0.5"
          >
            <PlusIcon className="h-4 w-4" />
            {t.dashboard.shell.navCreateTournament}
          </Link>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatTile label={t.dashboard.tournaments.liveNowLabel} value={String(stats.liveCount)} icon={FlameIcon} />
        <StatTile label={t.dashboard.tournaments.openForEntryLabel} value={String(stats.openCount)} icon={TrophyIcon} />
        <StatTile
          label={t.dashboard.tournaments.totalPrizePoolLabel}
          value={`৳ ${stats.totalPrizePool.toLocaleString()}`}
          icon={WalletIcon}
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {filters.map((f) => {
          const FilterIcon = f === "all" ? null : FORMAT_META[f].icon;
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-accent bg-accent-soft text-accent-ink"
                  : "border-surface-line-strong text-ink-soft hover:text-ink"
              }`}
            >
              {FilterIcon ? (
                <FilterIcon
                  className="h-3.5 w-3.5"
                  style={{ color: active ? undefined : FORMAT_META[f as TournamentFormat].color }}
                />
              ) : null}
              {filterLabel[f]}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {filtered.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((tour) => (
                <TournamentCard key={tour.id} tournament={tour} href={`/dashboard/efootball/tournaments/${tour.id}`} />
              ))}
            </div>
            <div className="mt-6">
              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
            </div>
          </>
        ) : (
          <EmptyState icon={TrophyIcon} title={t.dashboard.tournaments.noTournaments} body="" />
        )}
      </div>
    </div>
  );
}
