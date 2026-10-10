"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMyGames, useTournaments } from "@/lib/api/hooks/useTournaments";
import { useMyTransfers } from "@/lib/api/hooks/useTransfers";
import { formatGameRange, roundLabel } from "@/components/dashboard/fixtures/labels";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatTile } from "@/components/dashboard/StatTile";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { SectionHeading } from "@/components/dashboard/SectionHeading";
import { PlayerRankingsTable } from "@/components/dashboard/PlayerRankingsTable";
import { ClubRankingsTable } from "@/components/dashboard/ClubRankingsTable";
import { useClubRankings, usePlayerRankings, usePlayerStats } from "@/lib/api/hooks/useStats";
import { tournamentHref } from "@/lib/api/tournaments";
import { CalendarIcon, TrophyIcon, WalletIcon, ChartIcon, ArrowRightIcon, UsersIcon } from "@/components/icons";

export default function EfootballOverviewPage() {
  const { t, locale } = useLanguage();
  const { user } = useSession();
  // The player's next games still to play, from the backend.
  const { data: toPlay } = useMyGames({ state: "to_play", limit: 3 });
  const upcoming = toPlay?.data ?? [];
  const upcomingCount = toPlay?.meta.total ?? 0;
  const tournamentsQuery = useTournaments({ sortBy: "startAt", sortOrder: "DESC" });
  const tournaments = tournamentsQuery.data ?? [];
  const latestTournament =
    tournaments.find((tournament) => tournament.status === "live" || tournament.status === "ongoing") ??
    tournaments.find((tournament) =>
      ["open", "registration_open", "submission_phase", "registration_closed"].includes(tournament.status),
    );
  const playerStatsQuery = usePlayerStats(user.id || undefined);
  const allTimeStats = playerStatsQuery.data?.periods["all-time"];
  const winRateChange = playerStatsQuery.data
    ? playerStatsQuery.data.periods["this-month"].winPct - playerStatsQuery.data.periods["last-month"].winPct
    : 0;
  const winRateTrend =
    winRateChange === 0
      ? undefined
      : {
          value: `${winRateChange > 0 ? "+" : ""}${winRateChange.toFixed(1)}%`,
          direction: winRateChange > 0 ? ("up" as const) : ("down" as const),
        };
  const transfersQuery = useMyTransfers(Boolean(user.id));

  // Top 5 all-time, from confirmed results.
  const topPlayers = usePlayerRankings({ limit: 5 }).data?.data ?? [];
  const topClubs = useClubRankings({ limit: 5 }).data?.data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="eFootball"
        title={`${t.dashboard.overview.welcomeBack}, ${user.name.split(" ")[0]}`}
        description={
          user.club && user.community
            ? `${user.club.name} · ${user.community.name}`
            : undefined
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile
          label={t.dashboard.overview.rankLabel}
          value={playerStatsQuery.isLoading ? "…" : allTimeStats?.rank ? `#${allTimeStats.rank}` : "—"}
          icon={UsersIcon}
        />
        <StatTile
          label={t.dashboard.overview.statWinRate}
          value={playerStatsQuery.isLoading ? "…" : `${(allTimeStats?.winPct ?? 0).toFixed(1)}%`}
          icon={ChartIcon}
          trend={winRateTrend}
        />
        <StatTile
          label={t.dashboard.overview.statTournaments}
          value={tournamentsQuery.isLoading ? "…" : String(tournaments.length)}
          icon={TrophyIcon}
        />
        <StatTile
          label={t.dashboard.overview.statWallet}
          value={transfersQuery.isLoading ? "…" : `৳ ${(transfersQuery.data?.wallet.balanceTk ?? 0).toLocaleString()}`}
          icon={WalletIcon}
        />
        <StatTile label={t.dashboard.overview.statUpcoming} value={String(upcomingCount)} icon={CalendarIcon} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border border-surface-line bg-surface/50 p-5">
          <SectionHeading
            tone="blue"
            size="title"
            className="mb-0"
            action={
              <Link href="/dashboard/efootball/matches" className="text-xs font-medium text-blue-ink hover:underline">
                {t.dashboard.shell.navMatches} →
              </Link>
            }
          >
            {t.dashboard.overview.upcomingMatchesTitle}
          </SectionHeading>
          <div className="mt-4 space-y-2">
            {upcoming.length > 0 ? (
              upcoming.map((g) => (
                <Link
                  key={g.id}
                  href={g.tournament.link}
                  className="flex items-center justify-between gap-3 rounded-lg border border-surface-line bg-bg-raised px-3.5 py-2.5 transition-colors hover:border-surface-line-strong"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">vs {g.opponent.name}</div>
                    <div className="truncate text-xs text-ink-faint">
                      {g.tournament.name} · {roundLabel(g.roundName, t)}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-ink-soft">
                    {g.scheduledStart ? formatGameRange(g, t, locale) : t.dashboard.myMatches.notScheduled}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-ink-soft">{t.dashboard.overview.noUpcoming}</p>
            )}
          </div>
        </div>

        {latestTournament ? (
          <div className="rounded-xl border border-surface-line bg-surface/50 p-5">
            <SectionHeading tone="accent" size="title" className="mb-0">
              {t.dashboard.overview.latestTournamentTitle}
            </SectionHeading>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">{latestTournament.name}</span>
                <StatusPill tone={latestTournament.status === "live" ? "danger" : "info"}>
                  {latestTournament.status === "live" ? t.dashboard.tournaments.statusLive : t.dashboard.tournaments.statusOpen}
                </StatusPill>
              </div>
              {latestTournament.prizePoolBdt ? (
                <p className="mt-2 font-mono text-sm text-ink-soft">
                  {t.dashboard.tournaments.prizePoolLabel}: ৳ {latestTournament.prizePoolBdt.toLocaleString()}
                </p>
              ) : null}
              <Link
                href={tournamentHref(latestTournament)}
                className="group mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink"
              >
                View
                <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-8 rounded-xl border border-surface-line bg-surface/50 p-5">
        <SectionHeading
          tone="blue"
          size="title"
          className="mb-0"
          action={
            <Link href="/dashboard/efootball/rankings" className="text-xs font-medium text-blue-ink hover:underline">
              {t.dashboard.rankings.viewFullRankings} →
            </Link>
          }
        >
          {t.dashboard.rankings.playerRankingsTitle}
        </SectionHeading>
        <div className="mt-4">
          <PlayerRankingsTable rows={topPlayers} />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-surface-line bg-surface/50 p-5">
        <SectionHeading
          tone="accent"
          size="title"
          className="mb-0"
          action={
            <Link href="/dashboard/efootball/rankings" className="text-xs font-medium text-blue-ink hover:underline">
              {t.dashboard.rankings.viewFullRankings} →
            </Link>
          }
        >
          {t.dashboard.rankings.clubRankingsTitle}
        </SectionHeading>
        <div className="mt-4">
          <ClubRankingsTable rows={topClubs} />
        </div>
      </div>
    </div>
  );
}
