"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockTournaments } from "@/lib/mock/store";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TournamentListItem } from "@/components/dashboard/TournamentListItem";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TrophyIcon, PlusIcon } from "@/components/icons";
import Link from "next/link";

export default function OrganizerTournamentsPage() {
  const { t } = useLanguage();
  const tournaments = useMockTournaments();

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

      <div className="mt-6 space-y-2">
        {tournaments.length > 0 ? (
          tournaments.map((tour) => (
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
