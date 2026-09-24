"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Tournament } from "@/lib/mock/types";
import type { BackendTournament } from "@/lib/api/tournaments";
import { TournamentCard } from "./TournamentCard";
import { TournamentCardSkeleton } from "./TournamentCardSkeleton";
import { BracketIcon, FilterIcon, FlameIcon, PlusIcon, TrophyIcon, UsersIcon } from "../icons";

type TournamentItem = Tournament | BackendTournament;
type FilterKey = "all" | "open" | "live" | "closed" | "completed";

const ITEMS_PER_PAGE = 6;

const FILTERS: {
  key: FilterKey;
  label: string;
  statuses: string[] | null;
}[] = [
  { key: "all", label: "All", statuses: null },
  { key: "open", label: "Open", statuses: ["open", "registration_open"] },
  { key: "live", label: "Live", statuses: ["ongoing", "live"] },
  { key: "closed", label: "Closed", statuses: ["registration_closed", "submission_phase"] },
  { key: "completed", label: "Completed", statuses: ["completed"] },
];

function getStatus(tournament: TournamentItem) {
  return String(tournament.status || "open").toLowerCase();
}

function getPrize(tournament: TournamentItem) {
  return Math.max(0, Number(tournament.prizePoolBdt) || 0);
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const visibleCount = Math.min(5, totalPages);
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - visibleCount + 1));
  return Array.from({ length: visibleCount }, (_, index) => start + index);
}

export function CommunityTournamentsTab({
  communityId,
  tournaments,
  isLoading = false,
  canManage = false,
}: {
  communityId: string;
  tournaments: TournamentItem[];
  isLoading?: boolean;
  canManage?: boolean;
}) {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [page, setPage] = useState(1);
  const [showPrizeFilter, setShowPrizeFilter] = useState(false);
  const [minPrize, setMinPrize] = useState(0);
  const [maxPrize, setMaxPrize] = useState<number | null>(null);
  const [minPrizeInput, setMinPrizeInput] = useState("0");
  const [maxPrizeInput, setMaxPrizeInput] = useState<string | null>(null);

  if (isLoading) {
    return (
      <section aria-busy="true" aria-label="Loading community tournaments" className="space-y-5">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-surface-line bg-surface/40 p-4">
          <div className="space-y-2">
            <div className="h-5 w-40 animate-pulse rounded bg-surface-line/80" />
            <div className="h-3 w-56 max-w-full animate-pulse rounded bg-surface-line/50" />
          </div>
          <div className="h-9 w-24 animate-pulse rounded-full bg-surface-line/60" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: ITEMS_PER_PAGE }, (_, index) => (
            <TournamentCardSkeleton key={index} />
          ))}
        </div>
      </section>
    );
  }

  const highestPrize = Math.max(0, ...tournaments.map(getPrize));
  const prizeCeiling = Math.max(1000, Math.ceil(highestPrize / 500) * 500);
  const effectiveMaxPrize = Math.min(maxPrize ?? prizeCeiling, prizeCeiling);
  const hasPrizeFilter = minPrize > 0 || effectiveMaxPrize < prizeCeiling;
  const prizeFilteredTournaments = tournaments.filter((tournament) => {
    const prize = getPrize(tournament);
    return prize >= minPrize && prize <= effectiveMaxPrize;
  });
  const selectedFilter = FILTERS.find((filter) => filter.key === activeFilter) ?? FILTERS[0];
  const filteredTournaments = selectedFilter.statuses
    ? prizeFilteredTournaments.filter((tournament) => selectedFilter.statuses?.includes(getStatus(tournament)))
    : prizeFilteredTournaments;
  const totalPages = Math.max(1, Math.ceil(filteredTournaments.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const firstItemIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleTournaments = filteredTournaments.slice(firstItemIndex, firstItemIndex + ITEMS_PER_PAGE);
  const visiblePages = getVisiblePages(currentPage, totalPages);
  const liveCount = tournaments.filter((tournament) => ["ongoing", "live"].includes(getStatus(tournament))).length;
  const openCount = tournaments.filter((tournament) => ["open", "registration_open"].includes(getStatus(tournament))).length;
  const minPrizePercent = (minPrize / prizeCeiling) * 100;
  const maxPrizePercent = (effectiveMaxPrize / prizeCeiling) * 100;

  const selectFilter = (filter: FilterKey) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const updateMinPrize = (value: number) => {
    const normalizedValue = Math.min(Math.max(0, value), effectiveMaxPrize);
    setMinPrize(normalizedValue);
    setMinPrizeInput(String(normalizedValue));
    setPage(1);
  };

  const updateMaxPrize = (value: number) => {
    const normalizedValue = Math.max(minPrize, Math.min(prizeCeiling, value));
    setMaxPrize(normalizedValue);
    setMaxPrizeInput(String(normalizedValue));
    setPage(1);
  };

  const changeMinPrizeInput = (value: string) => {
    setMinPrizeInput(value);
    if (value === "") return;
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) return;
    setMinPrize(Math.min(Math.max(0, parsedValue), effectiveMaxPrize));
    setPage(1);
  };

  const changeMaxPrizeInput = (value: string) => {
    setMaxPrizeInput(value);
    if (value === "") return;
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) return;
    setMaxPrize(Math.max(minPrize, Math.min(prizeCeiling, parsedValue)));
    setPage(1);
  };

  const commitMinPrizeInput = () => updateMinPrize(Number(minPrizeInput) || 0);
  const commitMaxPrizeInput = () =>
    updateMaxPrize(maxPrizeInput === null || maxPrizeInput === "" ? prizeCeiling : Number(maxPrizeInput));

  const clearFilters = () => {
    setActiveFilter("all");
    setMinPrize(0);
    setMaxPrize(null);
    setMinPrizeInput("0");
    setMaxPrizeInput(null);
    setPage(1);
  };

  return (
    <section className="space-y-5" aria-labelledby="community-tournaments-heading">
      <div className="relative isolate overflow-hidden rounded-3xl border border-accent/20 bg-[#0d1118] shadow-[0_24px_60px_-36px_rgba(217,165,68,0.55)]">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-accent/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 right-0 h-72 w-72 rounded-full bg-blue/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />

        <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)] lg:items-center lg:gap-8">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent-ink">
              <TrophyIcon className="h-3.5 w-3.5" />
              Tournament hub
            </div>
            <h2
              id="community-tournaments-heading"
              className="mt-4 max-w-xl font-display text-2xl font-black tracking-tight text-ink sm:text-3xl"
            >
              Community tournaments
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft sm:text-[15px]">
              Browse every competition hosted by this community and open a card for schedules, entrants, and full details.
            </p>

            {canManage ? (
              <Link
                href={`/dashboard/efootball/tournaments/create?communityId=${communityId}`}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 font-display text-sm font-bold text-bg shadow-[0_10px_28px_-14px_rgba(217,165,68,0.9)] transition-all hover:-translate-y-0.5 hover:bg-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto"
              >
                <PlusIcon className="h-4 w-4" />
                {t.dashboard.shell.navCreateTournament}
              </Link>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              {
                label: "Total",
                value: tournaments.length,
                icon: BracketIcon,
                cardClass: "border-accent/25 bg-accent/10",
                iconClass: "bg-accent/15 text-accent-ink",
                valueClass: "text-accent-ink",
              },
              {
                label: "Open",
                value: openCount,
                icon: UsersIcon,
                cardClass: "border-success/25 bg-success-soft/60",
                iconClass: "bg-success/15 text-success-ink",
                valueClass: "text-success-ink",
              },
              {
                label: "Live",
                value: liveCount,
                icon: FlameIcon,
                cardClass: "border-danger/25 bg-danger-soft/60",
                iconClass: "bg-danger/15 text-danger-ink",
                valueClass: "text-danger-ink",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`relative overflow-hidden rounded-2xl border p-3 backdrop-blur-sm sm:p-4 ${stat.cardClass}`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.iconClass}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div className={`mt-5 font-display text-2xl font-black leading-none sm:text-3xl ${stat.valueClass}`}>
                  {stat.value}
                </div>
                <div className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft">
                  {stat.label}
                </div>
                {stat.label === "Live" && stat.value > 0 ? (
                  <span
                    className="absolute right-3 top-3 h-2 w-2 rounded-full bg-danger motion-safe:animate-pulse"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0" role="group" aria-label="Filter tournaments by status">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {FILTERS.map((filter) => {
                const count = filter.statuses
                  ? prizeFilteredTournaments.filter((tournament) => filter.statuses?.includes(getStatus(tournament))).length
                  : prizeFilteredTournaments.length;
                const active = activeFilter === filter.key;

                return (
                  <button
                    key={filter.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectFilter(filter.key)}
                    className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto sm:px-4 ${
                      active
                        ? "border-accent bg-accent-soft text-accent-ink"
                        : "border-surface-line bg-surface/40 text-ink-soft hover:border-surface-line-strong hover:text-ink"
                    }`}
                  >
                    {filter.label}
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
                        active ? "bg-accent/15 text-accent-ink" : "bg-surface-line/70 text-ink-faint"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
            <button
              type="button"
              aria-expanded={showPrizeFilter}
              aria-controls="community-prize-filter"
              onClick={() => setShowPrizeFilter((visible) => !visible)}
              className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto ${
                hasPrizeFilter
                  ? "border-accent bg-accent-soft text-accent-ink"
                  : "border-surface-line bg-surface/40 text-ink-soft hover:border-surface-line-strong hover:text-ink"
              }`}
            >
              <FilterIcon className="h-4 w-4" />
              {hasPrizeFilter
                ? `BDT ${minPrize.toLocaleString()}–${effectiveMaxPrize.toLocaleString()}`
                : "Prize range"}
            </button>

            {filteredTournaments.length > 0 ? (
              <p className="text-center font-mono text-xs text-ink-faint sm:text-left" aria-live="polite">
                Showing {firstItemIndex + 1}–{Math.min(firstItemIndex + ITEMS_PER_PAGE, filteredTournaments.length)} of{" "}
                {filteredTournaments.length}
              </p>
            ) : null}
          </div>
        </div>

        {showPrizeFilter ? (
          <div id="community-prize-filter" className="rounded-2xl border border-surface-line bg-surface/45 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-display text-sm font-bold text-ink">Prize money</h3>
                <p className="mt-1 text-xs text-ink-soft">Show tournaments within this prize-pool range.</p>
              </div>
              <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                <span className="rounded-full bg-accent-soft px-3 py-1 font-mono text-xs font-semibold text-accent-ink">
                  BDT {minPrize.toLocaleString()} – {effectiveMaxPrize.toLocaleString()}
                </span>
                {hasPrizeFilter ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMinPrize(0);
                      setMaxPrize(null);
                      setMinPrizeInput("0");
                      setMaxPrizeInput(null);
                      setPage(1);
                    }}
                    className="min-h-11 px-2 text-sm font-semibold text-ink-soft transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Reset
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.55fr)] lg:items-end">
              <div>
                <div className="relative h-8">
                  <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-surface-line" />
                  <div
                    className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent"
                    style={{ left: `${minPrizePercent}%`, right: `${100 - maxPrizePercent}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={prizeCeiling}
                    step={100}
                    value={minPrize}
                    onChange={(event) => updateMinPrize(Number(event.target.value))}
                    aria-label="Minimum prize money"
                    className="range-thumb pointer-events-none absolute inset-0 w-full appearance-none bg-transparent"
                  />
                  <input
                    type="range"
                    min={0}
                    max={prizeCeiling}
                    step={100}
                    value={effectiveMaxPrize}
                    onChange={(event) => updateMaxPrize(Number(event.target.value))}
                    aria-label="Maximum prize money"
                    className="range-thumb pointer-events-none absolute inset-0 w-full appearance-none bg-transparent"
                  />
                </div>
                <div className="mt-1 flex items-center justify-between font-mono text-xs text-ink-faint">
                  <span>BDT 0</span>
                  <span>BDT {prizeCeiling.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Minimum prize</span>
                  <span className="relative block">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-mono text-xs text-ink-faint">BDT</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={effectiveMaxPrize}
                      step={100}
                      value={minPrizeInput}
                      onChange={(event) => changeMinPrizeInput(event.target.value)}
                      onBlur={commitMinPrizeInput}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") event.currentTarget.blur();
                      }}
                      className="min-h-11 w-full rounded-xl border border-surface-line-strong bg-bg/65 py-2 pl-12 pr-3 font-mono text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                      aria-label="Minimum prize amount in BDT"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Maximum prize</span>
                  <span className="relative block">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-mono text-xs text-ink-faint">BDT</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={minPrize}
                      max={prizeCeiling}
                      step={100}
                      value={maxPrizeInput ?? String(effectiveMaxPrize)}
                      onChange={(event) => changeMaxPrizeInput(event.target.value)}
                      onBlur={commitMaxPrizeInput}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") event.currentTarget.blur();
                      }}
                      className="min-h-11 w-full rounded-xl border border-surface-line-strong bg-bg/65 py-2 pl-12 pr-3 font-mono text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                      aria-label="Maximum prize amount in BDT"
                    />
                  </span>
                </label>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {visibleTournaments.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleTournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              href={`/dashboard/efootball/community/${communityId}/tournaments/${tournament.id}`}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-surface-line-strong bg-surface/25 px-6 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-surface-line/60 text-ink-soft">
            <TrophyIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-display text-base font-bold text-ink">
            {tournaments.length === 0
              ? t.dashboard.tournaments.noTournaments || "No tournaments yet"
              : hasPrizeFilter
                ? "No tournaments in this prize range"
                : `No ${selectedFilter.label.toLowerCase()} tournaments`}
          </h3>
          <p className="mt-1 text-sm text-ink-soft">
            {tournaments.length === 0
              ? "New tournaments hosted by this community will appear here."
              : "Try another status or clear the prize range."}
          </p>
          {tournaments.length > 0 ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 min-h-11 rounded-full border border-accent/50 bg-accent-soft px-5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      )}

      {totalPages > 1 ? (
        <nav className="flex flex-col items-center justify-between gap-3 border-t border-surface-line pt-5 sm:flex-row" aria-label="Tournament pages">
          <p className="font-mono text-xs text-ink-faint">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage === 1}
              className="min-h-11 rounded-lg border border-surface-line bg-surface/40 px-4 text-sm font-semibold text-ink-soft transition-colors hover:border-surface-line-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            {visiblePages.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                aria-label={`Go to page ${pageNumber}`}
                aria-current={currentPage === pageNumber ? "page" : undefined}
                onClick={() => setPage(pageNumber)}
                className={`h-11 min-w-11 rounded-lg border px-3 font-mono text-sm font-semibold transition-colors ${
                  currentPage === pageNumber
                    ? "border-accent bg-accent text-bg"
                    : "border-surface-line bg-surface/40 text-ink-soft hover:border-surface-line-strong hover:text-ink"
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={currentPage === totalPages}
              className="min-h-11 rounded-lg border border-surface-line bg-surface/40 px-4 text-sm font-semibold text-ink-soft transition-colors hover:border-surface-line-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </nav>
      ) : null}
    </section>
  );
}
