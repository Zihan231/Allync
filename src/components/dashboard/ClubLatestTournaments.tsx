"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTournaments } from "@/lib/api/hooks/useTournaments";
import { tournamentHref, type BackendTournament } from "@/lib/api/tournaments";
import { Avatar } from "../common/Avatar";
import { ArrowRightIcon, CalendarIcon, TrophyIcon, UsersIcon, WalletIcon } from "../icons";

const MAX_SHOWN = 4;
const RANK = { live: 0, upcoming: 1, completed: 2 } as const;

function groupOf(status: string | undefined): keyof typeof RANK {
  const s = (status ?? "").toLowerCase();
  if (s === "ongoing" || s === "live") return "live";
  if (s === "completed" || s === "cancelled") return "completed";
  return "upcoming";
}

const startMs = (tour: BackendTournament) => new Date(tour.startAt).getTime() || 0;

// Theme tokens only. Full class strings so Tailwind picks them up.
const TONES = {
  live: {
    card: "border-danger/35 from-danger/[0.10]",
    edge: "bg-danger",
    pill: "bg-danger-soft text-danger-ink",
    dot: "bg-danger animate-pulse",
  },
  open: {
    card: "border-success/30 from-success/[0.08]",
    edge: "bg-success",
    pill: "bg-success-soft text-success-ink",
    dot: "bg-success",
  },
  fixtures: {
    card: "border-warning/30 from-warning/[0.08]",
    edge: "bg-warning",
    pill: "bg-warning-soft text-warning-ink",
    dot: "bg-warning",
  },
  completed: {
    card: "border-accent/35 from-accent/[0.10]",
    edge: "bg-accent",
    pill: "bg-accent-soft text-accent-ink",
    dot: "bg-accent",
  },
  closed: {
    card: "border-surface-line-strong from-surface-line/30",
    edge: "bg-ink-faint",
    pill: "bg-surface-line text-ink-soft",
    dot: "bg-ink-faint",
  },
} as const;

/**
 * A strip of the club's latest tournaments (hosted or entered): live first,
 * then upcoming (soonest), then recently finished. "View all" opens the
 * Tournaments tab.
 */
export function ClubLatestTournaments({ clubId, onViewAll }: { clubId: string; onViewAll: () => void }) {
  const { t, locale } = useLanguage();
  const m = t.dashboard.myTournaments;
  const tc = t.dashboard.tournamentCard;
  // Same queries as the Tournaments tab, so switching tabs reuses the cache.
  const hosted = useTournaments({ hostClubId: clubId });
  const entered = useTournaments({ clubId });

  const hostedIds = new Set((hosted.data ?? []).map((tour) => tour.id));
  const latest = [...(hosted.data ?? []), ...(entered.data ?? []).filter((tour) => !hostedIds.has(tour.id))]
    .sort((a, b) => {
      const ga = groupOf(a.status);
      const gb = groupOf(b.status);
      if (ga !== gb) return RANK[ga] - RANK[gb];
      return ga === "completed" ? startMs(b) - startMs(a) : startMs(a) - startMs(b);
    })
    .slice(0, MAX_SHOWN);

  if (hosted.isLoading || entered.isLoading || latest.length === 0) return null;

  const dateLocale = locale === "bn" ? "bn-BD" : "en-US";
  const statusOf = (tour: BackendTournament) => {
    const s = (tour.status ?? "").toLowerCase();
    if (s === "ongoing" || s === "live") return { label: tc.live, tone: TONES.live };
    if (s === "registration_open" || s === "open") return { label: tc.registrationOpen, tone: TONES.open };
    if (s === "submission_phase") return { label: tc.fixturesOut, tone: TONES.fixtures };
    if (s === "completed") return { label: tc.completed, tone: TONES.completed };
    return { label: tc.registrationClosed, tone: TONES.closed };
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-display text-base font-black text-ink">
          <TrophyIcon className="h-4.5 w-4.5 text-accent" />
          {m.clubLatestTitle}
        </h3>
        <button
          type="button"
          onClick={onViewAll}
          className="group inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-3.5 py-1.5 text-xs font-bold text-accent-ink transition-colors hover:bg-accent hover:text-bg"
        >
          {m.clubViewAll}
          <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {latest.map((tour) => {
          const { label, tone } = statusOf(tour);
          const isHosted = hostedIds.has(tour.id);
          const host = tour.hostClub ?? tour.community ?? null;
          const champion = groupOf(tour.status) === "completed" ? tour.champion : null;
          const entrants = tour.participantCount ?? tour.participants?.length ?? 0;
          const format = tour.type === "cvc" ? `${tour.startersCount} v ${tour.startersCount}` : "1 v 1";
          return (
            <Link
              key={tour.id}
              href={tournamentHref(tour)}
              className={`group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-gradient-to-b to-surface/60 p-4 pl-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(0,0,0,0.9)] ${tone.card}`}
            >
              {/* Status edge */}
              <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${tone.edge}`} />

              {/* Host crest + title */}
              <div className="flex min-w-0 items-center gap-3">
                <Avatar dpUrl={host?.dpUrl ?? null} name={host?.name ?? tour.name} size="md" mode="static" />
                <div className="min-w-0">
                  <div className="truncate font-display text-[15px] font-black leading-tight text-ink transition-colors group-hover:text-accent-ink">
                    {tour.name}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] font-medium text-ink-faint">{host?.name}</div>
                </div>
              </div>

              {/* Key facts */}
              <div className="mb-4 mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                <span className="rounded-md border border-surface-line-strong bg-bg/40 px-1.5 py-0.5 font-mono text-ink-soft">
                  {tour.type === "cvc" ? "CvC" : "PvP"} · {format}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-surface-line-strong bg-bg/40 px-1.5 py-0.5 font-mono text-ink-soft">
                  <UsersIcon className="h-3 w-3" />
                  {entrants}/{tour.maxParticipants}
                </span>
                {tour.prizePoolBdt > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-accent/30 bg-accent-soft px-1.5 py-0.5 font-mono text-accent-ink">
                    <WalletIcon className="h-3 w-3" />৳{tour.prizePoolBdt.toLocaleString()}
                  </span>
                ) : null}
                <span
                  className={`rounded-md px-1.5 py-0.5 ${isHosted ? "bg-blue-soft text-blue-ink" : "bg-surface-line text-ink-soft"}`}
                >
                  {isHosted ? m.clubBadgeHosted : m.clubBadgeEntered}
                </span>
              </div>

              {/* Status + date, or the champion */}
              <div className="mt-auto flex items-center justify-between gap-2 border-t border-surface-line/70 pt-3">
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${tone.pill}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                  {label}
                </span>
                {champion ? (
                  <span className="flex min-w-0 items-center gap-1.5">
                    <TrophyIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
                    <span className="truncate text-xs font-black text-accent-ink">{champion.name}</span>
                  </span>
                ) : (
                  <span className="flex min-w-0 items-center gap-1 truncate font-mono text-[11px] text-ink-soft">
                    <CalendarIcon className="h-3 w-3 shrink-0 text-accent" />
                    {new Date(tour.startAt).toLocaleString(dateLocale, {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
