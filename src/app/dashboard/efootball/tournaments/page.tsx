"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockTournaments } from "@/lib/mock/store";
import type { TournamentFormat } from "@/lib/mock/types";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TournamentListItem } from "@/components/dashboard/TournamentListItem";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TrophyIcon } from "@/components/icons";

const filters: (TournamentFormat | "all")[] = ["all", "default", "custom", "clubVsClub", "open"];

export default function TournamentsPage() {
  const { t } = useLanguage();
  const tournaments = useMockTournaments().filter((tour) => tour.game === "efootball");
  const [filter, setFilter] = useState<TournamentFormat | "all">("all");

  const filterLabel: Record<TournamentFormat | "all", string> = {
    all: t.dashboard.tournaments.filterAll,
    default: t.dashboard.tournaments.filterDefault,
    custom: t.dashboard.tournaments.filterCustom,
    clubVsClub: t.dashboard.tournaments.filterClubVsClub,
    open: t.dashboard.tournaments.filterOpen,
  };

  const filtered = filter === "all" ? tournaments : tournaments.filter((tour) => tour.format === filter);

  return (
    <div>
      <PageHeader eyebrow="eFootball" title={t.dashboard.shell.navTournaments} />

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
          filtered.map((tour) => (
            <TournamentListItem key={tour.id} tournament={tour} href={`/dashboard/efootball/tournaments/${tour.id}`} />
          ))
        ) : (
          <EmptyState icon={TrophyIcon} title={t.dashboard.tournaments.noTournaments} body="" />
        )}
      </div>
    </div>
  );
}
