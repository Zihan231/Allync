"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTournaments } from "@/lib/api/hooks/useTournaments";
import { tournamentHref, type BackendTournament } from "@/lib/api/tournaments";
import { Avatar } from "../common/Avatar";
import { ArrowRightIcon, CalendarIcon, TrophyIcon } from "../icons";

const MAX_SHOWN = 4;
const RANK = { live: 0, upcoming: 1, completed: 2 } as const;

function groupOf(status: string | undefined): keyof typeof RANK {
  const s = (status ?? "").toLowerCase();
  if (s === "ongoing" || s === "live") return "live";
  if (s === "completed" || s === "cancelled") return "completed";
  return "upcoming";
}

const startMs = (tour: BackendTournament) => new Date(tour.startAt).getTime() || 0;

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
  const all = [...(hosted.data ?? []), ...(entered.data ?? []).filter((tour) => !hostedIds.has(tour.id))];
  const latest = all
    .sort((a, b) => {
      const ga = groupOf(a.status);
      const gb = groupOf(b.status);
      if (ga !== gb) return RANK[ga] - RANK[gb];
      return ga === "completed" ? startMs(b) - startMs(a) : startMs(a) - startMs(b);
    })
    .slice(0, MAX_SHOWN);

  if (hosted.isLoading || entered.isLoading || latest.length === 0) return null;

  const dateLocale = locale === "bn" ? "bn-BD" : "en-US";
  const status = (tour: BackendTournament) => {
    const s = (tour.status ?? "").toLowerCase();
    if (s === "ongoing" || s === "live") return { label: tc.live, className: "border-danger/40 bg-danger-soft text-danger-ink", dot: "bg-danger animate-pulse" };
    if (s === "registration_open" || s === "open") return { label: tc.registrationOpen, className: "border-success/40 bg-success-soft text-success-ink", dot: "bg-success" };
    if (s === "submission_phase") return { label: tc.fixturesOut, className: "border-warning/40 bg-warning-soft text-warning-ink", dot: "bg-warning" };
    if (s === "completed") return { label: tc.completed, className: "border-accent/40 bg-accent-soft text-accent-ink", dot: "bg-accent" };
    return { label: tc.registrationClosed, className: "border-surface-line-strong bg-surface-line/40 text-ink-soft", dot: "bg-ink-faint" };
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {latest.map((tour) => {
          const st = status(tour);
          const isHosted = hostedIds.has(tour.id);
          const host = tour.hostClub?.name ?? tour.community?.name ?? "";
          const champion = groupOf(tour.status) === "completed" ? tour.champion : null;
          return (
            <Link
              key={tour.id}
              href={tournamentHref(tour)}
              className="group flex min-w-0 flex-col rounded-2xl border border-surface-line bg-surface/60 p-3.5 transition-all hover:-translate-y-0.5 hover:border-accent/60"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold ${st.className}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                  {st.label}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isHosted ? "bg-blue-soft text-blue-ink" : "bg-surface-line text-ink-soft"
                  }`}
                >
                  {isHosted ? m.clubBadgeHosted : m.clubBadgeEntered}
                </span>
              </div>
              <div className="mt-2.5 truncate font-display text-sm font-black text-ink group-hover:text-accent-ink">
                {tour.name}
              </div>
              <div className="mt-0.5 truncate text-[11px] text-ink-faint">
                {tour.type === "cvc" ? `CvC · ${tour.startersCount} v ${tour.startersCount}` : "PvP · 1 v 1"}
                {host ? ` · ${host}` : ""}
              </div>
              <div className="mt-auto pt-3">
                {champion ? (
                  <div className="flex min-w-0 items-center gap-2 rounded-lg bg-accent-soft/60 px-2 py-1.5">
                    <TrophyIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
                    <Avatar dpUrl={champion.dpUrl} name={champion.name} size="sm" mode="static" />
                    <span className="truncate text-xs font-bold text-ink">{champion.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-ink-soft">
                    <CalendarIcon className="h-3.5 w-3.5 text-accent" />
                    {new Date(tour.startAt).toLocaleString(dateLocale, {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
