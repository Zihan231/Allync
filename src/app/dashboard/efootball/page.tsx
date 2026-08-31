"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockMatches, useMockTournaments } from "@/lib/mock/store";
import { useMockPeople } from "@/lib/mock/communityStore";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatTile } from "@/components/dashboard/StatTile";
import { MiniMatchRow } from "@/components/dashboard/MiniMatchRow";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { SectionHeading } from "@/components/dashboard/SectionHeading";
import { CalendarIcon, TrophyIcon, WalletIcon, ChartIcon, ArrowRightIcon, UsersIcon } from "@/components/icons";

export default function EfootballOverviewPage() {
  const { t } = useLanguage();
  const { user } = useSession();
  const matches = useMockMatches();
  const tournaments = useMockTournaments();
  const people = useMockPeople();

  const upcoming = matches.filter((m) => m.status === "unplayed" || m.status === "awaiting_opponent").slice(0, 3);
  const latestTournament = tournaments.find((t2) => t2.status === "live") ?? tournaments[0];

  const rank = [...people].sort((a, b) => b.points - a.points).findIndex((p) => p.id === user.personId) + 1;

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
          value={rank > 0 ? `#${rank}` : "—"}
          icon={UsersIcon}
        />
        <StatTile label={t.dashboard.overview.statWinRate} value="68%" icon={ChartIcon} trend={{ value: "+4%", direction: "up" }} />
        <StatTile label={t.dashboard.overview.statTournaments} value={String(tournaments.length)} icon={TrophyIcon} />
        <StatTile label={t.dashboard.overview.statWallet} value={`৳ ${user.wallet.balanceBdt.toLocaleString()}`} icon={WalletIcon} />
        <StatTile label={t.dashboard.overview.statUpcoming} value={String(upcoming.length)} icon={CalendarIcon} />
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
              upcoming.map((m) => <MiniMatchRow key={m.id} match={m} />)
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
                href={`/dashboard/efootball/tournaments/${latestTournament.id}`}
                className="group mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink"
              >
                View
                <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
