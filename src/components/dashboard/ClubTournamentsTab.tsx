"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTournaments } from "@/lib/api/hooks/useTournaments";
import { tournamentHref, type BackendTournament } from "@/lib/api/tournaments";
import { format } from "@/lib/i18n/translations";
import { Avatar } from "../common/Avatar";
import { TournamentCard } from "./TournamentCard";
import { EmptyState } from "./EmptyState";
import { Pagination } from "./Pagination";
import { ArrowRightIcon, PlusIcon, TrophyIcon, UsersIcon } from "../icons";

type Group = "live" | "upcoming" | "completed";

const GROUP_DOT = { live: "bg-danger", upcoming: "bg-blue", completed: "bg-accent" } as const;
const GROUP_ORDER: Group[] = ["live", "upcoming", "completed"];
const GROUP_RANK = { live: 0, upcoming: 1, completed: 2 } as const;
/** One row of cards per page keeps each section short. */
const PAGE_SIZE = 3;

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
        <h3 className="mb-1 flex items-center gap-2 font-display text-lg font-black text-ink">
          <UsersIcon className="h-5 w-5 text-accent" />
          {m.clubCommunityTitle}
        </h3>
        <p className="mb-5 text-xs text-ink-faint">{m.clubCommunityHint}</p>
        {enteredList.length ? (
          <div className="space-y-6">
            {byCommunity(enteredList).map((group) => (
              <CommunitySection key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <EmptyState icon={TrophyIcon} title={m.clubEmptyTitle} body={m.clubEmptyBody} />
        )}
      </section>
    </div>
  );
}

type CommunityGroup = {
  id: string;
  name: string;
  dpUrl: string | null;
  tournaments: BackendTournament[];
  live: number;
};

/** The club's entered tournaments per hosting community: communities with live play first, then most recent. */
function byCommunity(tournaments: BackendTournament[]): CommunityGroup[] {
  const groups = new Map<string, CommunityGroup>();
  for (const tour of tournaments) {
    const id = tour.communityId ?? tour.community?.id ?? "unknown";
    const group = groups.get(id) ?? {
      id,
      name: tour.community?.name ?? "",
      dpUrl: tour.community?.dpUrl ?? null,
      tournaments: [],
      live: 0,
    };
    group.tournaments.push(tour);
    if (groupOf(tour.status) === "live") group.live++;
    groups.set(id, group);
  }
  const latest = (g: CommunityGroup) => Math.max(...g.tournaments.map(startMs));
  return [...groups.values()].sort((a, b) => b.live - a.live || latest(b) - latest(a));
}

/** One community's tournaments, under a header with its crest, name and a link to the community. */
function CommunitySection({ group }: { group: CommunityGroup }) {
  const { t } = useLanguage();
  const m = t.dashboard.myTournaments;
  return (
    <div className="rounded-3xl border border-surface-line bg-surface/30 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-surface-line/70 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar dpUrl={group.dpUrl} name={group.name} size="md" mode="static" />
          <div className="min-w-0">
            <div className="truncate font-display text-base font-black text-ink">{group.name}</div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-faint">
              <span>{format(m.clubCommunityCount, { count: group.tournaments.length })}</span>
              {group.live ? (
                <span className="inline-flex items-center gap-1 font-bold text-danger-ink">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-danger" />
                  {format(m.clubCommunityLive, { count: group.live })}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        {group.id !== "unknown" ? (
          <Link
            href={`/dashboard/efootball/community/${group.id}?tab=tournaments`}
            className="inline-flex items-center gap-1 rounded-full border border-surface-line-strong px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-accent hover:text-accent-ink"
          >
            {m.clubCommunityOpen}
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
      <GroupedTournaments tournaments={group.tournaments} />
    </div>
  );
}

/**
 * One section's tournaments: status filter pills (with counts) and one row of
 * cards per page. Order: live first, then upcoming (soonest), then finished (latest).
 */
function GroupedTournaments({ tournaments }: { tournaments: BackendTournament[] }) {
  const { t } = useLanguage();
  const m = t.dashboard.myTournaments;
  const [filter, setFilter] = useState<Group | "all">("all");
  const [page, setPage] = useState(1);

  const filterLabel: Record<Group | "all", string> = {
    all: m.statusAll,
    live: m.statusLive,
    upcoming: m.statusUpcoming,
    completed: m.statusCompleted,
  };
  const counts = { all: tournaments.length, live: 0, upcoming: 0, completed: 0 };
  for (const tour of tournaments) counts[groupOf(tour.status)]++;

  const sorted = tournaments
    .filter((tour) => filter === "all" || groupOf(tour.status) === filter)
    .sort((a, b) => {
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
      <div className="mb-4 flex flex-wrap items-center gap-1 rounded-lg border border-surface-line bg-surface/50 p-1 text-xs sm:inline-flex">
        {(["all", ...GROUP_ORDER] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setFilter(key);
              setPage(1);
            }}
            disabled={key !== "all" && counts[key] === 0}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition-colors disabled:opacity-40 ${
              filter === key ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"
            }`}
          >
            {key !== "all" ? <span className={`h-1.5 w-1.5 rounded-full ${GROUP_DOT[key]}`} /> : null}
            {filterLabel[key]}
            <span className="opacity-70">({counts[key]})</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pageItems.map((tour) => (
          <TournamentCard key={tour.id} tournament={tour} href={tournamentHref(tour)} showRelation={false} />
        ))}
      </div>

      {pageCount > 1 ? (
        <div className="mt-5">
          <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
        </div>
      ) : null}
    </>
  );
}
