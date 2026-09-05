"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getClubRankings, type ClubSeason } from "@/lib/mock/rankingsData";
import type { Club } from "@/lib/mock/types";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { StagePill } from "./StagePill";
import { RankBadge } from "./RankBadge";

type Person = ReturnType<typeof useMockPeople>[number];
type Team = "Main" | "Academy";

// Small local seeded generator (same mulberry32 idiom used across the mock
// layer) — fabricates a second ranking row for a club's Academy team, scaled
// down from its Main-team rating, rather than building a parallel per-team
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

function buildTeamRow(club: Club, team: Team, baseRank: number, baseRating: number): TeamRow {
  const rand = mulberry32(seedFromId(`${club.id}-${team}`, 5501));
  const scale = team === "Main" ? 1 : 0.55;
  const PL = Math.round((150 + rand() * 200) * scale);
  const winRate = (team === "Main" ? 0.45 : 0.35) + rand() * 0.3;
  const W = Math.round(PL * winRate);
  const remaining = Math.max(0, PL - W);
  const D = Math.round(remaining * 0.4);
  const GF = Math.round(W * 3 + D + rand() * 20);
  const GA = Math.round(Math.max(0, PL - W - D) * 2 + rand() * 15);
  const GD = GF - GA;
  const winPct = PL > 0 ? (W / PL) * 100 : 0;

  return {
    team,
    rank: team === "Main" ? baseRank : baseRank + 20 + Math.floor(rand() * 30),
    PL,
    W,
    D,
    GF,
    GA,
    GD,
    winPct,
    rating: team === "Main" ? baseRating : Math.round(baseRating * scale),
  };
}

export function ClubRankingsTab({ club, members }: { club: Club; members: Person[] }) {
  const { t } = useLanguage();
  const [season, setSeason] = useState<ClubSeason>("all-time");

  const hasAcademy = members.some((p) => p.squadTeam === "Academy");
  const teams: Team[] = hasAcademy ? ["Main", "Academy"] : ["Main"];

  const clubRow = useMemo(() => getClubRankings([club], season)[0], [club, season]);
  const rows = useMemo(
    () => teams.map((team) => buildTeamRow(club, team, clubRow.rank, clubRow.rating)),
    [teams, club, clubRow]
  );

  return (
    <div className="space-y-5">
      <div className="flex w-fit gap-1.5 rounded-full border border-surface-line-strong p-1">
        {(["all-time", "2026"] as ClubSeason[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSeason(s)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              season === s ? "bg-accent-soft text-accent-ink" : "text-ink-soft hover:text-ink"
            }`}
          >
            {s === "all-time" ? t.dashboard.clubRankings.allTimeHeading : t.dashboard.clubRankings.currentSeasonHeading}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.team} className="rounded-xl border border-surface-line bg-surface/40 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <RankBadge rank={row.rank} />
              <div className="min-w-[7rem]">
                <div className="text-sm font-semibold text-ink">
                  {row.team === "Main" ? t.dashboard.clubRankings.mainTeamLabel : t.dashboard.clubRankings.academyTeamLabel}
                </div>
                <StagePill stage={club.stage} className="mt-1" />
              </div>
              <div className="ml-auto grid grid-cols-3 gap-x-5 gap-y-2 text-center sm:grid-cols-7">
                {[
                  { label: "PL", value: row.PL },
                  { label: "W", value: row.W },
                  { label: "D", value: row.D },
                  { label: "GF:GA", value: `${row.GF}:${row.GA}` },
                  { label: "GD", value: row.GD >= 0 ? `+${row.GD}` : row.GD },
                  { label: "Win", value: `${row.winPct.toFixed(1)}%` },
                  { label: "Rating", value: row.rating.toLocaleString() },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="font-mono text-sm font-bold text-ink">{m.value}</div>
                    <div className="font-mono text-[9px] uppercase tracking-wide text-ink-faint">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-surface-line bg-surface/30 p-5">
        <h3 className="font-display text-sm font-bold text-ink">{t.dashboard.rankings.abbreviationsTitle}</h3>
        <p className="mt-2 text-xs leading-relaxed text-ink-faint">{t.dashboard.rankings.abbreviationsText}</p>
      </div>
    </div>
  );
}
