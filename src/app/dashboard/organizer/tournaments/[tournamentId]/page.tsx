"use client";

import { use } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockTournaments } from "@/lib/mock/store";
import { getGame } from "@/lib/games";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { AggregateTable } from "@/components/dashboard/AggregateTable";
import { BracketView } from "@/components/dashboard/BracketView";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TrophyIcon } from "@/components/icons";

export default function OrganizerTournamentDetailPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = use(params);
  const { t } = useLanguage();
  const tournament = useMockTournaments().find((tour) => tour.id === tournamentId);

  if (!tournament) {
    return <EmptyState icon={TrophyIcon} title={t.dashboard.tournaments.noTournaments} body="" />;
  }

  const game = getGame(tournament.game);
  const statusTone = tournament.status === "live" ? "danger" : tournament.status === "open" ? "info" : "neutral";
  const statusLabel = {
    open: t.dashboard.tournaments.statusOpen,
    live: t.dashboard.tournaments.statusLive,
    completed: t.dashboard.tournaments.statusCompleted,
  }[tournament.status];

  return (
    <div>
      <PageHeader
        eyebrow={game.name}
        title={tournament.name}
        action={<StatusPill tone={statusTone}>{statusLabel}</StatusPill>}
      />

      <div className="mt-6 flex flex-wrap gap-6 font-mono text-sm text-ink-soft">
        <span>{t.dashboard.tournaments.entrantsLabel}: {tournament.entrants}</span>
        {tournament.prizePoolBdt ? (
          <span>{t.dashboard.tournaments.prizePoolLabel}: ৳ {tournament.prizePoolBdt.toLocaleString()}</span>
        ) : null}
        {tournament.entryFeeBdt ? <span>Entry fee: ৳ {tournament.entryFeeBdt.toLocaleString()}</span> : null}
      </div>

      <div className="mt-8">
        {tournament.aggregateTable ? (
          <>
            <h2 className="font-display mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
              {t.dashboard.tournaments.aggregateTableTitle}
            </h2>
            <AggregateTable rows={tournament.aggregateTable} />
          </>
        ) : null}
        {tournament.bracket ? (
          <>
            <h2 className="font-display mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-ink-soft">
              {t.dashboard.tournaments.bracketTitle}
            </h2>
            <BracketView rounds={tournament.bracket} />
          </>
        ) : null}
      </div>
    </div>
  );
}
