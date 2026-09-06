import type { Club, Community, Person } from "./types";
import { getClubFixturesFull, type ClubCalendarEvent, type ClubFixture, type ClubNewsItem } from "./clubInsights";
import { getClubTransferLog, type ClubTransferLogEntry } from "./clubTransferLog";

// Same deterministic-seeding idiom as clubInsights.ts / clubTransferLog.ts —
// duplicated locally rather than shared, so this module has no coupling to
// other mock modules' name pools.
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

const NEWS_TEMPLATES: ((communityName: string, clubName: string) => string)[] = [
  (_communityName, clubName) => `${clubName} climb the standings after a strong run of results.`,
  (communityName, clubName) => `${communityName} confirms ${clubName}'s next fixture date and venue.`,
  (communityName) => `${communityName} reminds all clubs to submit match evidence on time or forfeit.`,
  (communityName, clubName) => `${clubName} completes a fresh signing ahead of ${communityName}'s next round.`,
  (communityName) => `${communityName} opens registration for its next community-wide tournament.`,
  (_communityName, clubName) => `${clubName} named Club of the Week for a commanding run of form.`,
];

export type CommunityFixtureEvent = ClubCalendarEvent & { clubId: string; clubName: string };
export type CommunityNewsItem = ClubNewsItem;
export type CommunityTransferLogEntry = ClubTransferLogEntry & { clubId: string; clubName: string; clubColor: string };

// Aggregates every member club's own fixture generator into one calendar,
// repurposing ClubCalendarEvent.team (widened to a plain string) to carry the
// playing club's name instead of "Main"/"Academy" — so the community calendar
// tooltip reads "Red Falcons: vs El Galacticos" instead of "Main: vs ...".
export function getCommunityCalendarEvents(memberClubs: Club[], peopleByClub: Map<string, Person[]>): CommunityFixtureEvent[] {
  const events: CommunityFixtureEvent[] = [];
  memberClubs.forEach((club) => {
    const members = peopleByClub.get(club.id) ?? [];
    getClubFixturesFull(club, members).forEach((f) => {
      events.push({
        dateIso: f.dateIso,
        isKnockout: f.isKnockout,
        opponentClubName: f.opponentClubName,
        team: club.name,
        clubId: club.id,
        clubName: club.name,
      });
    });
  });
  return events.sort((a, b) => a.dateIso.localeCompare(b.dateIso));
}

// Same ClubFixture shape as a single club's fixture list (so the existing
// ClubUpcomingFixturesSlider can render it unmodified) — the owning club's
// name is folded into the competition line ("Red Falcons · Weekend Cup")
// since ClubFixture itself carries no club-identity field.
export function getCommunityUpcomingFixtures(memberClubs: Club[], peopleByClub: Map<string, Person[]>): ClubFixture[] {
  const fixtures: ClubFixture[] = [];
  memberClubs.forEach((club) => {
    const members = peopleByClub.get(club.id) ?? [];
    getClubFixturesFull(club, members).forEach((f) => {
      fixtures.push({ ...f, id: `${club.id}-${f.id}`, competition: `${club.name} · ${f.competition}` });
    });
  });
  return fixtures.sort((a, b) => a.dateIso.localeCompare(b.dateIso));
}

export function getCommunityNewsFeed(community: Community, memberClubs: Club[]): CommunityNewsItem[] {
  const rand = mulberry32(seedFromId(community.id, 8001));
  const newsCount = 4 + Math.floor(rand() * 3); // 4-6
  const newsFeed: CommunityNewsItem[] = [];
  let cursor = addDays(REFERENCE_NOW, -Math.round(rand() * 3));
  for (let i = 0; i < newsCount; i++) {
    const club = memberClubs.length ? pick(memberClubs, rand) : null;
    const template = pick(NEWS_TEMPLATES, rand);
    newsFeed.push({
      id: `${community.id}-news-${i}`,
      headline: template(community.name, club?.name ?? community.name),
      date: fmtDate(cursor),
    });
    cursor = addDays(cursor, -(1 + Math.round(rand() * 4)));
  }
  return newsFeed;
}

// A "free agent" is simply a person in the community with no club — real
// seeded roster entries (see people.ts), not procedurally generated, so they
// have normal profile links like every other person in the app.
export function getCommunityFreeAgents(community: Community, allPeople: Person[]): Person[] {
  return allPeople.filter((p) => p.communityId === community.id && p.clubId === null && p.communityRole === "Member");
}

// Reuses each member club's own transfer log generator verbatim and just
// tags/merges the results — no new randomness needed here.
export function getCommunityTransferLog(memberClubs: Club[], allPeople: Person[]): CommunityTransferLogEntry[] {
  const entries: CommunityTransferLogEntry[] = [];
  memberClubs.forEach((club) => {
    getClubTransferLog(club, allPeople).forEach((e) => {
      entries.push({ ...e, id: `${club.id}-${e.id}`, clubId: club.id, clubName: club.name, clubColor: club.color });
    });
  });
  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
