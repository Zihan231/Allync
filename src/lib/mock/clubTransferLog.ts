import type { Club, Person } from "./types";

// Same deterministic-seeding idiom as clubInsights.ts / playerInsights.ts /
// rankingsData.ts — duplicated locally rather than shared, so this module
// has no coupling to other mock modules' name pools.
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

const SYNTHETIC_FIRST_NAMES = [
  "Arif", "Bappy", "Digonto", "Emon", "Faysal", "Golam", "Hridoy", "Ifty", "Jibon", "Kawsar",
];
const SYNTHETIC_LAST_NAMES = [
  "Khan", "Molla", "Nabi", "Opu", "Provat", "Rakib", "Sohan", "Turjo", "Uddin", "Zaman",
];
const FROM_CLUB_POOL = [
  "Nexus", "Tornado Extreme", "Extreme Hunter", "El Galacticos", "Thunder FC", "Mighty Monarchs",
];
const SQUAD_TEAMS = ["Main", "Academy", "Legend"] as const;

export type ClubTransferLogEntry = {
  id: string;
  type: "transfer" | "unregister";
  date: string;
  playerId: string;
  playerName: string;
  playerDpUrl: string | null;
  team: (typeof SQUAD_TEAMS)[number];
  shirtNumber: number;
  fromClub: string | null;
};

export function getClubTransferLog(club: Club, allPeople: Person[]): ClubTransferLogEntry[] {
  const rand = mulberry32(seedFromId(club.id, 9001));
  const currentMembers = allPeople.filter((p) => p.clubId === club.id);

  const entryCount = 6 + Math.floor(rand() * 5); // 6-10
  const entries: ClubTransferLogEntry[] = [];
  let cursor = addDays(REFERENCE_NOW, -Math.round(rand() * 4));

  for (let i = 0; i < entryCount; i++) {
    const type: ClubTransferLogEntry["type"] = rand() < 0.6 ? "transfer" : "unregister";
    const useRealMember = currentMembers.length > 0 && rand() < 0.5;
    const person = useRealMember ? pick(currentMembers, rand) : null;

    const playerName = person
      ? person.name
      : `${pick(SYNTHETIC_FIRST_NAMES, rand)} ${pick(SYNTHETIC_LAST_NAMES, rand)}`;

    entries.push({
      id: `${club.id}-transfer-${i}`,
      type,
      date: fmtDate(cursor),
      playerId: person?.id ?? `synthetic-${club.id}-${i}`,
      playerName,
      playerDpUrl: person?.dpUrl ?? null,
      team: person?.squadTeam ?? pick(SQUAD_TEAMS, rand),
      shirtNumber: person?.shirtNumber ?? 1 + Math.floor(rand() * 40),
      fromClub: type === "transfer" ? pick(FROM_CLUB_POOL, rand) : null,
    });

    cursor = addDays(cursor, -(1 + Math.round(rand() * 5)));
  }

  return entries;
}
