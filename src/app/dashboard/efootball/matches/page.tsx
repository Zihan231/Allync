"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockMatches } from "@/lib/mock/store";
import type { Match } from "@/lib/mock/types";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatTile } from "@/components/dashboard/StatTile";
import { MatchCard } from "@/components/dashboard/MatchCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Pagination } from "@/components/dashboard/Pagination";
import { CalendarIcon, BellIcon, ShieldIcon, GavelIcon } from "@/components/icons";

type FilterKey = "all" | "pending_submission" | "awaiting_opponent" | "verified" | "disputed";

const filters: FilterKey[] = ["all", "pending_submission", "awaiting_opponent", "verified", "disputed"];
const PAGE_SIZE = 9;

export default function MatchesPage() {
  const { t } = useLanguage();
  const allMatches = useMockMatches();
  const matches = useMemo(() => allMatches.filter((m) => m.game === "efootball"), [allMatches]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the filter changes, adjusted during render rather
  // than in a useEffect (the project's lint config flags setState-in-effect).
  const [prevFilter, setPrevFilter] = useState(filter);
  if (filter !== prevFilter) {
    setPrevFilter(filter);
    setPage(1);
  }

  const filterLabel: Record<FilterKey, string> = {
    all: t.dashboard.matches.filterAll,
    pending_submission: t.dashboard.matches.filterPending,
    awaiting_opponent: t.dashboard.matches.filterAwaiting,
    verified: t.dashboard.matches.filterVerified,
    disputed: t.dashboard.matches.filterDisputed,
  };

  const filtered = filter === "all" ? matches : matches.filter((m) => m.status === filter);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    const pendingCount = matches.filter((m) => m.status === "unplayed" || m.status === "pending_submission").length;
    const verifiedCount = matches.filter((m) => m.status === "verified").length;
    const disputedCount = matches.filter((m) => m.status === "disputed").length;
    return { pendingCount, verifiedCount, disputedCount };
  }, [matches]);

  return (
    <div className="relative">
      <div className="glow-blue pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[600px] -translate-x-1/2 blur-[100px] opacity-30" />

      <PageHeader eyebrow="eFootball" title={t.dashboard.shell.navMatches} />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatTile label={t.dashboard.matches.filterPending} value={String(stats.pendingCount)} icon={BellIcon} />
        <StatTile label={t.dashboard.matches.filterVerified} value={String(stats.verifiedCount)} icon={ShieldIcon} />
        <StatTile label={t.dashboard.matches.filterDisputed} value={String(stats.disputedCount)} icon={GavelIcon} />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "border-accent bg-accent-soft text-accent-ink"
                : "border-surface-line-strong text-ink-soft hover:text-ink"
            }`}
          >
            {filterLabel[f]}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {filtered.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((m: Match) => (
                <MatchCard key={m.id} match={m} href={`/dashboard/efootball/matches/${m.id}`} />
              ))}
            </div>
            <div className="mt-6">
              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
            </div>
          </>
        ) : (
          <EmptyState icon={CalendarIcon} title={t.dashboard.matches.noMatches} body="" />
        )}
      </div>
    </div>
  );
}
