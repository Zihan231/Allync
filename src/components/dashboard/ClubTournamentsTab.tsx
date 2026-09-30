"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTournaments } from "@/lib/api/hooks/useTournaments";
import { tournamentHref, type BackendTournament } from "@/lib/api/tournaments";
import { TournamentCard } from "./TournamentCard";
import { EmptyState } from "./EmptyState";
import { SectionHeading } from "./SectionHeading";
import { Pagination } from "./Pagination";
import { PlusIcon, TrophyIcon, UsersIcon } from "../icons";

type Group = "live" | "upcoming" | "completed";

const GROUP_TONE = { live: "danger", upcoming: "blue", completed: "accent" } as const;
const GROUP_ORDER: Group[] = ["live", "upcoming", "completed"];
const GROUP_RANK = { live: 0, upcoming: 1, completed: 2 } as const;
const PAGE_SIZE = 6;

function groupOf(status: string | undefined): Group {
  const s = (status ?? "").toLowerCase();
  if (s === "ongoing" || s === "live") return "live";
  if (s === "completed" || s === "cancelled") return "completed";
  return "upcoming";
}

const startMs = (tour: BackendTournament) => new Date(tour.startAt).getTime() || 0;

/**
 * A club's tournaments: the PvP tournaments it hosts for its members (its
 * President / General Secretary create them here), and the community
 * tournaments it has entered.
 */
export function ClubTournamentsTab({ clubId, canCreate }: { clubId: string; canCreate: boolean }) {
  const { t } = useLanguage();
  const m = t.dashboard.myTournaments;
  const hosted = useTournaments({ hostClubId: clubId });
  const entered = useTournaments({ clubId });

  if (hosted.isLoading || entered.isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const hostedList = hosted.data ?? [];
  const enteredList = entered.data ?? [];

  return (
    <div className="relative space-y-12">
      <div className="glow-gold pointer-events-none absolute -top-6 left-1/3 -z-10 h-72 w-[420px] -translate-x-1/2 blur-[100px] opacity-20" />

      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-display text-lg font-black text-ink">
              <TrophyIcon className="h-5 w-5 text-accent" />
              {m.clubHostedTitle}
            </h3>
            <p className="mt-1 text-xs text-ink-faint">{m.clubHostedHint}</p>
          </div>
          {canCreate ? (
            <Link
              href={`/dashboard/efootball/tournaments/create?clubId=${clubId}`}
              className="inline-flex items-center gap-1.5 self-start rounded-full bg-accent px-4 py-2 font-display text-sm font-semibold text-bg shadow-[0_0_20px_rgba(217,165,68,0.3)] transition-transform hover:-translate-y-0.5 sm:self-auto"
            >
              <PlusIcon className="h-4 w-4" />
              {m.clubCreate}
            </Link>
          ) : null}
        </div>
        {hostedList.length ? (
          <GroupedTournaments tournaments={hostedList} />
        ) : (
          <p className="rounded-2xl border border-dashed border-surface-line py-8 text-center text-xs text-ink-faint">
            {m.clubHostedEmpty}
          </p>
        )}
      </section>

      <section>
        <h3 className="mb-5 flex items-center gap-2 font-display text-lg font-black text-ink">
          <UsersIcon className="h-5 w-5 text-accent" />
          {m.clubEnteredTitle}
        </h3>
        {enteredList.length ? (
          <GroupedTournaments tournaments={enteredList} />
        ) : (
          <EmptyState icon={TrophyIcon} title={m.clubEmptyTitle} body={m.clubEmptyBody} />
        )}
      </section>
    </div>
  );
}

/** Live first, then upcoming (soonest first), then finished (latest first, with champions). */
function GroupedTournaments({ tournaments }: { tournaments: BackendTournament[] }) {
  const { t } = useLanguage();
  const m = t.dashboard.myTournaments;
  const [page, setPage] = useState(1);

  const groupLabel: Record<Group, string> = {
    live: m.statusLive,
    upcoming: m.statusUpcoming,
    completed: m.statusCompleted,
  };

  // Sorted in section order, so a page boundary never splits a group unpredictably.
  const sorted = [...tournaments].sort((a, b) => {
    const ga = groupOf(a.status);
    const gb = groupOf(b.status);
    if (ga !== gb) return GROUP_RANK[ga] - GROUP_RANK[gb];
    return ga === "completed" ? startMs(b) - startMs(a) : startMs(a) - startMs(b);
  });
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <div className="space-y-8">
        {GROUP_ORDER.map((group) => {
          const list = pageItems.filter((tour) => groupOf(tour.status) === group);
          if (list.length === 0) return null;
          return (
            <div key={group}>
              <SectionHeading tone={GROUP_TONE[group]}>{groupLabel[group]}</SectionHeading>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((tour) => (
                  <TournamentCard key={tour.id} tournament={tour} href={tournamentHref(tour)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6">
        <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
      </div>
    </>
  );
}
