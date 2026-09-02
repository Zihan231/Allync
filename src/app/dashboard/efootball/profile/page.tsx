"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockMatches } from "@/lib/mock/store";
import { useMockPeople } from "@/lib/mock/communityStore";
import { getCosmetic, type CosmeticItem } from "@/lib/mock/cosmetics";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { MiniMatchRow } from "@/components/dashboard/MiniMatchRow";
import { SectionHeading } from "@/components/dashboard/SectionHeading";
import { ProfileEditForm } from "@/components/dashboard/ProfileEditForm";
import { ChartIcon, TrophyIcon, CalendarIcon, StoreIcon, FlameIcon } from "@/components/icons";
import {
  CosmeticBadgePill,
  CosmeticTitleText,
  CosmeticThemeAmbient,
  ThemedProfileHeroBanner,
  ThemedCoverArtwork,
  ThemedCard,
  FootballPlayerAvatar,
  BannerPlayerStageHUD,
  ThemedStatCard,
  PlayerCosmeticsShowcase,
  getThemeTokens,
} from "@/components/cosmetics/CosmeticDisplay";

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user } = useSession();
  const people = useMockPeople();
  const person = people.find((p) => p.id === user.personId);
  const matches = useMockMatches().filter((m) => m.game === "efootball");

  const rank = [...people].sort((a, b) => b.points - a.points).findIndex((p) => p.id === user.personId) + 1;
  const points = person?.points ?? 1250;

  const equippedTitle = person?.equippedTitleId ? getCosmetic(person.equippedTitleId) : null;
  const equippedBadge = person?.equippedBadgeId ? getCosmetic(person.equippedBadgeId) : null;
  const equippedFrame = person?.equippedFrameId ? getCosmetic(person.equippedFrameId) : null;
  const equippedTheme = person?.equippedThemeId ? getCosmetic(person.equippedThemeId) : null;
  const tokens = getThemeTokens(equippedTheme);
  const ownedBadges = (person?.ownedCosmeticIds ?? [])
    .map(getCosmetic)
    .filter((c): c is CosmeticItem => c != null && c.category === "badge");

  return (
    <div className="relative pb-16 overflow-x-clip max-w-full">
      {/* Dynamic Profile Theme Ambient Lighting */}
      <CosmeticThemeAmbient theme={equippedTheme} />

      <PageHeader
        eyebrow="eFootball Arena"
        title={t.dashboard.shell.navProfile}
        description={t.dashboard.profile.crossGameNote}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/dashboard/efootball/store"
              className="flex items-center gap-1.5 rounded-full border border-accent bg-accent/15 px-4 py-2 text-sm font-semibold text-accent-ink transition-all hover:bg-accent hover:text-bg shadow-sm"
            >
              <StoreIcon className="h-4 w-4" />
              {t.dashboard.shell.navStore}
            </Link>
            <Link
              href={`/dashboard/efootball/players/${user.personId}`}
              className="rounded-full border border-surface-line-strong bg-surface/40 px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-accent hover:text-accent-ink"
            >
              {t.dashboard.playerProfile.viewPublicProfile}
            </Link>
          </div>
        }
      />

      {/* Grand Themed Profile Hero Banner with Pro HUD Telemetry */}
      <div className="mt-4 sm:mt-6">
        <ThemedProfileHeroBanner theme={equippedTheme}>
          <ThemedCoverArtwork
            theme={equippedTheme}
            coverUrl={person?.coverUrl}
            name={user.name}
            className="h-56 min-[450px]:h-64 sm:h-80 lg:h-96"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 opacity-30"
            style={{
              backgroundImage:
                "repeating-linear-gradient(115deg, transparent 0 26px, rgba(255,255,255,0.12) 26px 52px)",
            }}
          />
          {/* Banner Player Stage HUD Overlay */}
          <BannerPlayerStageHUD
            theme={equippedTheme}
            rank={rank > 0 ? rank : 1}
            points={points}
            winRate={68}
            totalWins={24}
          />
        </ThemedProfileHeroBanner>
      </div>

      {/* Football-Themed Avatar, Name, Title, Badges Showcase */}
      <div className="relative px-3 sm:px-6">
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-end sm:text-left sm:justify-between">
          <div className="flex flex-col items-center sm:flex-row sm:items-end gap-3 sm:gap-4">
            {/* Football Player Avatar with Gold Star Crest & Position Tag */}
            <div className="-mt-14 min-[450px]:-mt-16 sm:-mt-22 w-fit shrink-0 z-10 mx-auto sm:mx-0">
              <FootballPlayerAvatar
                frame={equippedFrame}
                dpUrl={person?.dpUrl ?? user.dpUrl}
                name={user.name}
                position={person?.gamePosition ?? "CF"}
                rating={94}
                theme={equippedTheme}
              />
            </div>

            {/* Name, Title, Badges positioned cleanly below cover */}
            <div className="pt-2 sm:pt-0 sm:pb-1 flex-1 min-w-0 flex flex-col items-center sm:items-start">
              <h1
                className="font-display text-2xl min-[450px]:text-3xl font-black tracking-tight text-center sm:text-left"
                style={{ color: tokens.headingText }}
              >
                {user.name}
              </h1>

              {/* Equipped Title Display */}
              {equippedTitle ? (
                <div className="mt-1 sm:mt-1.5 flex flex-wrap items-center justify-center sm:justify-start">
                  <CosmeticTitleText item={equippedTitle} size="lg" />
                </div>
              ) : null}

              <div className="mt-2.5 sm:mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
                {/* Equipped Badge */}
                {equippedBadge ? <CosmeticBadgePill item={equippedBadge} /> : null}

                {user.club ? (
                  <span
                    className="rounded-full border px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold backdrop-blur"
                    style={{
                      borderColor: tokens.innerBorder,
                      backgroundColor: tokens.innerBg,
                      color: tokens.headingText,
                    }}
                  >
                    {user.club.name} · <span style={{ color: tokens.accentText }}>{user.club.role}</span>
                  </span>
                ) : null}
                {user.community ? (
                  <span
                    className="rounded-full border px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold backdrop-blur"
                    style={{
                      borderColor: tokens.innerBorder,
                      backgroundColor: tokens.innerBg,
                      color: tokens.headingText,
                    }}
                  >
                    {user.community.name}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Holographic eFootball Stat Overview */}
      <div className="mt-6 sm:mt-8 grid gap-2.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <ThemedStatCard label={t.dashboard.overview.statWinRate} value="68%" icon={ChartIcon} tone="accent" theme={equippedTheme} />
        <ThemedStatCard label={t.dashboard.shell.navTournaments} value="4" icon={TrophyIcon} tone="warning" theme={equippedTheme} />
        <ThemedStatCard label={t.dashboard.profile.historyTitle} value={String(matches.length)} icon={CalendarIcon} tone="blue" theme={equippedTheme} />
        <ThemedStatCard label="Form Rating" value="A+" icon={FlameIcon} tone="danger" theme={equippedTheme} />
      </div>

      {/* Full Cosmetic Locker & Loadout Showcase Module */}
      <PlayerCosmeticsShowcase
        theme={equippedTheme}
        frame={equippedFrame}
        title={equippedTitle}
        badge={equippedBadge}
        ownedBadges={ownedBadges}
      />

      {/* Match History */}
      <ThemedCard theme={equippedTheme} className="mt-8 p-5 shadow-xl">
        <SectionHeading tone="blue">{t.dashboard.profile.historyTitle}</SectionHeading>
        <div className="mt-3 space-y-2">
          {matches.map((m) => (
            <MiniMatchRow key={m.id} match={m} />
          ))}
        </div>
      </ThemedCard>

      {/* Profile Edit Form */}
      <div className="mt-8">
        <ProfileEditForm />
      </div>
    </div>
  );
}

