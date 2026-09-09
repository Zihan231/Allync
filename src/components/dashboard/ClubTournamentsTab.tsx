"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Tournament } from "@/lib/mock/types";
import { TournamentCard } from "./TournamentCard";
import { EmptyState } from "./EmptyState";
import { SectionHeading } from "./SectionHeading";
import { Pagination } from "./Pagination";
import { TrophyIcon, PlusIcon } from "../icons";

const STATUS_TONE = { live: "danger", open: "blue", completed: "accent" } as const;
const STATUS_ORDER: Tournament["status"][] = ["live", "open", "completed"];
const STATUS_RANK: Record<Tournament["status"], number> = { live: 0, open: 1, completed: 2 };
const PAGE_SIZE = 6;

export function ClubTournamentsTab({
  tournaments,
  clubId,
  canManage,
}: {
  tournaments: Tournament[];
  clubId: string;
  canManage: boolean;
}) {
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const createHref = `/dashboard/efootball/tournaments/create?clubId=${clubId}`;

  if (tournaments.length === 0) {
    return (
      <EmptyState
        icon={TrophyIcon}
        title={t.dashboard.tournaments.noTournaments}
        body=""
        action={canManage ? { label: t.dashboard.shell.navCreateTournament, href: createHref } : undefined}
      />
    );
  }

  const statusLabel: Record<Tournament["status"], string> = {
    open: t.dashboard.tournaments.statusOpen,
    live: t.dashboard.tournaments.statusLive,
    completed: t.dashboard.tournaments.statusCompleted,
  };

  // Live first, then open, then completed — same priority as the section order
  // below — so a page boundary never straddles a status group unpredictably.
  const sorted = [...tournaments].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="relative">
      <div className="glow-gold pointer-events-none absolute -top-6 left-1/3 -z-10 h-72 w-[420px] -translate-x-1/2 blur-[100px] opacity-20" />

      {canManage ? (
        <div className="mb-6 flex justify-end">
          <Link
            href={createHref}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 font-display text-sm font-semibold text-bg shadow-[0_0_20px_rgba(217,165,68,0.3)] transition-transform hover:-translate-y-0.5"
          >
            <PlusIcon className="h-4 w-4" />
            {t.dashboard.shell.navCreateTournament}
          </Link>
        </div>
      ) : null}

      <div className="space-y-8">
        {STATUS_ORDER.map((status) => {
          const list = pageItems.filter((tour) => tour.status === status);
          if (list.length === 0) return null;
          return (
            <div key={status}>
              <SectionHeading tone={STATUS_TONE[status]}>{statusLabel[status]}</SectionHeading>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((tour) => (
                  <TournamentCard key={tour.id} tournament={tour} href={`/dashboard/efootball/tournaments/${tour.id}`} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </div>
    </div>
  );
}
