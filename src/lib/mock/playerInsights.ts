import type { Person } from "./types";
import { BD_DIVISIONS, BD_DISTRICTS_BY_DIVISION, type BdDivision } from "@/lib/bangladeshLocations";

// Deterministic seeded RNG so a player's generated insights stay stable
// across renders/reloads instead of reshuffling on every visit.
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
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

// The rest of the mock dataset (matches, tournaments) is dated around this
// point in-universe, so insights are generated relative to it rather than
// the real device clock.
const REFERENCE_NOW = new Date("2026-09-01T00:00:00+06:00");

const OPPONENT_NAMES = [
  "নাজমুস সাকিব শুভ~EG",
  "Na Fiz~HS",
  "Rifat Anwar~PX",
  "Tanzim~KX",
  "Shovo Rahman~BD",
  "Arnob Das~TR",
  "Mahin~ZZ",
  "Fahim Faisal~QT",
  "Sabbir~UN",
  "Junayed~LF",
];

const TRANSFER_CLUB_POOL = [
  "Nexus",
  "Tornado Extreme",
  "Extreme Hunter",
  "El Galacticos",
  "Brothers Of Destruction",
  "Narayanganj Pes Club",
  "Munshiganj Rule Breakers",
  "Hala Madrid",
  "Thunder FC",
  "Mighty Monarchs",
  "Bangladesh Fighting Cardinals",
  "Raging Leopards BD",
];

const DEVICE_NAMES = [
  "iPhone 15 Pro",
  "iPhone 14",
  "Samsung Galaxy S23 Ultra",
  "iPad Pro 11-inch",
  "OnePlus 12",
  "Xiaomi 13 Pro",
  "iPhone 13 mini",
  "Samsung Galaxy Tab S9",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const INSTITUTE_NAMES = [
  "University of Dhaka",
  "BUET",
  "North South University",
  "Chittagong University",
  "Rajshahi University",
  "BRAC University",
  "Dhaka College",
  "Notre Dame College",
];

const FIELDS_OF_STUDY = [
  "Computer Science",
  "Business Administration",
  "Electrical Engineering",
  "Economics",
  "English Literature",
  "Civil Engineering",
  "Physics",
  "Marketing",
];

const INSTITUTE_TYPES = ["University", "College", "School", "Other"] as const;

function randomKonamiUid(rand: () => number) {
  const letters = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(rand() * 26))).join("");
  const group = () => String(Math.floor(rand() * 1000)).padStart(3, "0");
  return `${letters}-${group()}-${group()}-${group()}`;
}

function randomDeviceModel(rand: () => number) {
  const letter = () => String.fromCharCode(65 + Math.floor(rand() * 26));
  const digit = () => String(Math.floor(rand() * 10));
  return `${letter()}${letter()}${letter()}${digit()}${digit()}${letter()}${letter()}/${letter()}`;
}

function fmtDate(d: Date) {
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  return `${day} ${month} ${d.getFullYear()}`;
}

function addDays(d: Date, days: number) {
  return new Date(d.getTime() + days * 86400000);
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

// A `.sort(() => rand() - 0.5)` shuffle calls the comparator an
// engine-dependent number of times, which desyncs the seeded RNG stream
// between the server's V8 and the browser's engine and causes hydration
// mismatches. Fisher-Yates calls rand() exactly arr.length - 1 times,
// deterministic regardless of engine.
function shuffle<T>(arr: T[], rand: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export type TrendPoint = { label: string; rank: number };
export type MatchLoadPoint = { label: string; matches: number; wins: number; goalsFor: number };
export type SeasonRankingRow = { label: string; rank: number; wins: number };
export type StatsRow = {
  rank: number;
  m: number;
  w: number;
  d: number;
  l: number;
  winPct: number;
  gf: number;
  ga: number;
  cs: number;
  motm: number;
  rt: number;
};
export type TransferEntry = {
  club: string;
  date: string;
  fromClub: string | null;
  jersey: number;
};
export type PersonalInfoFallback = {
  deviceName: string;
  deviceModel: string;
  konamiUid: string;
  birthday: string;
  bloodGroup: string;
  country: string;
  division: string;
  district: string;
  education: { instituteName: string; fieldOfStudy: string; instituteType: (typeof INSTITUTE_TYPES)[number] }[];
};

export type PlayerInsights = {
  totalMatches: number;
  totalWins: number;
  winRate: number;
  goalsFor: number;
  snapshot: {
    debut: string;
    lastPlayed: string;
    avgGapLabel: string;
    maxGapLabel: string;
    unbeatenStreak: { matches: number; from: string; to: string };
    highestGoals: { goals: number; conceded: number; opponent: string; date: string };
  };
  topOpponents: {
    mostPlayed: { name: string; matches: number };
    mostWins: { name: string; wins: number };
  };
  monthlyTrend: TrendPoint[];
  weeklyTrend: TrendPoint[];
  monthlyMatchLoad: MatchLoadPoint[];
  seasonRankings: SeasonRankingRow[];
  statsAllTime: StatsRow;
  statsSeason2026: StatsRow;
  transferHistory: TransferEntry[];
  personalInfo: PersonalInfoFallback;
};

function buildStatsRow(rand: () => number, scale: number, rankHint: number): StatsRow {
  const m = Math.max(8, Math.round((80 + rand() * 550) * scale));
  const winRate = 0.5 + rand() * 0.35;
  const w = Math.round(m * winRate);
  const remaining = Math.max(0, m - w);
  const d = Math.round(remaining * 0.35);
  const l = Math.max(0, remaining - d);
  const gf = Math.round(w * 3.3 + d * 1.1 + rand() * 40 * scale);
  const ga = Math.round(l * 1.7 + d * 0.7 + rand() * 20 * scale);
  const cs = Math.round(w * (0.2 + rand() * 0.15));
  const motm = Math.round(w * (0.1 + rand() * 0.12));
  const rt = Math.round(3600 + rand() * 1400);
  const winPct = m > 0 ? Math.round((w / m) * 1000) / 10 : 0;
  return { rank: rankHint, m, w, d, l, winPct, gf, ga, cs, motm, rt };
}

export function getPlayerInsights(person: Person): PlayerInsights {
  // Seeded from the player's id alone (not mutable fields like points) so
  // the generated insights are guaranteed identical between the server
  // render and the client hydration, regardless of any store drift.
  const rand = mulberry32(seedFromId(person.id, 424242));

  // --- Snapshot ---
  const debutDaysAgo = Math.round(400 + rand() * 520);
  const debut = addDays(REFERENCE_NOW, -debutDaysAgo);
  const lastPlayed = addDays(REFERENCE_NOW, -Math.round(rand() * 6));
  const avgGapDays = Math.round((1 + rand() * 3) * 10) / 10;
  const maxGapWeeks = Math.round((0.8 + rand() * 1.6) * 10) / 10;

  const streakMatches = Math.round(15 + rand() * 55);
  const streakEndDaysAgo = Math.round(5 + rand() * 20);
  const streakTo = addDays(REFERENCE_NOW, -streakEndDaysAgo);
  const streakFrom = addDays(streakTo, -Math.round(streakMatches * avgGapDays));

  const highestGoals = 4 + Math.round(rand() * 7);
  const highestConceded = Math.round(rand() * 2);
  const highestGoalsDate = addDays(debut, Math.round(rand() * debutDaysAgo * 0.8));

  // --- Top opponents ---
  const mostPlayedName = pick(OPPONENT_NAMES, rand);
  let mostWinsName = pick(OPPONENT_NAMES, rand);
  if (mostWinsName === mostPlayedName) mostWinsName = pick(OPPONENT_NAMES, rand);
  const mostPlayedMatches = 3 + Math.round(rand() * 5);
  const mostWins = Math.min(mostPlayedMatches, 2 + Math.round(rand() * 4));

  // --- Trends ---
  let walkingRank = 400 + Math.round(rand() * 3200);
  const monthlyTrend: TrendPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(REFERENCE_NOW.getFullYear(), REFERENCE_NOW.getMonth() - i, 1);
    walkingRank = Math.max(1, Math.round(walkingRank - (rand() - 0.35) * walkingRank * 0.18));
    monthlyTrend.push({ label: monthDate.toLocaleString("en-US", { month: "short" }), rank: walkingRank });
  }

  let walkingWeekRank = monthlyTrend[monthlyTrend.length - 1].rank;
  const weeklyTrend: TrendPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    walkingWeekRank = Math.max(1, Math.round(walkingWeekRank + (rand() - 0.5) * walkingWeekRank * 0.12));
    weeklyTrend.push({ label: `W-${i + 1}`, rank: walkingWeekRank });
  }
  weeklyTrend.reverse();
  weeklyTrend.forEach((point, i) => (point.label = `W${i + 1}`));

  // --- Monthly match load ---
  const monthlyMatchLoad: MatchLoadPoint[] = monthlyTrend.map((point) => {
    const matches = Math.round(8 + rand() * 30);
    const wins = Math.round(matches * (0.45 + rand() * 0.4));
    const goalsFor = Math.round(wins * 3 + (matches - wins) * 1.1);
    return { label: point.label, matches, wins, goalsFor };
  });

  // --- Season rankings (Overall + last five seasons) ---
  const seasonLabels = ["Overall", "Season 2027", "Season 2026", "Season 2025", "Season 2024", "Season 2023"];
  const seasonRankWeights = [1, 30, 3, 12, 160, 2200];
  const seasonWinWeights = [1, 0.03, 0.65, 0.28, 0.1, 0];
  const bestWins = Math.round(350 + rand() * 250);
  const seasonRankings: SeasonRankingRow[] = seasonLabels.map((label, i) => ({
    label,
    rank: Math.max(1, Math.round(seasonRankWeights[i] * (0.6 + rand() * 0.8))),
    wins: Math.round(bestWins * seasonWinWeights[i] * (0.7 + rand() * 0.5)),
  }));

  // --- Stats tables ---
  const statsAllTime = buildStatsRow(rand, 1, seasonRankings[0].rank);
  const statsSeason2026 = buildStatsRow(rand, 0.58, seasonRankings[2].rank);

  // --- Transfer history ---
  const transferCount = 6 + Math.round(rand() * 6);
  const transferHistory: TransferEntry[] = [];
  let cursor = addDays(REFERENCE_NOW, -Math.round(rand() * 5));
  let previousClub: string | null = null;
  const shuffledClubs = shuffle(TRANSFER_CLUB_POOL, rand);
  for (let i = 0; i < transferCount; i++) {
    const club = shuffledClubs[i % shuffledClubs.length];
    transferHistory.push({
      club,
      date: fmtDate(cursor),
      fromClub: previousClub,
      jersey: 1 + Math.round(rand() * 69),
    });
    previousClub = club;
    const gapDays = Math.round(30 + rand() * 150);
    cursor = addDays(cursor, -gapDays);
    if (cursor < debut) cursor = debut;
  }

  // --- Personal info fallback (used when the player hasn't filled these in) ---
  const division = pick([...BD_DIVISIONS], rand);
  const district = pick(BD_DISTRICTS_BY_DIVISION[division as BdDivision], rand);
  const birthdayDate = new Date(2000, Math.floor(rand() * 12), 1 + Math.floor(rand() * 28));
  const educationCount = 1 + Math.round(rand());
  const shuffledInstitutes = shuffle(INSTITUTE_NAMES, rand);
  const education = Array.from({ length: educationCount }, (_, i) => ({
    instituteName: shuffledInstitutes[i % shuffledInstitutes.length],
    fieldOfStudy: pick(FIELDS_OF_STUDY, rand),
    instituteType: pick([...INSTITUTE_TYPES], rand),
  }));

  const personalInfo: PersonalInfoFallback = {
    deviceName: pick(DEVICE_NAMES, rand),
    deviceModel: randomDeviceModel(rand),
    konamiUid: randomKonamiUid(rand),
    birthday: birthdayDate.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
    bloodGroup: pick([...BLOOD_GROUPS], rand),
    country: "Bangladesh",
    division,
    district,
    education,
  };

  return {
    totalMatches: statsAllTime.m,
    totalWins: statsAllTime.w,
    winRate: statsAllTime.winPct,
    goalsFor: statsAllTime.gf,
    snapshot: {
      debut: fmtDate(debut),
      lastPlayed: fmtDate(lastPlayed),
      avgGapLabel: `${avgGapDays} days`,
      maxGapLabel: `${maxGapWeeks} weeks`,
      unbeatenStreak: {
        matches: streakMatches,
        from: fmtDate(streakFrom),
        to: fmtDate(streakTo),
      },
      highestGoals: {
        goals: highestGoals,
        conceded: highestConceded,
        opponent: mostPlayedName,
        date: fmtDate(highestGoalsDate),
      },
    },
    topOpponents: {
      mostPlayed: { name: mostPlayedName, matches: mostPlayedMatches },
      mostWins: { name: mostWinsName, wins: mostWins },
    },
    monthlyTrend,
    weeklyTrend,
    monthlyMatchLoad,
    seasonRankings,
    statsAllTime,
    statsSeason2026,
    transferHistory,
    personalInfo,
  };
}
