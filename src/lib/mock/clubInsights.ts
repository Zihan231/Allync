import type { Club, Person } from "./types";

// Deterministic seeded RNG so a club's generated insights stay stable across
// renders/reloads instead of reshuffling on every visit. Mirrors the same
// mulberry32 implementation used in playerInsights.ts and rankingsData.ts —
// duplicated locally (rather than imported) so this module has no coupling
// to the player-insights name pools.
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

// The rest of the mock dataset is dated around this point in-universe.
const REFERENCE_NOW = new Date("2026-09-01T00:00:00+06:00");

function addDays(d: Date, days: number) {
  return new Date(d.getTime() + days * 86400000);
}

// Deliberately uses the same local-timezone getters as fmtDate (not
// toISOString, which is UTC-based) so a fixture's calendar key and its
// display label always agree, regardless of the runtime's timezone.
function toIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDate(d: Date) {
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  return `${day} ${month} ${d.getFullYear()}`;
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

const OPPONENT_CLUB_POOL = [
  "Nexus",
  "Tornado Extreme",
  "Extreme Hunter",
  "El Galacticos",
  "Narayanganj Pes Club",
  "Munshiganj Rule Breakers",
  "Hala Madrid",
  "Thunder FC",
  "Mighty Monarchs",
  "Bangladesh Fighting Cardinals",
  "Raging Leopards BD",
  "Aether Athletic",
];

const COMPETITION_POOL = [
  "Dhaka Elite Community League",
  "Weekend Cup",
  "Quarter-Final Clash",
  "Friendly Match",
  "Community Knockout",
];

const NEWS_TEMPLATES: ((clubName: string, opponent: string, playerName: string) => string)[] = [
  (clubName, opponent) => `${clubName} edge past ${opponent} in a tense five-goal thriller.`,
  (clubName, _opponent, playerName) => `${playerName} nets a hat-trick as ${clubName} cruise to victory.`,
  (clubName) => `${clubName} climb the community standings after a strong run of form.`,
  (clubName, opponent) => `Preview: ${clubName} host ${opponent} in a must-win fixture.`,
  (_clubName, _opponent, playerName) => `${playerName} named Player of the Match for a commanding display.`,
];

export type ClubFixture = {
  id: string;
  opponentClubName: string;
  competition: string;
  dateIso: string;
  dateLabel: string;
  isKnockout: boolean;
};

export type ClubCalendarEvent = { dateIso: string; isKnockout: boolean };

export type ClubNewsItem = { id: string; headline: string; date: string };

export type ClubInsights = {
  upcomingFixtures: ClubFixture[];
  calendarEvents: ClubCalendarEvent[];
  newsFeed: ClubNewsItem[];
  contractDaysById: Map<string, number>;
};

export function getClubInsights(club: Club, members: Person[]): ClubInsights {
  const rand = mulberry32(seedFromId(club.id, 7001));

  const fixtureCount = 4 + Math.floor(rand() * 3); // 4-6
  const upcomingFixtures: ClubFixture[] = [];
  let cursor = addDays(REFERENCE_NOW, 1 + Math.round(rand() * 2));
  for (let i = 0; i < fixtureCount; i++) {
    const isKnockout = rand() < 0.25;
    upcomingFixtures.push({
      id: `${club.id}-fixture-${i}`,
      opponentClubName: pick(OPPONENT_CLUB_POOL, rand),
      competition: pick(COMPETITION_POOL, rand),
      dateIso: toIso(cursor),
      dateLabel: fmtDate(cursor),
      isKnockout,
    });
    cursor = addDays(cursor, 2 + Math.round(rand() * 5));
  }

  const calendarEvents: ClubCalendarEvent[] = upcomingFixtures.map((f) => ({
    dateIso: f.dateIso,
    isKnockout: f.isKnockout,
  }));

  const newsCount = 3 + Math.floor(rand() * 3); // 3-5
  const newsFeed: ClubNewsItem[] = [];
  let newsCursor = addDays(REFERENCE_NOW, -Math.round(rand() * 3));
  for (let i = 0; i < newsCount; i++) {
    const template = pick(NEWS_TEMPLATES, rand);
    const playerName = members.length ? pick(members, rand).name : club.name;
    newsFeed.push({
      id: `${club.id}-news-${i}`,
      headline: template(club.name, pick(OPPONENT_CLUB_POOL, rand), playerName),
      date: fmtDate(newsCursor),
    });
    newsCursor = addDays(newsCursor, -(1 + Math.round(rand() * 4)));
  }

  const contractDaysById = new Map<string, number>();
  members.forEach((m) => {
    const personRand = mulberry32(seedFromId(m.id, 7002));
    contractDaysById.set(m.id, 1 + Math.floor(personRand() * 180));
  });

  return { upcomingFixtures, calendarEvents, newsFeed, contractDaysById };
}
