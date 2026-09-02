"use client";

import { use, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockPeople, useMockClubs, useMockCommunities } from "@/lib/mock/communityStore";
import { getPlayerInsights } from "@/lib/mock/playerInsights";
import { BackButton } from "@/components/dashboard/BackButton";
import { Avatar } from "@/components/common/Avatar";
import { RankBadge } from "@/components/dashboard/RankBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { type SectionTone } from "@/components/dashboard/SectionHeading";
import { RankTrendChart } from "@/components/dashboard/RankTrendChart";
import { MatchLoadChart } from "@/components/dashboard/MatchLoadChart";
import {
  ChartIcon,
  TrophyIcon,
  CrosshairIcon,
  UsersIcon,
  FlameIcon,
  BracketIcon,
  ShieldIcon,
  SwapIcon,
  SettingsIcon,
} from "@/components/icons";
import { getCosmetic, type CosmeticItem } from "@/lib/mock/cosmetics";
import {
  CosmeticBadgePill,
  CosmeticTitleText,
  CosmeticThemeAmbient,
  ThemedProfileHeroBanner,
  ThemedCoverArtwork,
  FootballPlayerAvatar,
  BannerPlayerStageHUD,
  ThemedStatCard,
  PlayerCosmeticsShowcase,
  ThemeSectionArt,
  getThemeTokens,
  ThemeTeamAttachmentBadge,
} from "@/components/cosmetics/CosmeticDisplay";
import type { StatsRow, TransferEntry } from "@/lib/mock/playerInsights";

type IconComponent = (props: { className?: string }) => React.ReactElement;

const INSTITUTE_TYPE_LABEL_KEY = {
  University: "instituteTypeUniversity",
  College: "instituteTypeCollege",
  School: "instituteTypeSchool",
  Other: "instituteTypeOther",
} as const;

function formatBloodGroup(bg: string) {
  return bg.endsWith("+") ? `${bg.slice(0, -1)}(+)` : bg.endsWith("-") ? `${bg.slice(0, -1)}(-)` : bg;
}

function formatBirthday(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function InfoPill({ label, value, theme }: { label: string; value: string; theme?: CosmeticItem | null }) {
  const tokens = getThemeTokens(theme);
  return (
    <span
      className="rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur"
      style={{
        borderColor: tokens.innerBorder,
        backgroundColor: tokens.innerBg,
        color: tokens.headingText,
      }}
    >
      <span style={{ color: tokens.mutedText }}>{label}:</span> {value}
    </span>
  );
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  action,
  children,
  className = "",
  theme,
}: {
  icon: IconComponent;
  tone?: SectionTone;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  theme?: CosmeticItem | null;
}) {
  const tokens = getThemeTokens(theme);

  return (
    <div
      className={`group relative mt-6 overflow-hidden rounded-2xl border p-4 sm:p-6 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl ${tokens.cardClass} ${className}`}
      style={{
        boxShadow: theme ? tokens.glowShadow : undefined,
      }}
    >
      {/* Animated Theme Vector Background Art */}
      <ThemeSectionArt theme={theme} />

      {/* Top Holographic Light Sweep Line */}
      {theme ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-80 animate-holographic-sweep"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${tokens.secondary} 50%, transparent 100%)`,
          }}
        />
      ) : null}

      {/* Corner Cyber Notches */}
      {theme ? (
        <>
          <div
            className="pointer-events-none absolute top-0 left-0 h-3 sm:h-4 w-3 sm:w-4 border-t-2 border-l-2"
            style={{ borderColor: tokens.secondary }}
          />
          <div
            className="pointer-events-none absolute top-0 right-0 h-3 sm:h-4 w-3 sm:w-4 border-t-2 border-r-2"
            style={{ borderColor: tokens.secondary }}
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-3 sm:h-4 w-3 sm:w-4 border-b-2 border-l-2"
            style={{ borderColor: tokens.secondary }}
          />
          <div
            className="pointer-events-none absolute bottom-0 right-0 h-3 sm:h-4 w-3 sm:w-4 border-b-2 border-r-2"
            style={{ borderColor: tokens.secondary }}
          />
        </>
      ) : null}

      <div className="relative z-10 flex flex-wrap items-start justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div
            className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border shadow-md transition-transform group-hover:scale-105"
            style={{
              borderColor: tokens.innerBorder,
              backgroundColor: tokens.innerBg,
              color: tokens.accentText,
              boxShadow: theme ? `0 0 15px ${tokens.primary}35` : undefined,
            }}
          >
            <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <h3
              className="font-display text-base sm:text-lg font-bold tracking-tight flex items-center gap-2 truncate"
              style={{ color: tokens.headingText }}
            >
              {title}
            </h3>
            {subtitle ? (
              <p className="text-xs sm:text-sm font-medium truncate" style={{ color: tokens.mutedText }}>
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {theme ? (
            <span
              className="hidden sm:flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider backdrop-blur shadow-sm"
              style={{
                borderColor: tokens.highlightBorder,
                backgroundColor: tokens.highlightBg,
                color: tokens.highlightText,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: tokens.primary }} />
              {theme.name}
            </span>
          ) : null}
          {action}
        </div>
      </div>
      <div className="relative z-10 mt-4 sm:mt-5">{children}</div>
    </div>
  );
}

function SnapshotRow({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  tone?: SectionTone;
  theme?: CosmeticItem | null;
}) {
  const tokens = getThemeTokens(theme);

  return (
    <div
      className="group relative overflow-hidden rounded-xl border p-3.5 sm:p-4 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        borderColor: tokens.innerBorder,
        backgroundColor: tokens.innerBg,
      }}
    >
      {theme ? (
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-1 rounded-l opacity-90"
          style={{ backgroundColor: tokens.primary }}
        />
      ) : null}
      <div
        className="font-mono text-[9px] sm:text-[10px] uppercase font-bold tracking-wide"
        style={{ color: tokens.accentText }}
      >
        {label}
      </div>
      <div
        className="mt-1 sm:mt-1.5 text-xs sm:text-sm font-bold transition-colors break-words"
        style={{ color: tokens.headingText }}
      >
        {value}
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  theme,
  highlight = false,
}: {
  label: string;
  value: string;
  tone?: SectionTone;
  theme?: CosmeticItem | null;
  highlight?: boolean;
}) {
  const tokens = getThemeTokens(theme);

  return (
    <div
      className="group relative overflow-hidden rounded-xl border px-1.5 py-2 sm:px-2 sm:py-3 text-center backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{
        borderColor: highlight ? tokens.highlightBorder : tokens.innerBorder,
        backgroundColor: highlight ? tokens.highlightBg : tokens.innerBg,
      }}
    >
      <div
        className="font-mono text-[9px] sm:text-[10px] uppercase font-bold tracking-wide truncate"
        style={{ color: highlight ? tokens.highlightText : tokens.mutedText }}
      >
        {label}
      </div>
      <div
        className="mt-0.5 sm:mt-1 font-display text-xs sm:text-sm font-black transition-colors"
        style={{ color: highlight ? tokens.highlightText : tokens.headingText }}
      >
        {value}
      </div>
    </div>
  );
}

function StatsTable({
  title,
  row,
  pf,
  tone,
  icon,
  theme,
}: {
  title: string;
  row: StatsRow;
  tone: SectionTone;
  icon: IconComponent;
  pf: {
    rankLabel: string;
    download: string;
    m: string;
    w: string;
    d: string;
    l: string;
    winPct: string;
    gf: string;
    ga: string;
    cs: string;
    motm: string;
    rt: string;
  };
  theme?: CosmeticItem | null;
}) {
  const tokens = getThemeTokens(theme);
  const cells: { label: string; value: string; tone: SectionTone; highlight?: boolean }[] = [
    { label: pf.m, value: String(row.m), tone: "blue" },
    { label: pf.w, value: String(row.w), tone: "success" },
    { label: pf.d, value: String(row.d), tone: "blue" },
    { label: pf.l, value: String(row.l), tone: "danger" },
    { label: pf.winPct, value: `${row.winPct}%`, tone: "accent", highlight: true },
    { label: pf.gf, value: String(row.gf), tone: "success", highlight: true },
    { label: pf.ga, value: String(row.ga), tone: "danger" },
    { label: pf.cs, value: String(row.cs), tone: "blue" },
    { label: pf.motm, value: String(row.motm), tone: "accent", highlight: true },
    { label: pf.rt, value: String(row.rt), tone: "warning", highlight: true },
  ];

  return (
    <SectionCard
      icon={icon}
      tone={tone}
      title={title}
      theme={theme}
      action={
        <button
          type="button"
          className="rounded-full border px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold backdrop-blur transition-all"
          style={{
            borderColor: tokens.innerBorder,
            backgroundColor: tokens.innerBg,
            color: tokens.mutedText,
          }}
        >
          {pf.download}
        </button>
      }
    >
      <div
        className="-mt-1 mb-3 sm:mb-4 flex flex-wrap items-center gap-1.5 text-xs font-medium"
        style={{ color: tokens.mutedText }}
      >
        <span>{pf.rankLabel}</span> <RankBadge rank={row.rank} />
      </div>
      <div className="grid grid-cols-2 min-[420px]:grid-cols-5 sm:grid-cols-5 lg:grid-cols-10 gap-1.5 sm:gap-2.5">
        {cells.map((c) => (
          <StatCell key={c.label} {...c} theme={theme} />
        ))}
      </div>
    </SectionCard>
  );
}

export default function PlayerProfilePage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = use(params);
  const { t } = useLanguage();
  const pf = t.dashboard.playerProfile;
  const { user } = useSession();
  const people = useMockPeople();
  const clubs = useMockClubs();
  const communities = useMockCommunities();
  const [trendView, setTrendView] = useState<"monthly" | "weekly">("monthly");

  const person = people.find((p) => p.id === playerId);

  const insights = useMemo(() => (person ? getPlayerInsights(person) : null), [person]);

  if (!person || !insights) {
    return <EmptyState icon={UsersIcon} title={t.dashboard.players.notFound} body="" />;
  }

  const club = person.clubId ? clubs.find((c) => c.id === person.clubId) : null;
  const community = person.communityId ? communities.find((c) => c.id === person.communityId) : null;
  const rank = [...people].sort((a, b) => b.points - a.points).findIndex((p) => p.id === person.id) + 1;
const equippedTitle = person.equippedTitleId ? getCosmetic(person.equippedTitleId) : null;
  const equippedBadge = person.equippedBadgeId ? getCosmetic(person.equippedBadgeId) : null;
  const equippedFrame = person.equippedFrameId ? getCosmetic(person.equippedFrameId) : null;
  const equippedTheme = person.equippedThemeId ? getCosmetic(person.equippedThemeId) : null;
  const tokens = getThemeTokens(equippedTheme);
  const ownedBadges = (person.ownedCosmeticIds ?? [])
    .map(getCosmetic)
    .filter((c): c is CosmeticItem => c != null && c.category === "badge");

  const birthday = (person.birthday ? formatBirthday(person.birthday) : null) ?? insights.personalInfo.birthday;
  const bloodGroup = formatBloodGroup(person.bloodGroup ?? insights.personalInfo.bloodGroup);
  const deviceName = person.deviceName ?? insights.personalInfo.deviceName;
  const deviceModel = person.deviceModel ?? insights.personalInfo.deviceModel;
  const konamiUid = person.konamiUid ?? insights.personalInfo.konamiUid;
  const country = person.country || insights.personalInfo.country;
  const division = person.division || insights.personalInfo.division;
  const district = person.district || insights.personalInfo.district;
  const education = person.education && person.education.length > 0 ? person.education : insights.personalInfo.education;

  return (
    <div className="relative pb-12 overflow-x-clip max-w-full">
      {/* Dynamic Profile Theme Ambient Lighting */}
      <CosmeticThemeAmbient theme={equippedTheme} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton />
        {person.id !== user.personId ? (
          <Link
            href="/dashboard/efootball/profile"
            className="rounded-full border border-surface-line-strong px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-ink-soft transition-colors hover:border-accent hover:text-accent-ink"
          >
            {pf.myProfile}
          </Link>
        ) : null}
      </div>

      {/* Grand Themed Profile Hero Banner with Pro HUD Telemetry */}
      <div className="mt-4 sm:mt-6">
        <ThemedProfileHeroBanner theme={equippedTheme}>
          <ThemedCoverArtwork
            theme={equippedTheme}
            coverUrl={person.coverUrl}
            name={person.name}
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
            points={person.points}
            winRate={insights.winRate}
            totalWins={insights.totalWins}
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
                dpUrl={person.dpUrl}
                name={person.name}
                position={person.gamePosition ?? "CF"}
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
                {person.name}
              </h1>

              {/* Equipped Title Display */}
              {equippedTitle ? (
                <div className="mt-1 sm:mt-1.5 flex flex-wrap items-center justify-center sm:justify-start">
                  <CosmeticTitleText item={equippedTitle} size="lg" />
                </div>
              ) : null}

              <div className="mt-2.5 sm:mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
                {club ? (
                  <Link
                    href={`/dashboard/efootball/clubs/${club.id}`}
                    className="rounded-full border px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold backdrop-blur transition-all hover:scale-105"
                    style={{
                      borderColor: tokens.innerBorder,
                      backgroundColor: tokens.innerBg,
                      color: tokens.headingText,
                    }}
                  >
                    {club.name} · <span style={{ color: tokens.accentText }}>{person.clubRole}</span>
                  </Link>
                ) : null}
                {community ? (
                  <Link
                    href={`/dashboard/efootball/community/${community.id}`}
                    className="rounded-full border px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold backdrop-blur transition-all hover:scale-105"
                    style={{
                      borderColor: tokens.innerBorder,
                      backgroundColor: tokens.innerBg,
                      color: tokens.headingText,
                    }}
                  >
                    {community.name} · <span style={{ color: tokens.accentText }}>{person.communityRole}</span>
                  </Link>
                ) : null}
                <span
                  className="rounded-full border px-2.5 sm:px-3 py-0.5 sm:py-1 font-mono text-[10px] sm:text-[11px] font-bold backdrop-blur"
                  style={{
                    borderColor: tokens.highlightBorder,
                    backgroundColor: tokens.highlightBg,
                    color: tokens.highlightText,
                  }}
                >
                  {person.points.toLocaleString()} {t.dashboard.players.rankLabel.toLowerCase()}
                </span>
                {/* Equipped Badge Pill */}
                {equippedBadge ? <CosmeticBadgePill item={equippedBadge} /> : null}
              </div>

              {/* Official Team Theme Attachment (Crest, Stadium, Motto) */}
              {equippedTheme?.teamDetails ? (
                <div className="flex justify-center sm:justify-start">
                  <ThemeTeamAttachmentBadge theme={equippedTheme} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {person.bio ? (
        <p className="mt-3 sm:mt-5 max-w-xl text-xs sm:text-sm leading-relaxed text-center sm:text-left" style={{ color: tokens.bodyText }}>
          {person.bio}
        </p>
      ) : null}

      {/* Holographic eFootball Stat Overview with Goal Net Vectors */}
      <div className="mt-6 sm:mt-8 grid gap-2.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <ThemedStatCard label={pf.statTotalMatches} value={String(insights.totalMatches)} icon={ChartIcon} tone="blue" theme={equippedTheme} />
        <ThemedStatCard label={pf.statTotalWins} value={String(insights.totalWins)} icon={TrophyIcon} tone="success" theme={equippedTheme} />
        <ThemedStatCard label={pf.statWinRate} value={`${insights.winRate}%`} icon={CrosshairIcon} tone="accent" theme={equippedTheme} />
        <ThemedStatCard label={pf.statGoalsFor} value={String(insights.goalsFor)} icon={FlameIcon} tone="danger" theme={equippedTheme} />
      </div>

      {/* Full Cosmetic Locker & Loadout Showcase Module */}
      <PlayerCosmeticsShowcase
        theme={equippedTheme}
        frame={equippedFrame}
        title={equippedTitle}
        badge={equippedBadge}
        ownedBadges={ownedBadges}
      />

      {/* Club and Community Affiliation Cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div
          className="rounded-2xl border p-4 backdrop-blur transition-all"
          style={{
            borderColor: tokens.innerBorder,
            backgroundColor: tokens.innerBg,
          }}
        >
          <div
            className="font-mono text-[10px] uppercase font-bold tracking-wide"
            style={{ color: tokens.mutedText }}
          >
            {t.dashboard.players.clubLabel}
          </div>
          {club ? (
            <Link href={`/dashboard/efootball/clubs/${club.id}`} className="mt-2.5 flex items-center gap-2.5">
              <Avatar dpUrl={club.dpUrl} name={club.name} size="sm" mode="static" />
              <div className="min-w-0">
                <span className="font-bold text-sm block truncate" style={{ color: tokens.headingText }}>
                  {club.name}
                </span>
                <span className="font-mono text-[10px] uppercase font-bold" style={{ color: tokens.accentText }}>
                  {person.clubRole}
                </span>
              </div>
            </Link>
          ) : (
            <p className="mt-2 text-sm" style={{ color: tokens.mutedText }}>{t.dashboard.players.noAffiliation}</p>
          )}
        </div>

        <div
          className="rounded-2xl border p-4 backdrop-blur transition-all"
          style={{
            borderColor: tokens.innerBorder,
            backgroundColor: tokens.innerBg,
          }}
        >
          <div
            className="font-mono text-[10px] uppercase font-bold tracking-wide"
            style={{ color: tokens.mutedText }}
          >
            {t.dashboard.players.communityLabel}
          </div>
          {community ? (
            <Link href={`/dashboard/efootball/community/${community.id}`} className="mt-2.5 flex items-center gap-2.5">
              <Avatar dpUrl={community.dpUrl} name={community.name} size="sm" mode="static" />
              <div className="min-w-0">
                <span className="font-bold text-sm block truncate" style={{ color: tokens.headingText }}>
                  {community.name}
                </span>
                <span className="font-mono text-[10px] uppercase font-bold" style={{ color: tokens.accentText }}>
                  {person.communityRole}
                </span>
              </div>
            </Link>
          ) : (
            <p className="mt-2 text-sm" style={{ color: tokens.mutedText }}>{t.dashboard.players.noAffiliation}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <InfoPill label={pf.divisionLabel} value={[division, district].filter(Boolean).join(" · ") || "—"} theme={equippedTheme} />
        <InfoPill label={pf.countryLabel} value={country} theme={equippedTheme} />
      </div>

      {/* Education & Academic Credentials */}
      <SectionCard icon={SettingsIcon} tone="blue" title={pf.educationLabel} theme={equippedTheme}>
        <div className="grid gap-3 sm:grid-cols-2">
          {education.map((e, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-xl border p-4 text-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                borderColor: tokens.innerBorder,
                backgroundColor: tokens.innerBg,
              }}
            >
              {equippedTheme ? (
                <div
                  className="pointer-events-none absolute left-0 top-0 bottom-0 w-1 rounded-l opacity-90"
                  style={{ backgroundColor: tokens.primary }}
                />
              ) : null}
              <p className="font-bold text-base transition-colors" style={{ color: tokens.headingText }}>
                {e.instituteName || "—"}
              </p>
              <p className="mt-0.5 text-sm" style={{ color: tokens.mutedText }}>{e.fieldOfStudy || "—"}</p>
              <p className="text-xs mt-2 font-mono uppercase font-bold" style={{ color: tokens.accentText }}>
                {t.dashboard.profileForm.workEducation[INSTITUTE_TYPE_LABEL_KEY[e.instituteType]]}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Player Snapshot */}
      <SectionCard icon={FlameIcon} tone="accent" title={pf.snapshot.title} subtitle={pf.snapshot.subtitle} theme={equippedTheme}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SnapshotRow label={pf.snapshot.debut} value={insights.snapshot.debut} tone="accent" theme={equippedTheme} />
          <SnapshotRow label={pf.snapshot.lastPlayed} value={insights.snapshot.lastPlayed} tone="accent" theme={equippedTheme} />
          <SnapshotRow label={pf.snapshot.avgGap} value={insights.snapshot.avgGapLabel} tone="accent" theme={equippedTheme} />
          <SnapshotRow label={pf.snapshot.maxGap} value={insights.snapshot.maxGapLabel} tone="accent" theme={equippedTheme} />
          <SnapshotRow
            label={pf.snapshot.unbeatenStreak}
            value={`${insights.snapshot.unbeatenStreak.matches} ${pf.snapshot.matchesSuffix}: ${insights.snapshot.unbeatenStreak.from} — ${insights.snapshot.unbeatenStreak.to}`}
            tone="accent"
            theme={equippedTheme}
          />
          <SnapshotRow
            label={pf.snapshot.highestGoals}
            value={`${insights.snapshot.highestGoals.goals} goals — ${insights.snapshot.highestGoals.date} vs ${insights.snapshot.highestGoals.opponent} (${insights.snapshot.highestGoals.goals}–${insights.snapshot.highestGoals.conceded})`}
            tone="accent"
            theme={equippedTheme}
          />
        </div>
      </SectionCard>

      {/* Top opponents */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <SectionCard icon={UsersIcon} tone="danger" title={pf.topOpponents.playedTitle} className="mt-0" theme={equippedTheme}>
          <div
            className="flex items-center justify-between rounded-xl border p-4 backdrop-blur"
            style={{
              borderColor: tokens.innerBorder,
              backgroundColor: tokens.innerBg,
            }}
          >
            <div>
              <p className="text-base font-bold" style={{ color: tokens.headingText }}>{insights.topOpponents.mostPlayed.name}</p>
              <p className="text-xs font-mono mt-0.5" style={{ color: tokens.mutedText }}>
                {insights.topOpponents.mostPlayed.matches} {pf.topOpponents.matchesSuffix}
              </p>
            </div>
            <span
              className="rounded-full px-3 py-1 font-mono text-[10px] font-black uppercase border shadow-sm backdrop-blur"
              style={{
                borderColor: tokens.highlightBorder,
                color: tokens.highlightText,
                backgroundColor: tokens.highlightBg,
              }}
            >
              Rival
            </span>
          </div>
        </SectionCard>
        <SectionCard icon={TrophyIcon} tone="success" title={pf.topOpponents.winsTitle} className="mt-0" theme={equippedTheme}>
          <div
            className="flex items-center justify-between rounded-xl border p-4 backdrop-blur"
            style={{
              borderColor: tokens.innerBorder,
              backgroundColor: tokens.innerBg,
            }}
          >
            <div>
              <p className="text-base font-bold" style={{ color: tokens.headingText }}>{insights.topOpponents.mostWins.name}</p>
              <p className="text-xs font-mono mt-0.5" style={{ color: tokens.mutedText }}>
                {insights.topOpponents.mostWins.wins} {pf.topOpponents.winsSuffix}
              </p>
            </div>
            <span
              className="rounded-full px-3 py-1 font-mono text-[10px] font-black uppercase border shadow-sm backdrop-blur"
              style={{
                borderColor: tokens.highlightBorder,
                color: tokens.highlightText,
                backgroundColor: tokens.highlightBg,
              }}
            >
              Dominant
            </span>
          </div>
        </SectionCard>
      </div>

      {/* Season Performance Trend */}
      <SectionCard
        icon={ChartIcon}
        tone="blue"
        title={pf.trend.title}
        theme={equippedTheme}
        action={
          <div
            className="flex gap-1.5 rounded-full border p-1 backdrop-blur"
            style={{
              borderColor: tokens.innerBorder,
              backgroundColor: tokens.innerBg,
            }}
          >
            <button
              type="button"
              onClick={() => setTrendView("monthly")}
              className="rounded-full px-3 py-1 text-xs font-bold transition-colors"
              style={{
                backgroundColor: trendView === "monthly" ? tokens.primary : "transparent",
                color: trendView === "monthly" ? "#000000" : tokens.mutedText,
              }}
            >
              {pf.trend.monthlyTab}
            </button>
            <button
              type="button"
              onClick={() => setTrendView("weekly")}
              className="rounded-full px-3 py-1 text-xs font-bold transition-colors"
              style={{
                backgroundColor: trendView === "weekly" ? tokens.primary : "transparent",
                color: trendView === "weekly" ? "#000000" : tokens.mutedText,
              }}
            >
              {pf.trend.weeklyTab}
            </button>
          </div>
        }
      >
        <RankTrendChart data={trendView === "monthly" ? insights.monthlyTrend : insights.weeklyTrend} />

        <div className="mt-8 border-t pt-6" style={{ borderColor: tokens.innerBorder }}>
          <h4 className="font-display text-base font-bold" style={{ color: tokens.headingText }}>{pf.trend.matchLoadTitle}</h4>
          <p className="mt-1 text-sm font-medium" style={{ color: tokens.mutedText }}>{pf.trend.matchLoadSubtitle}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold" style={{ color: tokens.mutedText }}>
            <span className="flex items-center gap-1.5 font-mono">
              <span className="h-2 w-2 rounded-full" style={{ background: tokens.primary }} />
              {pf.trend.legendMatches}
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <span className="h-2 w-2 rounded-full" style={{ background: tokens.secondary }} />
              {pf.trend.legendWins}
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <span className="h-2 w-2 rounded-full" style={{ background: tokens.accentText }} />
              {pf.trend.legendGoals}
            </span>
          </div>
          <div className="mt-3">
            <MatchLoadChart data={insights.monthlyMatchLoad} />
          </div>
        </div>
      </SectionCard>

      {/* Rankings Overview */}
      <SectionCard icon={BracketIcon} tone="accent" title={pf.rankingsOverview.title} subtitle={pf.rankingsOverview.subtitle} theme={equippedTheme}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {insights.seasonRankings.map((row) => (
            <div
              key={row.label}
              className="group relative flex items-center justify-between overflow-hidden rounded-xl border px-4 py-3.5 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                borderColor: tokens.innerBorder,
                backgroundColor: tokens.innerBg,
              }}
            >
              {equippedTheme ? (
                <div
                  className="pointer-events-none absolute left-0 top-0 bottom-0 w-1 rounded-l opacity-90"
                  style={{ backgroundColor: tokens.primary }}
                />
              ) : null}
              <div>
                <p className="text-sm font-bold transition-colors" style={{ color: tokens.headingText }}>{row.label}</p>
                <p className="text-xs font-mono mt-0.5" style={{ color: tokens.mutedText }}>
                  {row.wins.toLocaleString()} {pf.rankingsOverview.winsSuffix}
                </p>
              </div>
              <RankBadge rank={row.rank} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Statistics tables */}
      <StatsTable title={pf.stats.allTimeTitle} row={insights.statsAllTime} pf={pf.stats} tone="success" icon={ShieldIcon} theme={equippedTheme} />
      <StatsTable title={pf.stats.season2026Title} row={insights.statsSeason2026} pf={pf.stats} tone="warning" icon={CrosshairIcon} theme={equippedTheme} />

      {/* Personal Info */}
      <SectionCard icon={SettingsIcon} tone="blue" title={pf.personalInfo.title} theme={equippedTheme}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SnapshotRow
            label={pf.personalInfo.device}
            value={deviceModel ? `${deviceName}, ${pf.personalInfo.modelPrefix}: ${deviceModel}` : deviceName}
            tone="blue"
            theme={equippedTheme}
          />
          <SnapshotRow label={pf.personalInfo.konamiUid} value={konamiUid} tone="blue" theme={equippedTheme} />
          <SnapshotRow label={pf.personalInfo.birthday} value={birthday} tone="blue" theme={equippedTheme} />
          <SnapshotRow label={pf.personalInfo.bloodGroup} value={bloodGroup} tone="blue" theme={equippedTheme} />
          <SnapshotRow label={pf.districtLabel} value={district} tone="blue" theme={equippedTheme} />
          <SnapshotRow label={pf.divisionLabel} value={division} tone="blue" theme={equippedTheme} />
        </div>
      </SectionCard>

      {/* Transfer History */}
      <SectionCard icon={SwapIcon} tone="danger" title={pf.transferHistory.title} theme={equippedTheme}>
        <TransferJourney entries={insights.transferHistory} theme={equippedTheme} />
      </SectionCard>
    </div>
  );
}

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function TransferJourney({ entries, theme }: { entries: TransferEntry[]; theme?: CosmeticItem | null }) {
  const tokens = getThemeTokens(theme);
  const W = 100;
  const ROW = 20;
  const RAIL_LEFT = 35;
  const RAIL_RIGHT = 65;
  const ordered = [...entries].reverse(); // oldest (debut) first, newest (current) last
  const n = ordered.length;
  const H = Math.max(ROW * 1.5, n * ROW);
  const margin = ROW * 0.7;

  const points = ordered.map((tr, k) => {
    const t = n > 1 ? k / (n - 1) : 0;
    const x = k % 2 === 0 ? RAIL_RIGHT : RAIL_LEFT;
    const y = H - margin - t * (H - margin * 2);
    return { x, y, tr };
  });

  const roadPath = smoothPath(points);

  return (
    <div className="mx-auto w-full max-w-sm" style={{ aspectRatio: `${W} / ${H}` }}>
      <div className="relative h-full w-full">
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          <path
            d={roadPath}
            stroke={theme ? tokens.innerBorder : "var(--surface-line-strong)"}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={roadPath}
            stroke={tokens.primary}
            strokeWidth="1.2"
            strokeDasharray="1.8 2.2"
            opacity="0.95"
            fill="none"
            style={{ filter: theme ? `drop-shadow(0 0 6px ${tokens.primary})` : undefined }}
          />
        </svg>

        {points.map((p, i) => (
          <div
            key={i}
            className="absolute flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 shadow-xl backdrop-blur transition-all hover:scale-110"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: "translate(-50%, -50%)",
              borderColor: tokens.innerBorder,
              backgroundColor: tokens.innerBg,
              boxShadow: theme ? tokens.glowShadow : undefined,
            }}
          >
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-black shadow-sm"
              style={{
                backgroundColor: tokens.primary,
                color: "#000000",
              }}
            >
              {p.tr.jersey}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="max-w-[100px] truncate text-[10px] font-bold" style={{ color: tokens.headingText }}>
                {p.tr.club}
              </p>
              <p className="max-w-[100px] truncate text-[8px] font-mono" style={{ color: tokens.mutedText }}>
                {p.tr.date}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

