"use client";

import { use, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockPeople, useMockClubs, useMockCommunities } from "@/lib/mock/communityStore";
import { getPlayerInsights } from "@/lib/mock/playerInsights";
import { BackButton } from "@/components/dashboard/BackButton";
import { CoverPhoto } from "@/components/common/CoverPhoto";
import { Avatar } from "@/components/common/Avatar";
import { RankBadge } from "@/components/dashboard/RankBadge";
import { SectionHeading, type SectionTone } from "@/components/dashboard/SectionHeading";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { RankTrendChart } from "@/components/dashboard/RankTrendChart";
import { MatchLoadChart } from "@/components/dashboard/MatchLoadChart";
import {
  BallIcon,
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
import type { StatsRow, TransferEntry } from "@/lib/mock/playerInsights";

type IconComponent = (props: { className?: string }) => React.ReactElement;

const INSTITUTE_TYPE_LABEL_KEY = {
  University: "instituteTypeUniversity",
  College: "instituteTypeCollege",
  School: "instituteTypeSchool",
  Other: "instituteTypeOther",
} as const;

const TONE_BUBBLE: Record<SectionTone, string> = {
  blue: "bg-blue-soft text-blue-ink",
  accent: "bg-accent-soft text-accent-ink",
  success: "bg-success-soft text-success-ink",
  danger: "bg-danger-soft text-danger-ink",
  warning: "bg-warning-soft text-warning-ink",
};

function formatBloodGroup(bg: string) {
  return bg.endsWith("+") ? `${bg.slice(0, -1)}(+)` : bg.endsWith("-") ? `${bg.slice(0, -1)}(-)` : bg;
}

function formatBirthday(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-surface-line-strong bg-bg-raised px-3 py-1.5 text-xs font-medium text-ink">
      <span className="text-ink-faint">{label}:</span> {value}
    </span>
  );
}

function SectionCard({
  icon: Icon,
  tone,
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  icon: IconComponent;
  tone: SectionTone;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mt-6 rounded-2xl border border-surface-line bg-surface/60 p-6 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONE_BUBBLE[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
            {subtitle ? <p className="text-sm text-ink-soft">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function StatTileCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: IconComponent; tone: SectionTone }) {
  return (
    <div className="rounded-xl border border-surface-line bg-surface/50 p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wide text-ink-faint">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${TONE_BUBBLE[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="font-display mt-3 text-2xl font-bold text-ink">{value}</div>
    </div>
  );
}

function SnapshotRow({ label, value, tone = "accent" }: { label: string; value: string; tone?: SectionTone }) {
  return (
    <div className="rounded-lg border border-surface-line bg-surface px-4 py-3">
      <div className={`font-mono text-[10px] uppercase tracking-wide ${TONE_BUBBLE[tone].split(" ")[1]}`}>{label}</div>
      <div className="mt-1 text-sm font-medium text-ink">{value}</div>
    </div>
  );
}

function StatCell({ label, value, tone }: { label: string; value: string; tone: SectionTone }) {
  return (
    <div className="rounded-lg border border-surface-line bg-surface px-2 py-2.5 text-center">
      <div className={`font-mono text-[10px] uppercase tracking-wide ${TONE_BUBBLE[tone].split(" ")[1]}`}>{label}</div>
      <div className="mt-1 font-display text-sm font-bold text-ink">{value}</div>
    </div>
  );
}

function StatsTable({
  title,
  row,
  pf,
  tone,
  icon,
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
}) {
  const cells: { label: string; value: string; tone: SectionTone }[] = [
    { label: pf.m, value: String(row.m), tone: "blue" },
    { label: pf.w, value: String(row.w), tone: "success" },
    { label: pf.d, value: String(row.d), tone: "blue" },
    { label: pf.l, value: String(row.l), tone: "danger" },
    { label: pf.winPct, value: `${row.winPct}%`, tone: "accent" },
    { label: pf.gf, value: String(row.gf), tone: "success" },
    { label: pf.ga, value: String(row.ga), tone: "danger" },
    { label: pf.cs, value: String(row.cs), tone: "blue" },
    { label: pf.motm, value: String(row.motm), tone: "accent" },
    { label: pf.rt, value: String(row.rt), tone: "warning" },
  ];

  return (
    <SectionCard
      icon={icon}
      tone={tone}
      title={title}
      action={
        <button
          type="button"
          className="rounded-full border border-surface-line-strong px-3.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
        >
          {pf.download}
        </button>
      }
    >
      <div className="-mt-1 mb-4 flex items-center gap-1.5 text-xs text-ink-faint">
        {pf.rankLabel} <RankBadge rank={row.rank} />
      </div>
      <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
        {cells.map((c) => (
          <StatCell key={c.label} {...c} />
        ))}
      </div>
    </SectionCard>
  );
}

export default function PlayerProfilePage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = use(params);
  const { t } = useLanguage();
  const pf = t.dashboard.playerProfile;
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
    <div className="relative">
      <div className="glow-gold pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[420px] -translate-x-1/2 blur-3xl" />
      <div className="glow-blue pointer-events-none absolute right-0 top-32 -z-10 h-[320px] w-[320px] blur-3xl" />

      <BackButton />

      <div className="relative overflow-hidden rounded-xl">
        <CoverPhoto coverUrl={person.coverUrl} name={person.name} className="h-56 sm:h-72 lg:h-80" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, transparent 0 26px, rgba(255,255,255,0.12) 26px 52px)",
          }}
        />
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-bg/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-accent-ink backdrop-blur">
          <BallIcon className="h-3.5 w-3.5" />
          {t.dashboard.shell.navProfile}
        </div>
      </div>

      <div className="-mt-14 flex items-end gap-4 px-1 sm:-mt-16">
        <div className="rounded-full border-4 border-bg bg-surface">
          <Avatar dpUrl={person.dpUrl} name={person.name} size="xl" mode="lightbox" />
        </div>
        <div className="pb-1">
          <h1 className="font-display text-2xl font-bold text-ink">{person.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <RankBadge rank={rank} />
            <span className="font-mono text-xs text-ink-faint">
              {person.points.toLocaleString()} {t.dashboard.players.rankLabel.toLowerCase()}
            </span>
          </div>
        </div>
      </div>

      {person.bio ? <p className="mt-6 max-w-xl text-sm leading-relaxed text-ink-soft">{person.bio}</p> : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTileCard label={pf.statTotalMatches} value={String(insights.totalMatches)} icon={ChartIcon} tone="blue" />
        <StatTileCard label={pf.statTotalWins} value={String(insights.totalWins)} icon={TrophyIcon} tone="success" />
        <StatTileCard label={pf.statWinRate} value={`${insights.winRate}%`} icon={CrosshairIcon} tone="accent" />
        <StatTileCard label={pf.statGoalsFor} value={String(insights.goalsFor)} icon={FlameIcon} tone="danger" />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-surface-line bg-surface/40 p-4">
          <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
            {t.dashboard.players.clubLabel}
          </div>
          {club ? (
            <Link href={`/dashboard/efootball/clubs/${club.id}`} className="mt-2 flex items-center gap-2.5">
              <Avatar dpUrl={club.dpUrl} name={club.name} size="sm" mode="static" />
              <span className="text-sm font-medium text-ink">
                {club.name} · {person.clubRole}
              </span>
            </Link>
          ) : (
            <p className="mt-2 text-sm text-ink-faint">{t.dashboard.players.noAffiliation}</p>
          )}
        </div>

        <div className="rounded-xl border border-surface-line bg-surface/40 p-4">
          <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
            {t.dashboard.players.communityLabel}
          </div>
          {community ? (
            <Link href={`/dashboard/efootball/community/${community.id}`} className="mt-2 flex items-center gap-2.5">
              <Avatar dpUrl={community.dpUrl} name={community.name} size="sm" mode="static" />
              <span className="text-sm font-medium text-ink">
                {community.name} · {person.communityRole}
              </span>
            </Link>
          ) : (
            <p className="mt-2 text-sm text-ink-faint">{t.dashboard.players.noAffiliation}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <InfoPill label={pf.divisionLabel} value={[division, district].filter(Boolean).join(" · ") || "—"} />
        <InfoPill label={pf.countryLabel} value={country} />
      </div>

      <div className="mt-6">
        <SectionHeading tone="blue">{pf.educationLabel}</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2">
          {education.map((e, i) => (
            <div key={i} className="rounded-lg border border-surface-line bg-surface/40 p-4 text-sm">
              <p className="font-semibold text-ink">{e.instituteName || "—"}</p>
              <p className="text-ink-soft">{e.fieldOfStudy || "—"}</p>
              <p className="text-xs text-ink-faint">
                {t.dashboard.profileForm.workEducation[INSTITUTE_TYPE_LABEL_KEY[e.instituteType]]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Player Snapshot */}
      <SectionCard icon={FlameIcon} tone="accent" title={pf.snapshot.title} subtitle={pf.snapshot.subtitle}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SnapshotRow label={pf.snapshot.debut} value={insights.snapshot.debut} tone="accent" />
          <SnapshotRow label={pf.snapshot.lastPlayed} value={insights.snapshot.lastPlayed} tone="accent" />
          <SnapshotRow label={pf.snapshot.avgGap} value={insights.snapshot.avgGapLabel} tone="accent" />
          <SnapshotRow label={pf.snapshot.maxGap} value={insights.snapshot.maxGapLabel} tone="accent" />
          <SnapshotRow
            label={pf.snapshot.unbeatenStreak}
            value={`${insights.snapshot.unbeatenStreak.matches} ${pf.snapshot.matchesSuffix}: ${insights.snapshot.unbeatenStreak.from} — ${insights.snapshot.unbeatenStreak.to}`}
            tone="accent"
          />
          <SnapshotRow
            label={pf.snapshot.highestGoals}
            value={`${insights.snapshot.highestGoals.goals} goals — ${insights.snapshot.highestGoals.date} vs ${insights.snapshot.highestGoals.opponent} (${insights.snapshot.highestGoals.goals}–${insights.snapshot.highestGoals.conceded})`}
            tone="accent"
          />
        </div>
      </SectionCard>

      {/* Top opponents */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <SectionCard icon={UsersIcon} tone="danger" title={pf.topOpponents.playedTitle} className="mt-0">
          <p className="text-sm font-medium text-ink">{insights.topOpponents.mostPlayed.name}</p>
          <p className="text-xs text-ink-faint">
            {insights.topOpponents.mostPlayed.matches} {pf.topOpponents.matchesSuffix}
          </p>
        </SectionCard>
        <SectionCard icon={TrophyIcon} tone="success" title={pf.topOpponents.winsTitle} className="mt-0">
          <p className="text-sm font-medium text-ink">{insights.topOpponents.mostWins.name}</p>
          <p className="text-xs text-ink-faint">
            {insights.topOpponents.mostWins.wins} {pf.topOpponents.winsSuffix}
          </p>
        </SectionCard>
      </div>

      {/* Season Performance Trend */}
      <SectionCard
        icon={ChartIcon}
        tone="blue"
        title={pf.trend.title}
        action={
          <div className="flex gap-1.5 rounded-full border border-surface-line-strong p-1">
            <button
              type="button"
              onClick={() => setTrendView("monthly")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                trendView === "monthly" ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"
              }`}
            >
              {pf.trend.monthlyTab}
            </button>
            <button
              type="button"
              onClick={() => setTrendView("weekly")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                trendView === "weekly" ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"
              }`}
            >
              {pf.trend.weeklyTab}
            </button>
          </div>
        }
      >
        <RankTrendChart data={trendView === "monthly" ? insights.monthlyTrend : insights.weeklyTrend} />

        <div className="mt-8 border-t border-surface-line pt-6">
          <h4 className="font-display text-base font-bold text-ink">{pf.trend.matchLoadTitle}</h4>
          <p className="mt-1 text-sm text-ink-soft">{pf.trend.matchLoadSubtitle}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-soft">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--blue)" }} />
              {pf.trend.legendMatches}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--success)" }} />
              {pf.trend.legendWins}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
              {pf.trend.legendGoals}
            </span>
          </div>
          <div className="mt-3">
            <MatchLoadChart data={insights.monthlyMatchLoad} />
          </div>
        </div>
      </SectionCard>

      {/* Rankings Overview */}
      <SectionCard icon={BracketIcon} tone="accent" title={pf.rankingsOverview.title} subtitle={pf.rankingsOverview.subtitle}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {insights.seasonRankings.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-lg border border-surface-line bg-surface px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-ink">{row.label}</p>
                <p className="text-xs text-ink-faint">
                  {row.wins.toLocaleString()} {pf.rankingsOverview.winsSuffix}
                </p>
              </div>
              <RankBadge rank={row.rank} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Statistics tables */}
      <StatsTable title={pf.stats.allTimeTitle} row={insights.statsAllTime} pf={pf.stats} tone="success" icon={ShieldIcon} />
      <StatsTable title={pf.stats.season2026Title} row={insights.statsSeason2026} pf={pf.stats} tone="warning" icon={CrosshairIcon} />

      {/* Personal Info */}
      <SectionCard icon={SettingsIcon} tone="blue" title={pf.personalInfo.title}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SnapshotRow
            label={pf.personalInfo.device}
            value={deviceModel ? `${deviceName}, ${pf.personalInfo.modelPrefix}: ${deviceModel}` : deviceName}
            tone="blue"
          />
          <SnapshotRow label={pf.personalInfo.konamiUid} value={konamiUid} tone="blue" />
          <SnapshotRow label={pf.personalInfo.birthday} value={birthday} tone="blue" />
          <SnapshotRow label={pf.personalInfo.bloodGroup} value={bloodGroup} tone="blue" />
          <SnapshotRow label={pf.districtLabel} value={district} tone="blue" />
          <SnapshotRow label={pf.divisionLabel} value={division} tone="blue" />
        </div>
      </SectionCard>

      {/* Transfer History */}
      <SectionCard icon={SwapIcon} tone="danger" title={pf.transferHistory.title}>
        <TransferJourney entries={insights.transferHistory} />
      </SectionCard>
    </div>
  );
}

// A single continuous curvy route from the player's debut club (bottom
// right) up to their current club (top left), each transfer plotted as a
// waypoint along it. Coordinates live in an abstract 0-100-wide unit system
// and the container's height is locked to that same ratio via `aspectRatio`,
// so the SVG path and the HTML label cards stay in sync at any screen size
// without measuring real pixel heights.
// A compact zigzag route, one waypoint per transfer (never more, never
// fewer) — the club name and date sit right on the point instead of in an
// offset card. Coordinates live in an abstract 0-100-wide unit system and
// the container's height is locked to that same ratio via `aspectRatio`, so
// the road and the point labels stay in sync at any screen size without
// measuring real pixel heights.
function TransferJourney({ entries }: { entries: TransferEntry[] }) {
  const W = 100;
  const ROW = 13;
  const RAIL_LEFT = 30;
  const RAIL_RIGHT = 70;
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

  let roadPath = "";
  points.forEach((p, i) => {
    if (i === 0) {
      roadPath += `M ${p.x} ${p.y}`;
    } else {
      const prev = points[i - 1];
      const midY = (prev.y + p.y) / 2;
      roadPath += ` C ${prev.x} ${midY}, ${p.x} ${midY}, ${p.x} ${p.y}`;
    }
  });

  return (
    <div className="mx-auto w-full max-w-sm" style={{ aspectRatio: `${W} / ${H}` }}>
      <div className="relative h-full w-full">
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          <path d={roadPath} stroke="var(--surface-line-strong)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path
            d={roadPath}
            stroke="var(--accent)"
            strokeWidth="0.5"
            strokeDasharray="1.8 2.2"
            opacity="0.65"
            fill="none"
          />
        </svg>

        {points.map((p, i) => (
          <div
            key={i}
            className="absolute flex items-center gap-1.5 rounded-full border border-accent/50 bg-surface py-1 pl-1 pr-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)" }}
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[8px] font-bold text-accent-ink">
              {p.tr.jersey}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="max-w-[100px] truncate text-[10px] font-semibold text-ink">{p.tr.club}</p>
              <p className="max-w-[100px] truncate text-[8px] text-ink-faint">{p.tr.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
