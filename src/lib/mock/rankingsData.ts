import type { Club, Person } from "./types";

// Deterministic seeded RNG (mulberry32) so the generated leaderboard is stable
// across renders/reloads instead of reshuffling on every hook call.
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

export type PlayerRange = "all-time" | "season-2026" | "this-week" | "last-week" | "this-month" | "last-month";

export const PLAYER_RANGES: { key: PlayerRange; label: string }[] = [
  { key: "all-time", label: "All-Time" },
  { key: "season-2026", label: "Season 2026" },
  { key: "this-week", label: "This Week" },
  { key: "last-week", label: "Last Week" },
  { key: "this-month", label: "This Month" },
  { key: "last-month", label: "Last Month" },
];

const RANGE_SEED: Record<PlayerRange, number> = {
  "all-time": 1001,
  "season-2026": 2026,
  "this-week": 3001,
  "last-week": 3002,
  "this-month": 4001,
  "last-month": 4002,
};

// Smaller windows naturally cap every counting stat lower than the all-time pool.
const RANGE_SCALE: Record<PlayerRange, number> = {
  "all-time": 1,
  "season-2026": 0.45,
  "this-week": 0.015,
  "last-week": 0.015,
  "this-month": 0.06,
  "last-month": 0.06,
};

export const TOTAL_PLAYERS = 28227;

export const PLAYER_METRIC_MAX = {
  rank: TOTAL_PLAYERS,
  goalsFor: 2543,
  matchesPlayed: 908,
  totalWins: 624,
};

export type PlayerRankingRow = {
  rank: number;
  id: string;
  name: string;
  dpUrl: string | null;
  isReal: boolean;
  clubName?: string;
  PL: number;
  W: number;
  D: number;
  L: number;
  GF: number;
  GA: number;
  CS: number;
  HT: number;
  DHT: number;
  streak: number;
  motm: number;
  winPct: number;
  PTS: number;
  VP: number;
};

const FIRST_NAMES = [
  "Rakib", "Imran", "Nusrat", "Shakib", "Mehedi", "Tanvir", "Fahim", "Arafat", "Sadia", "Mahin",
  "Rafi", "Junayed", "Sabbir", "Habib", "Riyad", "Farzana", "Kamrul", "Nafisa", "Sourav", "Tamim",
  "Anika", "Rakin", "Shanto", "Nayeem", "Rifat", "Ashiq", "Protik", "Zunaid", "Marufa", "Lamia",
];
const LAST_NAMES = [
  "Hasan", "Kabir", "Jahan", "Al", "Rahman", "Ahmed", "Chowdhury", "Islam", "Afrin", "Anam",
  "Karim", "Noor", "Uddin", "Yasmin", "Hossain", "Tabassum", "Khan", "Alam", "Reza", "Akter",
];

function scaledCap(max: number, scale: number) {
  return Math.max(1, Math.round(max * scale));
}

function buildSyntheticPlayer(rank: number, range: PlayerRange): PlayerRankingRow {
  const rand = mulberry32(RANGE_SEED[range] * 100003 + rank * 7919);
  const scale = RANGE_SCALE[range];
  const plCap = scaledCap(PLAYER_METRIC_MAX.matchesPlayed, scale);
  const PL = Math.max(0, Math.round(rand() * plCap));
  const winRate = 0.2 + rand() * 0.6;
  const W = Math.min(scaledCap(PLAYER_METRIC_MAX.totalWins, scale), Math.round(PL * winRate));
  const remaining = Math.max(0, PL - W);
  const D = Math.round(remaining * rand() * 0.5);
  const L = Math.max(0, remaining - D);
  const GF = Math.min(scaledCap(PLAYER_METRIC_MAX.goalsFor, scale), Math.round(W * 1.8 + D * 0.9 + rand() * 20 * scale * 40));
  const GA = Math.round(L * 1.5 + D * 0.6 + rand() * 12 * scale * 40);
  const CS = Math.round(W * rand() * 0.35);
  const HT = Math.round(rand() * rand() * 20 * scale * 3);
  const DHT = Math.round(rand() * rand() * rand() * 8 * scale * 3);
  const streak = Math.round(rand() * winRate * 14);
  const motm = Math.round(W * rand() * 0.3);
  const winPct = PL > 0 ? (W / PL) * 100 : 0;
  const PTS = W * 3 + D + HT * 2 + DHT * 5 + motm;
  const VP = Math.round(PTS * (0.05 + rand() * 0.1));

  const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];

  return {
    rank,
    id: `synthetic-player-${range}-${rank}`,
    name: `${first} ${last}`,
    dpUrl: null,
    isReal: false,
    PL,
    W,
    D,
    L,
    GF,
    GA,
    CS,
    HT,
    DHT,
    streak,
    motm,
    winPct,
    PTS,
    VP,
  };
}

function buildRealPlayer(person: Person, range: PlayerRange, clubName: string | undefined): PlayerRankingRow {
  const rand = mulberry32(RANGE_SEED[range] * 131 + person.id.length * 97 + person.points);
  const scale = RANGE_SCALE[range];
  const plCap = scaledCap(PLAYER_METRIC_MAX.matchesPlayed, scale);
  const winsCap = scaledCap(PLAYER_METRIC_MAX.totalWins, scale);
  const gfCap = scaledCap(PLAYER_METRIC_MAX.goalsFor, scale);
  const strength = 0.55 + rand() * 0.35; // real seeded people skew stronger
  const PL = Math.min(plCap, Math.max(3, Math.round(plCap * (0.5 + rand() * 0.5))));
  const W = Math.min(winsCap, Math.round(PL * strength));
  const remaining = Math.max(0, PL - W);
  const D = Math.round(remaining * 0.4);
  const L = Math.max(0, remaining - D);
  const GF = Math.min(gfCap, Math.round(W * 2.1 + D * 1 + rand() * 10));
  const GA = Math.round(L * 1.4 + D * 0.6 + rand() * 6);
  const CS = Math.round(W * 0.3);
  const HT = Math.round(3 + rand() * 6);
  const DHT = Math.round(rand() * 2);
  const streak = Math.round(strength * 10);
  const motm = Math.round(W * 0.25);
  const winPct = PL > 0 ? (W / PL) * 100 : 0;
  const PTS = person.points + W * 3 + D + HT * 2 + DHT * 5 + motm;
  const VP = Math.round(PTS * 0.08);

  return {
    rank: 0,
    id: person.id,
    name: person.name,
    dpUrl: person.dpUrl,
    isReal: true,
    clubName,
    PL,
    W,
    D,
    L,
    GF,
    GA,
    CS,
    HT,
    DHT,
    streak,
    motm,
    winPct,
    PTS,
    VP,
  };
}

export function getPlayerRankings(range: PlayerRange, realPeople: Person[], clubNameById: Map<string, string>): PlayerRankingRow[] {
  const real = realPeople.map((p) => buildRealPlayer(p, range, p.clubId ? clubNameById.get(p.clubId) : undefined));
  const syntheticCount = TOTAL_PLAYERS - real.length;
  const synthetic: PlayerRankingRow[] = [];
  for (let i = 0; i < syntheticCount; i++) {
    synthetic.push(buildSyntheticPlayer(i + 1, range));
  }
  const merged = [...real, ...synthetic].sort((a, b) => b.PTS - a.PTS);
  merged.forEach((row, idx) => {
    row.rank = idx + 1;
  });
  return merged;
}

// ---- Clubs ----

export const TOTAL_CLUBS = 446;

export const CLUB_METRIC_MAX = {
  rank: TOTAL_CLUBS,
  rating: 3113,
  matchesPlayed: 558,
  totalWins: 420,
  goalsFor: 3713,
};

export type ClubTier = "Apex" | "Elite" | "Foundation" | "Academy" | "Youth" | "University" | "College" | "Division" | "District";

export const CLUB_QUICK_FILTERS: { key: string; label: string; tiers: ClubTier[] | null }[] = [
  { key: "overall", label: "Overall", tiers: null },
  { key: "apex-elite", label: "Apex + Elite", tiers: ["Apex", "Elite"] },
  { key: "foundation", label: "Foundation", tiers: ["Foundation"] },
  { key: "academy", label: "Academy", tiers: ["Academy"] },
  { key: "youth", label: "Youth", tiers: ["Youth"] },
  { key: "university", label: "University", tiers: ["University"] },
  { key: "college", label: "College", tiers: ["College"] },
  { key: "division", label: "Division", tiers: ["Division"] },
  { key: "district", label: "District", tiers: ["District"] },
];

const TIER_WEIGHTS: { tier: ClubTier; weight: number }[] = [
  { tier: "Apex", weight: 1 },
  { tier: "Elite", weight: 3 },
  { tier: "Foundation", weight: 6 },
  { tier: "Academy", weight: 8 },
  { tier: "Youth", weight: 10 },
  { tier: "University", weight: 10 },
  { tier: "College", weight: 10 },
  { tier: "Division", weight: 14 },
  { tier: "District", weight: 18 },
];
const TIER_TOTAL_WEIGHT = TIER_WEIGHTS.reduce((s, t) => s + t.weight, 0);

function pickTier(rand: () => number): ClubTier {
  let r = rand() * TIER_TOTAL_WEIGHT;
  for (const t of TIER_WEIGHTS) {
    if (r < t.weight) return t.tier;
    r -= t.weight;
  }
  return "District";
}

const CLUB_ADJECTIVES = [
  "Royal", "United", "Northern", "Southern", "Crimson", "Golden", "Iron", "Silver", "Rapid", "Coastal",
  "Prime", "Rising", "Eastern", "Western", "Urban", "Metro", "Central", "Allied", "Frontier", "Union",
];
const CLUB_NOUNS = [
  "Falcons", "Hawks", "Panthers", "Titans", "Warriors", "Strikers", "Rangers", "Knights", "Wolves", "Eagles",
  "Comets", "Raiders", "Lions", "Sparks", "Bulls", "Storm", "Phoenix", "Legends", "Vipers", "Guardians",
];

export type ClubSeason = "all-time" | "2026";

function buildSyntheticClub(index: number, season: ClubSeason): Omit<ClubRankingRow, "rank"> {
  const seasonOffset = season === "2026" ? 500000 : 0;
  const rand = mulberry32(index * 92821 + 17 + seasonOffset);
  const tier = pickTier(rand);
  const M = Math.round(rand() * CLUB_METRIC_MAX.matchesPlayed);
  const winRate = 0.2 + rand() * 0.55;
  const W = Math.min(CLUB_METRIC_MAX.totalWins, Math.round(M * winRate));
  const remaining = Math.max(0, M - W);
  const D = Math.round(remaining * rand() * 0.5);
  const L = Math.max(0, remaining - D);
  const GF = Math.min(CLUB_METRIC_MAX.goalsFor, Math.round(W * 3.2 + D * 1.1 + rand() * 60));
  const GA = Math.round(L * 2.4 + D * 0.9 + rand() * 50);
  const GD = GF - GA;
  const winPct = M > 0 ? (W / M) * 100 : 0;
  const rating = Math.min(CLUB_METRIC_MAX.rating, Math.max(0, Math.round(W * 4 + D * 1 + GD * 0.4 + rand() * 60)));

  const adj = CLUB_ADJECTIVES[Math.floor(rand() * CLUB_ADJECTIVES.length)];
  const noun = CLUB_NOUNS[Math.floor(rand() * CLUB_NOUNS.length)];

  return {
    id: `synthetic-club-${index}`,
    name: `${adj} ${noun}`,
    color: null,
    dpUrl: null,
    isReal: false,
    tier,
    M,
    W,
    D,
    L,
    GF,
    GA,
    GD,
    winPct,
    rating,
  };
}

function buildRealClub(club: Club): Omit<ClubRankingRow, "rank"> {
  const rand = mulberry32(club.id.length * 5011 + club.points);
  const M = Math.min(CLUB_METRIC_MAX.matchesPlayed, Math.round(150 + rand() * 200));
  const winRate = 0.45 + rand() * 0.3;
  const W = Math.min(CLUB_METRIC_MAX.totalWins, Math.round(M * winRate));
  const remaining = Math.max(0, M - W);
  const D = Math.round(remaining * 0.4);
  const L = Math.max(0, remaining - D);
  const GF = Math.min(CLUB_METRIC_MAX.goalsFor, Math.round(W * 3.4 + D * 1.1 + rand() * 30));
  const GA = Math.round(L * 2 + D * 0.8 + rand() * 20);
  const GD = GF - GA;
  const winPct = M > 0 ? (W / M) * 100 : 0;
  const rating = Math.min(CLUB_METRIC_MAX.rating, club.points + Math.round(W * 4 + D + GD * 0.4));

  return {
    id: club.id,
    name: club.name,
    color: club.color,
    dpUrl: club.dpUrl,
    isReal: true,
    tier: "Apex",
    M,
    W,
    D,
    L,
    GF,
    GA,
    GD,
    winPct,
    rating,
  };
}

export type ClubRankingRow = {
  rank: number;
  id: string;
  name: string;
  color: string | null;
  dpUrl: string | null;
  isReal: boolean;
  tier: ClubTier;
  M: number;
  W: number;
  D: number;
  L: number;
  GF: number;
  GA: number;
  GD: number;
  winPct: number;
  rating: number;
};

export function getClubRankings(realClubs: Club[], season: ClubSeason = "all-time"): ClubRankingRow[] {
  const real = realClubs.map((c) => ({ ...buildRealClub(c), rank: 0 }));
  const syntheticCount = TOTAL_CLUBS - real.length;
  const synthetic: ClubRankingRow[] = [];
  for (let i = 0; i < syntheticCount; i++) {
    synthetic.push({ ...buildSyntheticClub(i + 1, season), rank: 0 });
  }
  const merged = [...real, ...synthetic].sort((a, b) => b.rating - a.rating);
  merged.forEach((row, idx) => {
    row.rank = idx + 1;
  });
  return merged;
}
