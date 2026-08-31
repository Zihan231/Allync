"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockTournaments } from "@/lib/mock/store";
import { games } from "@/lib/games";
import type { GameId } from "@/lib/session/SessionContext";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TournamentListItem } from "@/components/dashboard/TournamentListItem";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TrophyIcon, PlusIcon } from "@/components/icons";
import Link from "next/link";

export default function OrganizerTournamentsPage() {
  const { t } = useLanguage();
  const tournaments = useMockTournaments();
  const [gameFilter, setGameFilter] = useState<GameId | "all">("all");

  const filtered = gameFilter === "all" ? tournaments : tournaments.filter((tour) => tour.game === gameFilter);

  return (
    <div>
      <PageHeader
        eyebrow={t.dashboard.shell.modeOrganizer}
        title={t.dashboard.shell.navMyTournaments}
        action={
          <Link
            href="/dashboard/organizer/tournaments/create"
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 font-display text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5"
          >
            <PlusIcon className="h-4 w-4" />
            {t.dashboard.organizer.myTournaments.createButton}
          </Link>
        }
      />

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setGameFilter("all")}
          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
            gameFilter === "all"
              ? "border-accent bg-accent-soft text-accent-ink"
              : "border-surface-line-strong text-ink-soft hover:text-ink"
          }`}
        >
          {t.dashboard.organizer.myTournaments.gameFilterAll}
        </button>
        {games.map((g) => (
          <button
            key={g.id}
            onClick={() => setGameFilter(g.id)}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              gameFilter === g.id
                ? "border-accent bg-accent-soft text-accent-ink"
                : "border-surface-line-strong text-ink-soft hover:text-ink"
            }`}
          >
            <g.icon className="h-3.5 w-3.5" style={{ color: g.color }} />
            {g.name}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {filtered.length > 0 ? (
          filtered.map((tour) => (
            <TournamentListItem
              key={tour.id}
              tournament={tour}
              href={`/dashboard/organizer/tournaments/${tour.id}`}
            />
          ))
        ) : (
          <EmptyState icon={TrophyIcon} title={t.dashboard.tournaments.noTournaments} body="" />
        )}
      </div>
    </div>
  );
}
