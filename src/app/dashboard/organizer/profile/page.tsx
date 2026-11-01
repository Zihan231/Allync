"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useTournaments } from "@/lib/api/hooks/useTournaments";
import { isGeneralTournament, tournamentHref } from "@/lib/api/tournaments";
import { ProfileModeBar } from "@/components/roles/ProfileModeBar";
import { TournamentCard } from "@/components/dashboard/TournamentCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FlameIcon, PlusIcon, TrophyIcon, UsersIcon, WalletIcon } from "@/components/icons";

/** The organizer side of the account: the general tournaments the user runs, in numbers. */
export default function OrganizerProfilePage() {
  const { t } = useLanguage();
  const tp = t.coaching.profile;
  const { user, isLoading: sessionLoading } = useSession();
  const { data, isLoading } = useTournaments({ scope: "hosted" }, sessionLoading ? null : user?.id);

  const mine = useMemo(
    () =>
      (data ?? [])
        .filter((tour) => isGeneralTournament(tour) && tour.creatorId === user?.id)
        .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()),
    [data, user?.id],
  );
  const stats: Array<[string, string, typeof TrophyIcon]> = [
    [tp.statTournaments, String(mine.length), TrophyIcon],
    [tp.statEntrants, String(mine.reduce((sum, tour) => sum + (tour.participantCount ?? 0), 0)), UsersIcon],
    [tp.statLive, String(mine.filter((tour) => tour.status === "registration_open").length), FlameIcon],
    [tp.statPrizes, `৳ ${mine.reduce((sum, tour) => sum + (tour.prizePoolBdt ?? 0), 0).toLocaleString()}`, WalletIcon],
  ];

  return (
    <div className="space-y-6">
      <ProfileModeBar current="organizer" />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">{tp.organizerTitle}</h1>
          <p className="mt-1 text-sm text-ink-soft">{tp.organizerSubtitle}</p>
        </div>
        <Link
          href="/dashboard/organizer/create"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-display text-sm font-black text-bg"
        >
          <PlusIcon className="h-4 w-4" />
          {tp.createTournament}
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([label, value, Icon]) => (
          <div key={label} className="rounded-2xl border border-surface-line bg-surface/50 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{label}</span>
              <Icon className="h-4 w-4 text-accent-ink" />
            </div>
            <div className="mt-2 font-display text-2xl font-black text-ink">{isLoading ? "…" : value}</div>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-black text-ink">{tp.recent}</h2>
        {mine.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mine.slice(0, 9).map((tour) => (
              <TournamentCard key={tour.id} tournament={tour} href={tournamentHref(tour)} showRelation={false} />
            ))}
          </div>
        ) : isLoading ? null : (
          <EmptyState icon={TrophyIcon} title={tp.organizerEmpty} body="" />
        )}
      </section>
    </div>
  );
}
