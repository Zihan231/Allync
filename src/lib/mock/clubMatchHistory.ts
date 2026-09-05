import type { Club, Person } from "./types";

// Same deterministic-seeding idiom as clubInsights.ts / clubTransferLog.ts /
// playerInsights.ts / rankingsData.ts — duplicated locally rather than
// shared, so this module has no coupling to other mock modules' name pools.
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

const REFERENCE_NOW = new Date("2026-09-01T00:00:00+06:00");

function addDays(d: Date, days: number) {
  return new Date(d.getTime() + days * 86400000);
}

function fmtDate(d: Date) {
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  return `${day} ${month} ${d.getFullYear()}`;
}

function pick<T>(arr: readonly T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

const OPPONENT_CLUB_POOL = [
  "Nexus", "Tornado Extreme", "Extreme Hunter", "El Galacticos", "Narayanganj Pes Club",
  "Munshiganj Rule Breakers", "Hala Madrid", "Thunder FC", "Mighty Monarchs",
  "Bangladesh Fighting Cardinals", "Raging Leopards BD", "Aether Athletic",
];

const COMPETITION_POOL = [
  "Dhaka Elite Community League", "Weekend Cup", "Quarter-Final Clash", "Friendly Match", "Community Knockout",
];

const SQUAD_TEAMS = ["Main", "Academy"] as const;
const SEASONS = ["2027", "2026", "2025"] as const;

// ---- Rounds (completed match/round history) ----

export type ClubRoundEntry = {
  id: string;
  competition: string;
  round: string;
  season: (typeof SEASONS)[number];
  team: (typeof SQUAD_TEAMS)[number];
  opponentClubName: string;
  scoreFor: number;
  scoreAgainst: number;
  result: "W" | "D" | "L";
  date: string;
};

export function getClubRoundHistory(club: Club, members: Person[]): ClubRoundEntry[] {
  const rand = mulberry32(seedFromId(club.id, 8101));
  const hasAcademy = members.some((p) => p.squadTeam === "Academy");
  const teams = hasAcademy ? SQUAD_TEAMS : (["Main"] as const);

  const count = 18 + Math.floor(rand() * 12); // 18-29
  const entries: ClubRoundEntry[] = [];
  let cursor = addDays(REFERENCE_NOW, -Math.round(rand() * 3));

  for (let i = 0; i < count; i++) {
    const scoreFor = Math.floor(rand() * 6);
    const scoreAgainst = Math.floor(rand() * 5);
    const result: ClubRoundEntry["result"] = scoreFor > scoreAgainst ? "W" : scoreFor === scoreAgainst ? "D" : "L";

    entries.push({
      id: `${club.id}-round-${i}`,
      competition: pick(COMPETITION_POOL, rand),
      round: `GRP${1 + Math.floor(rand() * 4)}-R${1 + Math.floor(rand() * 20)}`,
      season: pick(SEASONS, rand),
      team: pick(teams, rand),
      opponentClubName: pick(OPPONENT_CLUB_POOL, rand),
      scoreFor,
      scoreAgainst,
      result,
      date: fmtDate(cursor),
    });
    cursor = addDays(cursor, -(1 + Math.round(rand() * 4)));
  }

  return entries;
}

// ---- Round Stats / Match Stats (KPI hero + season breakdown) ----

export type ClubStatsKpis = {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  winPct: number;
  gfPerMatch: number;
  cleanSheets: number;
};

export type ClubSeasonStatsRow = {
  season: (typeof SEASONS)[number];
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  winPct: number;
};

export type ClubStatsSummary = {
  allTime: ClubStatsKpis;
  bySeason: ClubSeasonStatsRow[];
};

function buildStatsSummary(club: Club, salt: number, scale: number): ClubStatsSummary {
  const rand = mulberry32(seedFromId(club.id, salt));

  const bySeason: ClubSeasonStatsRow[] = SEASONS.map((season, i) => {
    const seasonScale = scale * (i === 0 ? 0.35 : i === 1 ? 1 : 0.6);
    const played = Math.max(4, Math.round((60 + rand() * 120) * seasonScale));
    const winRate = 0.4 + rand() * 0.4;
    const wins = Math.round(played * winRate);
    const remaining = Math.max(0, played - wins);
    const draws = Math.round(remaining * 0.3);
    const losses = Math.max(0, remaining - draws);
    const goalsFor = Math.round(wins * 3.4 + draws * 1.2 + rand() * 20 * seasonScale);
    const goalsAgainst = Math.round(losses * 2.2 + draws * 0.9 + rand() * 12 * seasonScale);
    const winPct = played > 0 ? ((wins + draws / 2) / played) * 100 : 0;
    return { season, played, wins, draws, losses, goalsFor, goalsAgainst, winPct };
  });

  const allTime = bySeason.reduce<ClubStatsKpis>(
    (acc, row) => ({
      played: acc.played + row.played,
      wins: acc.wins + row.wins,
      draws: acc.draws + row.draws,
      losses: acc.losses + row.losses,
      goalsFor: acc.goalsFor + row.goalsFor,
      goalsAgainst: acc.goalsAgainst + row.goalsAgainst,
      winPct: 0,
      gfPerMatch: 0,
      cleanSheets: acc.cleanSheets,
    }),
    { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, winPct: 0, gfPerMatch: 0, cleanSheets: 0 }
  );
  allTime.winPct = allTime.played > 0 ? ((allTime.wins + allTime.draws / 2) / allTime.played) * 100 : 0;
  allTime.gfPerMatch = allTime.played > 0 ? allTime.goalsFor / allTime.played : 0;
  allTime.cleanSheets = Math.round(allTime.wins * (0.15 + rand() * 0.15));

  return { allTime, bySeason };
}

// "Round" granularity (a tournament round/matchday) — smaller counts.
export function getClubRoundStats(club: Club): ClubStatsSummary {
  return buildStatsSummary(club, 8201, 1);
}

// "Match" granularity (every individual game, incl. friendlies) — larger counts.
export function getClubMatchStats(club: Club): ClubStatsSummary {
  return buildStatsSummary(club, 8301, 6);
}

// ---- Team-up (paired-player match history) ----

export type ClubTeamUpEntry = {
  id: string;
  playerAId: string;
  playerAName: string;
  playerADpUrl: string | null;
  playerBName: string;
  scoreFor: number;
  scoreAgainst: number;
  result: "W" | "D" | "L";
  date: string;
};

const SYNTHETIC_PARTNER_NAMES = [
  "Tanzim Rahman", "Nabila Sultana", "Rakin Ahsan", "Protik Islam", "Marufa Khatun", "Shanto Barua",
];

export function getClubTeamUpHistory(club: Club, members: Person[]): ClubTeamUpEntry[] {
  const rand = mulberry32(seedFromId(club.id, 8401));
  if (members.length === 0) return [];

  const count = 8 + Math.floor(rand() * 6); // 8-13
  const entries: ClubTeamUpEntry[] = [];
  let cursor = addDays(REFERENCE_NOW, -Math.round(rand() * 3));

  for (let i = 0; i < count; i++) {
    const playerA = pick(members, rand);
    const scoreFor = Math.floor(rand() * 7);
    const scoreAgainst = Math.floor(rand() * 5);
    const result: ClubTeamUpEntry["result"] = scoreFor > scoreAgainst ? "W" : scoreFor === scoreAgainst ? "D" : "L";

    entries.push({
      id: `${club.id}-teamup-${i}`,
      playerAId: playerA.id,
      playerAName: playerA.name,
      playerADpUrl: playerA.dpUrl,
      playerBName: pick(SYNTHETIC_PARTNER_NAMES, rand),
      scoreFor,
      scoreAgainst,
      result,
      date: fmtDate(cursor),
    });
    cursor = addDays(cursor, -(1 + Math.round(rand() * 5)));
  }

  return entries;
}
