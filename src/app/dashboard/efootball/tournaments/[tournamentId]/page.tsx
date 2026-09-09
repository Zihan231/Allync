"use client";

import { use } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockTournaments } from "@/lib/mock/store";
import { useMockClubs } from "@/lib/mock/communityStore";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { StatTile } from "@/components/dashboard/StatTile";
import { AggregateTable } from "@/components/dashboard/AggregateTable";
import { BracketView } from "@/components/dashboard/BracketView";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SectionHeading } from "@/components/dashboard/SectionHeading";
import { TrophyIcon, BracketIcon, UsersIcon, CrosshairIcon, WalletIcon, CalendarIcon, ArrowRightIcon } from "@/components/icons";
import type { TournamentFormat } from "@/lib/mock/types";

const FORMAT_ICON: Record<TournamentFormat, typeof TrophyIcon> = {
  default: TrophyIcon,
  custom: BracketIcon,
  clubVsClub: UsersIcon,
  open: TrophyIcon,
  playerVsPlayer: CrosshairIcon,
};

export default function TournamentDetailPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = use(params);
  const { t } = useLanguage();
  const tournaments = useMockTournaments();
  const clubs = useMockClubs();
  const tournament = tournaments.find((tour) => tour.id === tournamentId);

  if (!tournament) {
    return <EmptyState icon={TrophyIcon} title={t.dashboard.tournaments.noTournaments} body="" />;
  }

  const club = tournament.clubId ? (clubs.find((cl) => cl.id === tournament.clubId) ?? null) : null;
  const FormatIcon = FORMAT_ICON[tournament.format];

  const statusTone = tournament.status === "live" ? "danger" : tournament.status === "open" ? "info" : "neutral";
  const statusLabel = {
    open: t.dashboard.tournaments.statusOpen,
    live: t.dashboard.tournaments.statusLive,
    completed: t.dashboard.tournaments.statusCompleted,
  }[tournament.status];

  const formatLabel = {
    default: t.dashboard.tournaments.filterDefault,
    custom: t.dashboard.tournaments.filterCustom,
    clubVsClub: t.dashboard.tournaments.filterClubVsClub,
    open: t.dashboard.tournaments.filterOpen,
    playerVsPlayer: t.dashboard.tournaments.filterPlayerVsPlayer,
  }[tournament.format];

  const startLabel = new Date(tournament.startAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const hasResults = Boolean(tournament.aggregateTable || tournament.bracket);

  return (
    <div>
      <PageHeader
        eyebrow="eFootball Tournament"
        title={tournament.name}
        action={<StatusPill tone={statusTone}>{statusLabel}</StatusPill>}
        backHref="/dashboard/efootball/tournaments"
      />

      {club ? (
        <Link
          href={`/dashboard/efootball/clubs/${club.id}`}
          className="group mt-4 inline-flex items-center gap-2 rounded-full border border-surface-line-strong bg-surface/40 px-3.5 py-1.5 text-sm text-ink-soft transition-colors hover:border-accent hover:text-accent-ink"
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: club.color }}
          />
          {t.dashboard.tournaments.hostedByLabel}: <span className="font-medium text-ink">{club.name}</span>
          <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t.dashboard.tournaments.formatLabel} value={formatLabel} icon={FormatIcon} />
        <StatTile label={t.dashboard.tournaments.entrantsLabel} value={String(tournament.entrants)} icon={UsersIcon} />
        <StatTile
          label={tournament.prizePoolBdt ? t.dashboard.tournaments.prizePoolLabel : t.dashboard.tournaments.entryFeeLabel}
          value={
            tournament.prizePoolBdt
              ? `৳ ${tournament.prizePoolBdt.toLocaleString()}`
              : tournament.entryFeeBdt
                ? `৳ ${tournament.entryFeeBdt.toLocaleString()}`
                : "—"
          }
          icon={WalletIcon}
        />
        <StatTile label={t.dashboard.tournaments.startsLabel} value={startLabel} icon={CalendarIcon} />
      </div>

      <div className="mt-8">
        {tournament.aggregateTable ? (
          <>
            <SectionHeading tone="accent">{t.dashboard.tournaments.aggregateTableTitle}</SectionHeading>
            <AggregateTable rows={tournament.aggregateTable} />
          </>
        ) : null}

        {tournament.bracket ? (
          <div className="mt-8">
            <SectionHeading tone="danger">{t.dashboard.tournaments.bracketTitle}</SectionHeading>
            <BracketView rounds={tournament.bracket} />
          </div>
        ) : null}

        {!hasResults ? (
          <EmptyState
            icon={TrophyIcon}
            title={t.dashboard.tournaments.pendingResultsTitle}
            body={t.dashboard.tournaments.pendingResultsBody}
          />
        ) : null}
      </div>
    </div>
  );
}
