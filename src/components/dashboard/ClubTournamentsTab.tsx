"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTournaments } from "@/lib/api/hooks/useTournaments";
import type { BackendTournament } from "@/lib/api/tournaments";
import { TournamentCard } from "./TournamentCard";
import { EmptyState } from "./EmptyState";
import { SectionHeading } from "./SectionHeading";
import { Pagination } from "./Pagination";
import { TrophyIcon } from "../icons";

type Group = "live" | "upcoming" | "completed";

const GROUP_TONE = { live: "danger", upcoming: "blue", completed: "accent" } as const;
const GROUP_ORDER: Group[] = ["live", "upcoming", "completed"];
const PAGE_SIZE = 6;

function groupOf(status: string | undefined): Group {
  const s = (status ?? "").toLowerCase();
  if (s === "ongoing" || s === "live") return "live";
  if (s === "completed" || s === "cancelled") return "completed";
  return "upcoming";
}

const startMs = (tour: BackendTournament) => new Date(tour.startAt).getTime() || 0;

/**
 * The tournaments a club has entered (clubs don't create tournaments — community
 * Presidents / Vice Presidents do, from the community page). Live first, then
 * upcoming (soonest first), then finished ones with their champion (latest first).
 */
export function ClubTournamentsTab({ clubId }: { clubId: string }) {
  const { t } = useLanguage();
  const m = t.dashboard.myTournaments;
  const [page, setPage] = useState(1);
  const { data: tournaments = [], isLoading } = useTournaments({ clubId });

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (tournaments.length === 0) {
    return <EmptyState icon={TrophyIcon} title={m.clubEmptyTitle} body={m.clubEmptyBody} />;
  }

  const groupLabel: Record<Group, string> = {
    live: m.statusLive,
    upcoming: m.statusUpcoming,
    completed: m.statusCompleted,
  };

  // Sorted in section order, so a page boundary never splits a group unpredictably.
  const rank = { live: 0, upcoming: 1, completed: 2 } as const;
  const sorted = [...tournaments].sort((a, b) => {
    const ga = groupOf(a.status);
    const gb = groupOf(b.status);
    if (ga !== gb) return rank[ga] - rank[gb];
    return ga === "completed" ? startMs(b) - startMs(a) : startMs(a) - startMs(b);
  });
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="relative">
      <div className="glow-gold pointer-events-none absolute -top-6 left-1/3 -z-10 h-72 w-[420px] -translate-x-1/2 blur-[100px] opacity-20" />

      <div className="space-y-8">
        {GROUP_ORDER.map((group) => {
          const list = pageItems.filter((tour) => groupOf(tour.status) === group);
          if (list.length === 0) return null;
          return (
            <div key={group}>
              <SectionHeading tone={GROUP_TONE[group]}>{groupLabel[group]}</SectionHeading>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((tour) => (
                  <TournamentCard
                    key={tour.id}
                    tournament={tour}
                    href={`/dashboard/efootball/community/${tour.communityId}/tournaments/${tour.id}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
      </div>
    </div>
  );
}
