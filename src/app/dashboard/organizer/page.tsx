"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useTournaments } from "@/lib/api/hooks/useTournaments";
import { isGeneralTournament, tournamentHref } from "@/lib/api/tournaments";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TournamentCard } from "@/components/dashboard/TournamentCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { CheckIcon, PlusIcon, TrophyIcon, UsersIcon, WalletIcon, FlameIcon } from "@/components/icons";

/**
 * Organizer mode home: the general tournaments this user runs (open to every player
 * and club), with quick stats and a create button.
 */
export default function OrganizerDashboardPage() {
  const { t } = useLanguage();
  const o = t.dashboard.organizerMode;
  const { user, isLoading: isSessionLoading } = useSession();
  const { data, isLoading } = useTournaments({ scope: "hosted" }, isSessionLoading ? null : user?.id);

  // "Hosted" also covers community / club tournaments the user leads; keep the general ones they created.
  const mine = useMemo(
    () =>
      (data ?? [])
        .filter((tour) => isGeneralTournament(tour) && tour.creatorId === user?.id)
        .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()),
    [data, user?.id],
  );
  const stats = {
    tournaments: mine.length,
    entrants: mine.reduce((sum, tour) => sum + (tour.participantCount ?? 0), 0),
    open: mine.filter((tour) => tour.status === "registration_open").length,
    prizes: mine.reduce((sum, tour) => sum + (tour.prizePoolBdt ?? 0), 0),
  };

  const create = (
    <Link
      href="/dashboard/organizer/create"
      className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-display text-sm font-black text-bg shadow-[0_0_20px_rgba(217,165,68,0.35)] transition-transform hover:-translate-y-0.5"
    >
      <PlusIcon className="h-4 w-4" />
      {o.create}
    </Link>
  );

  return (
    <div>
      <PageHeader eyebrow={o.eyebrow} title={o.title} action={create} />

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(
          [
            [o.statTournaments, String(stats.tournaments), TrophyIcon],
            [o.statEntrants, String(stats.entrants), UsersIcon],
            [o.statOpen, String(stats.open), FlameIcon],
            [o.statPrizes, `৳ ${stats.prizes.toLocaleString()}`, WalletIcon],
          ] as const
        ).map(([label, value, Icon]) => (
          <div key={label} className="flex items-center justify-between gap-3 rounded-2xl border border-surface-line bg-surface/50 px-4 py-3.5">
            <div className="min-w-0">
              <div className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">{label}</div>
              <div className="mt-1.5 font-display text-2xl font-black text-ink">{value}</div>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
              <Icon className="h-5 w-5" />
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="min-w-0">
          <h2 className="mb-4 font-display text-base font-black text-ink">{o.myTitle}</h2>
          {isLoading || isSessionLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          ) : mine.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {mine.map((tour) => (
                <TournamentCard key={tour.id} tournament={tour} href={tournamentHref(tour)} showRelation={false} />
              ))}
            </div>
          ) : (
            <EmptyState icon={TrophyIcon} title={o.emptyTitle} body={o.emptyBody} action={{ label: o.create, href: "/dashboard/organizer/create" }} />
          )}
        </section>

        <aside className="h-fit rounded-2xl border border-surface-line bg-surface/50 p-5">
          <h3 className="font-display text-sm font-black text-ink">{o.howTitle}</h3>
          <ul className="mt-3 space-y-3 text-xs leading-relaxed text-ink-soft">
            {[o.how1, o.how2, o.how3, o.how4].map((line) => (
              <li key={line} className="flex gap-2">
                <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-ink" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
