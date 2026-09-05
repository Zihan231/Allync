"use client";

import { useMemo } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getClubRankings } from "@/lib/mock/rankingsData";
import type { Club } from "@/lib/mock/types";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { StagePill } from "./StagePill";
import { RankBadge } from "./RankBadge";

type Person = ReturnType<typeof useMockPeople>[number];
type Team = "Main" | "Academy";

// Small local seeded generator (same mulberry32 idiom used across the mock
// layer) — fabricates per-team, per-season ranking rows scaled down from the
// club's all-time rating, rather than building a parallel per-team/per-season
// stats engine in rankingsData.ts.
function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromId(id: string, salt: number) {
  let h = salt;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return h >>> 0;
}

// Season weights are fractions of the club's all-time totals — 2027 is the
// current, still-young season (small slice), 2026 was the first full season
// (bulk of the games), 2025 was the club's debut year.
const SEASON_DEFS: { key: string; label: string; weight: number }[] = [
  { key: "2027", label: "eFootball 2027", weight: 0.06 },
  { key: "2026", label: "eFootball 2026", weight: 0.68 },
  { key: "2025", label: "eFootball 2025", weight: 0.26 },
];

type TeamRow = {
  team: Team;
  rank: number;
  PL: number;
  W: number;
  D: number;
  GF: number;
  GA: number;
  GD: number;
  winPct: number;
  rating: number;
};

// All-time row: the source of truth, independently seeded per team.
function buildAllTimeTeamRow(club: Club, team: Team, baseRank: number, baseRating: number): TeamRow {
  const rand = mulberry32(seedFromId(`${club.id}-${team}-all-time`, 5501));
  const scale = team === "Main" ? 1 : 0.55;
  const PL = Math.round((150 + rand() * 200) * scale);
  const winRate = (team === "Main" ? 0.45 : 0.35) + rand() * 0.3;
  const W = Math.round(PL * winRate);
  const remaining = Math.max(0, PL - W);
  const D = Math.round(remaining * 0.4);
  const GF = Math.round(W * 3 + D + rand() * 20);
  const GA = Math.round(Math.max(0, PL - W - D) * 2 + rand() * 15);
  const GD = GF - GA;
  const winPct = PL > 0 ? ((W + D / 2) / PL) * 100 : 0;
  const rank = team === "Main" ? baseRank : baseRank + 20 + Math.floor(rand() * 30);

  return { team, rank, PL, W, D, GF, GA, GD, winPct, rating: team === "Main" ? baseRating : Math.round(baseRating * scale) };
}

// Season rows are derived as a weighted slice of the all-time row (plus a
// small jitter) so a club's season-by-season numbers roughly add up to its
// all-time totals instead of being generated as a wholly separate universe.
function buildSeasonTeamRow(club: Club, allTime: TeamRow, seasonKey: string, weight: number): TeamRow {
  const rand = mulberry32(seedFromId(`${club.id}-${allTime.team}-${seasonKey}`, 5501));
  const jitter = 0.9 + rand() * 0.2;
  const scale = weight * jitter;

  const PL = Math.max(1, Math.round(allTime.PL * scale));
  const W = Math.min(PL, Math.round(allTime.W * scale));
  const remaining = Math.max(0, PL - W);
  const D = Math.min(remaining, Math.round(allTime.D * scale));
  const GF = Math.round(allTime.GF * scale);
  const GA = Math.round(allTime.GA * scale);
  const GD = GF - GA;
  const winPct = PL > 0 ? ((W + D / 2) / PL) * 100 : 0;
  const rank =
    allTime.team === "Main"
      ? Math.max(1, allTime.rank + Math.floor(rand() * 60) - 30)
      : Math.max(1, allTime.rank + Math.floor(rand() * 30) - 15);

  return { team: allTime.team, rank, PL, W, D, GF, GA, GD, winPct, rating: Math.max(1, Math.round(allTime.rating * scale)) };
}

function RankMetrics({ row }: { row: TeamRow }) {
  const metrics = [
    { label: "PL", value: row.PL },
    { label: "W", value: row.W },
    { label: "D", value: row.D },
    { label: "GF:GA", value: `${row.GF}:${row.GA}` },
    { label: "GD", value: row.GD >= 0 ? `+${row.GD}` : row.GD },
    { label: "Win", value: `${row.winPct.toFixed(1)}%` },
    { label: "Rating", value: row.rating.toLocaleString() },
  ];
  return (
    <div className="ml-auto grid grid-cols-3 gap-x-5 gap-y-2 text-center sm:grid-cols-7">
      {metrics.map((m) => (
        <div key={m.label}>
          <div className="font-mono text-sm font-bold text-ink">{m.value}</div>
          <div className="font-mono text-[9px] uppercase tracking-wide text-ink-faint">{m.label}</div>
        </div>
      ))}
    </div>
  );
}

function RankSection({
  sectionLabel,
  title,
  rows,
  teamsUnit,
  stage,
  mainLabel,
  academyLabel,
}: {
  sectionLabel: string;
  title: string;
  rows: TeamRow[];
  teamsUnit: string;
  stage: Club["stage"];
  mainLabel: string;
  academyLabel: string;
}) {
  return (
    <div className="rounded-xl border border-surface-line bg-surface/30 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{sectionLabel}</div>
          <h3 className="font-display text-base font-bold text-ink">{title}</h3>
        </div>
        <span className="font-mono text-xs text-ink-faint">
          {rows.length} {teamsUnit}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.team} className="rounded-xl border border-surface-line bg-surface/40 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <RankBadge rank={row.rank} />
              <div className="min-w-[7rem]">
                <div className="text-sm font-semibold text-ink">{row.team === "Main" ? mainLabel : academyLabel}</div>
                <StagePill stage={stage} className="mt-1" />
              </div>
              <RankMetrics row={row} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClubRankingsTab({ club, members }: { club: Club; members: Person[] }) {
  const { t } = useLanguage();

  const hasAcademy = members.some((p) => p.squadTeam === "Academy");
  const teams: Team[] = hasAcademy ? ["Main", "Academy"] : ["Main"];

  const allTimeClubRow = useMemo(() => getClubRankings([club], "all-time")[0], [club]);

  const allTimeRows = useMemo(
    () => teams.map((team) => buildAllTimeTeamRow(club, team, allTimeClubRow.rank, allTimeClubRow.rating)),
    [teams, club, allTimeClubRow]
  );

  const seasonRowsList = useMemo(
    () =>
      SEASON_DEFS.map((season) => ({
        ...season,
        rows: allTimeRows.map((row) => buildSeasonTeamRow(club, row, season.key, season.weight)),
      })),
    [allTimeRows, club]
  );

  return (
    <div className="space-y-5">
      <RankSection
        sectionLabel={t.dashboard.clubRankings.allTimeHeading}
        title={t.dashboard.clubRankings.rankingOverviewTitle}
        rows={allTimeRows}
        teamsUnit={t.dashboard.clubRankings.teamsUnit}
        stage={club.stage}
        mainLabel={t.dashboard.clubRankings.mainTeamLabel}
        academyLabel={t.dashboard.clubRankings.academyTeamLabel}
      />

      {seasonRowsList.map((season) => (
        <RankSection
          key={season.key}
          sectionLabel={t.dashboard.clubRankings.seasonSectionLabel}
          title={season.label}
          rows={season.rows}
          teamsUnit={t.dashboard.clubRankings.teamsUnit}
          stage={club.stage}
          mainLabel={t.dashboard.clubRankings.mainTeamLabel}
          academyLabel={t.dashboard.clubRankings.academyTeamLabel}
        />
      ))}

      <div className="rounded-xl border border-surface-line bg-surface/30 p-5">
        <h3 className="font-display text-sm font-bold text-ink">{t.dashboard.rankings.abbreviationsTitle}</h3>
        <p className="mt-2 text-xs leading-relaxed text-ink-faint">{t.dashboard.rankings.abbreviationsText}</p>
      </div>
    </div>
  );
}
