"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockMatches } from "@/lib/mock/store";
import type { Match } from "@/lib/mock/types";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusPill, type StatusTone } from "@/components/dashboard/StatusPill";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { CalendarIcon } from "@/components/icons";

type FilterKey = "all" | "pending_submission" | "awaiting_opponent" | "verified" | "disputed";

const toneByStatus: Record<Match["status"], StatusTone> = {
  unplayed: "neutral",
  pending_submission: "warning",
  awaiting_opponent: "info",
  verified: "success",
  disputed: "danger",
};

export default function MatchesPage() {
  const { t } = useLanguage();
  const matches = useMockMatches().filter((m) => m.game === "efootball");
  const [filter, setFilter] = useState<FilterKey>("all");

  const filters: FilterKey[] = ["all", "pending_submission", "awaiting_opponent", "verified", "disputed"];
  const filterLabel: Record<FilterKey, string> = {
    all: t.dashboard.matches.filterAll,
    pending_submission: t.dashboard.matches.filterPending,
    awaiting_opponent: t.dashboard.matches.filterAwaiting,
    verified: t.dashboard.matches.filterVerified,
    disputed: t.dashboard.matches.filterDisputed,
  };
  const statusLabel: Record<Match["status"], string> = {
    unplayed: filterLabel.all,
    pending_submission: filterLabel.pending_submission,
    awaiting_opponent: filterLabel.awaiting_opponent,
    verified: filterLabel.verified,
    disputed: filterLabel.disputed,
  };

  const filtered = filter === "all" ? matches : matches.filter((m) => m.status === filter);

  return (
    <div>
      <PageHeader eyebrow="eFootball" title={t.dashboard.shell.navMatches} />

      <div className="mt-6 flex flex-wrap gap-2">
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

      <div className="mt-6 space-y-2">
        {filtered.length > 0 ? (
          filtered.map((m) => (
            <Link
              key={m.id}
              href={`/dashboard/efootball/matches/${m.id}`}
              className="flex items-center justify-between rounded-xl border border-surface-line bg-surface/40 p-4 transition-colors hover:border-surface-line-strong"
            >
              <div>
                <div className="text-sm font-medium text-ink">vs {m.opponent}</div>
                <div className="text-xs text-ink-faint">{m.tournamentName} · {m.round}</div>
              </div>
              <StatusPill tone={toneByStatus[m.status]}>{statusLabel[m.status]}</StatusPill>
            </Link>
          ))
        ) : (
          <EmptyState icon={CalendarIcon} title={t.dashboard.matches.noMatches} body="" />
        )}
      </div>
    </div>
  );
}
