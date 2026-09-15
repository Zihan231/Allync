"use client";

import { apiFetch } from "@/lib/api/client";

import { useSyncExternalStore } from "react";
import type { Club, Community, JoinRequest, Person } from "./types";
import type { CosmeticCategory } from "./cosmetics";
import { mockClubs } from "./clubs";
import { mockCommunities } from "./communities";
import { mockPeople } from "./people";

// Same hand-rolled useSyncExternalStore pattern as ./store.ts — module-level
// mutable arrays + a listener Set + emitChange(). Every hook below passes a
// getServerSnapshot (the static seed) since omitting it crashes SSR.

let people: Person[] = [...mockPeople];
let clubs: Club[] = [...mockClubs];
let communities: Community[] = [...mockCommunities];
let joinRequests: JoinRequest[] = [];
const EMPTY_REQUESTS: JoinRequest[] = [];

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useMockPeople() {
  return useSyncExternalStore(subscribe, () => people, () => mockPeople);
}
export function useMockClubs() {
  return useSyncExternalStore(subscribe, () => clubs, () => mockClubs);
}
export function useMockCommunities() {
  return useSyncExternalStore(subscribe, () => communities, () => mockCommunities);
}
export function useMockJoinRequests() {
  return useSyncExternalStore(subscribe, () => joinRequests, () => EMPTY_REQUESTS);
}

// Plain (non-hook) accessors — safe to call from event handlers, session
// setup, etc. Always read the live mutable arrays.

let hasSynced = false;
let syncPromise: Promise<void> | null = null;

export function hasSyncedFromBackend() {
  return hasSynced;
}

export async function syncFromBackend(force = false): Promise<void> {
  if (typeof window === "undefined") return;
  if (hasSynced && !force) return;
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    try {
    const [backendClubs, backendUsers] = await Promise.all([
      apiFetch<any[]>("/clubs").catch(() => null),
      apiFetch<any[]>("/users").catch(() => null),
    ]);

    if (backendClubs && Array.isArray(backendClubs) && backendClubs.length > 0) {
      const mappedClubs: Club[] = backendClubs.map((bc) => ({
        id: bc.id,
        name: bc.name,
        color: bc.color || "#E63946",
        initials: bc.initials || "FC",
        dpUrl: bc.dpUrl ?? null,
        coverUrl: bc.coverUrl ?? null,
        description: bc.description || "",
        points: bc.points ?? 0,
        joinPolicy: bc.joinPolicy || "instant",
        minRoster: bc.minRoster ?? 4,
        maxRoster: bc.maxRoster ?? 8,
        communityIds: bc.communityIds || [],
        stage: bc.stage || "Foundation",
        location: bc.location ?? undefined,
        motto: bc.motto ?? undefined,
        facebookUrl: bc.facebookUrl ?? undefined,
      }));

      const backendNames = new Set(mappedClubs.map((c) => c.name.toLowerCase()));
      const remainingMocks = mockClubs.filter((c) => !backendNames.has(c.name.toLowerCase()));
      clubs = [...mappedClubs, ...remainingMocks];
    }

    if (backendUsers && Array.isArray(backendUsers) && backendUsers.length > 0) {
      const mappedPeople: Person[] = backendUsers.map((bu) => {
        const ep = bu.efootballProfile;
        return {
          id: bu.id,
          name: bu.name,
          dpUrl: bu.dpUrl ?? null,
          coverUrl: bu.coverUrl ?? null,
          clubId: ep?.clubId ?? null,
          clubRole: ep?.clubRole ?? null,
          communityId: ep?.communityId ?? null,
          communityRole: ep?.communityRole ?? null,
          points: ep?.points ?? 0,
          lineupStatus: ep?.lineupStatus ?? undefined,
          gamePosition: ep?.gamePosition ?? undefined,
          shirtNumber: ep?.shirtNumber ?? undefined,
          squadTeam: (ep?.squadTeam as any) ?? undefined,
          bio: bu.bio ?? undefined,
          inGameId: bu.inGameId ?? undefined,
          facebookUrl: bu.facebookUrl ?? undefined,
          phoneNumber: bu.phoneNumber ?? undefined,
          birthday: bu.birthday ?? undefined,
          bloodGroup: bu.bloodGroup ?? undefined,
          country: bu.country ?? undefined,
          division: bu.division ?? undefined,
          district: bu.district ?? undefined,
          permanentAddress: bu.permanentAddress ?? undefined,
          currentLocation: bu.currentLocation ?? null,
          workExperience: bu.workExperience ?? undefined,
          education: bu.education ?? undefined,
          documentType: bu.documentType ?? undefined,
          documentDataUrl: bu.documentDataUrl ?? undefined,
          verificationLevel: bu.verificationLevel ?? 0,
          ownedCosmeticIds: bu.ownedCosmeticIds ?? undefined,
          equippedBadgeId: bu.equippedBadgeId ?? null,
          equippedTitleId: bu.equippedTitleId ?? null,
          equippedFrameId: bu.equippedFrameId ?? null,
          equippedThemeId: bu.equippedThemeId ?? null,
        };
      });

      const backendNames = new Set(mappedPeople.map((p) => p.name.toLowerCase()));
      const remainingMockPeople = mockPeople.filter((p) => !backendNames.has(p.name.toLowerCase()));
      people = [...mappedPeople, ...remainingMockPeople];
    }

    hasSynced = true;
    emit();
  } catch (err) {
    console.warn("Backend sync skipped:", err);
  } finally {
    syncPromise = null;
  }
  })();

  return syncPromise;
}

if (typeof window !== "undefined") {
  syncFromBackend();
}

export function getPerson(id: string) {
  return people.find((p) => p.id === id);
}
export function getClub(id: string) {
  return clubs.find((c) => c.id === id);
}
export function getCommunity(id: string) {
  return communities.find((c) => c.id === id);
}

export function addPerson(person: Person) {
  people = [...people, person];
  emit();
}

function updatePerson(id: string, patch: Partial<Person>) {
  people = people.map((p) => (p.id === id ? { ...p, ...patch } : p));
  emit();
}

export function updatePersonProfile(id: string, patch: Partial<Person>) {
  updatePerson(id, patch);
}

export function purchaseCosmetic(personId: string, cosmeticId: string) {
  const person = getPerson(personId);
  if (!person) return;
  const owned = person.ownedCosmeticIds ?? [];
  if (owned.includes(cosmeticId)) return;
  updatePerson(personId, { ownedCosmeticIds: [...owned, cosmeticId] });
}

export function equipCosmetic(personId: string, category: CosmeticCategory, cosmeticId: string | null) {
  const field =
    category === "badge" ? "equippedBadgeId" :
    category === "title" ? "equippedTitleId" :
    category === "frame" ? "equippedFrameId" : "equippedThemeId";
  updatePerson(personId, { [field]: cosmeticId } as Partial<Person>);
}

// ---- Clubs ----

export function createClub(
  input: { name: string; description: string; color: string; joinPolicy: Club["joinPolicy"] },
  creatorPersonId: string
): Club {
  const id = `club-${Date.now()}`;
  const initials = input.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const club: Club = {
    id,
    name: input.name,
    color: input.color,
    initials,
    dpUrl: null,
    coverUrl: null,
    description: input.description,
    points: 0,
    joinPolicy: input.joinPolicy,
    minRoster: 4,
    maxRoster: 8,
    communityIds: [],
    stage: "N/A",
  };
  clubs = [...clubs, club];
  updatePerson(creatorPersonId, { clubId: id, clubRole: "President" });
  return club;
}

export function updateClub(clubId: string, patch: Partial<Club>) {
  clubs = clubs.map((c) => (c.id === clubId ? { ...c, ...patch } : c));
  emit();
}

export function joinClub(personId: string, clubId: string) {
  const person = getPerson(personId);
  const club = getClub(clubId);
  if (!person || !club || person.clubId) return; // already in a club — must leave first

  if (club.joinPolicy === "instant") {
    updatePerson(personId, { clubId, clubRole: "Player" });
  } else {
    joinRequests = [
      ...joinRequests,
      {
        id: `request-${Date.now()}`,
        targetType: "club",
        targetId: clubId,
        personId,
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    ];
    emit();
  }
}

export function leaveClub(personId: string) {
  updatePerson(personId, { clubId: null, clubRole: null });
}

export function approveClubRequest(requestId: string) {
  const request = joinRequests.find((r) => r.id === requestId);
  if (!request) return;
  updatePerson(request.personId, { clubId: request.targetId, clubRole: "Player" });
  joinRequests = joinRequests.map((r) => (r.id === requestId ? { ...r, status: "approved" } : r));
  emit();
}

export function rejectClubRequest(requestId: string) {
  joinRequests = joinRequests.map((r) => (r.id === requestId ? { ...r, status: "rejected" } : r));
  emit();
}

// ---- Communities ----

export function createCommunity(
  input: { name: string; rules: string; joinPolicy: Community["joinPolicy"] },
  creatorPersonId: string
): Community {
  const id = `community-${Date.now()}`;
  const initials = input.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const community: Community = {
    id,
    name: input.name,
    dpUrl: null,
    coverUrl: null,
    rules: input.rules,
    points: 0,
    joinPolicy: input.joinPolicy,
    memberClubIds: [],
    freeAgentCount: 0,
    tournamentIds: [],
    color: "#4c8dff",
    initials,
    tier: "New",
  };
  communities = [...communities, community];
  updatePerson(creatorPersonId, { communityId: id, communityRole: "President" });
  return community;
}

export function updateCommunity(communityId: string, patch: Partial<Community>) {
  communities = communities.map((c) => (c.id === communityId ? { ...c, ...patch } : c));
  emit();
}

export function joinCommunity(personId: string, communityId: string) {
  const person = getPerson(personId);
  const community = getCommunity(communityId);
  if (!person || !community || person.communityId) return;

  if (community.joinPolicy === "instant") {
    updatePerson(personId, { communityId, communityRole: "Member" });
  } else {
    joinRequests = [
      ...joinRequests,
      {
        id: `request-${Date.now()}`,
        targetType: "community",
        targetId: communityId,
        personId,
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    ];
    emit();
  }
}

export function leaveCommunity(personId: string) {
  updatePerson(personId, { communityId: null, communityRole: null });
}

export function approveCommunityRequest(requestId: string) {
  const request = joinRequests.find((r) => r.id === requestId);
  if (!request) return;
  updatePerson(request.personId, { communityId: request.targetId, communityRole: "Member" });
  joinRequests = joinRequests.map((r) => (r.id === requestId ? { ...r, status: "approved" } : r));
  emit();
}

export function rejectCommunityRequest(requestId: string) {
  joinRequests = joinRequests.map((r) => (r.id === requestId ? { ...r, status: "rejected" } : r));
  emit();
}
