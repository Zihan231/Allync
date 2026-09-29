import type { Club, Community } from "@/lib/mock/types";
import type { BackendClub, BackendCommunity } from "./types";

// The backend serializes joinPolicy/stage/tier as plain strings; the UI models them as literal
// unions. Backend enum values are trusted here rather than re-validated.

export function mapBackendClub(bc: BackendClub): Club {
  return {
    id: bc.id,
    name: bc.name,
    color: bc.color || "#E63946",
    initials: bc.initials || "FC",
    dpUrl: bc.dpUrl ?? null,
    coverUrl: bc.coverUrl ?? null,
    description: bc.description || "",
    points: bc.points ?? 0,
    joinPolicy: (bc.joinPolicy || "instant") as Club["joinPolicy"],
    minRoster: bc.minRoster ?? 4,
    maxRoster: bc.maxRoster ?? 8,
    communityIds: bc.communityIds || [],
    stage: (bc.stage || "Foundation") as Club["stage"],
    location: bc.location ?? undefined,
    motto: bc.motto ?? undefined,
    facebookUrl: bc.facebookUrl ?? undefined,
  };
}

export function mapBackendCommunity(bc: BackendCommunity): Community {
  return {
    id: bc.id,
    name: bc.name,
    dpUrl: bc.dpUrl ?? null,
    coverUrl: bc.coverUrl ?? null,
    rules: bc.rules || "",
    points: bc.points ?? 0,
    joinPolicy: (bc.joinPolicy || "instant") as Community["joinPolicy"],
    memberClubIds: bc.memberClubIds || [],
    memberCount: bc.memberCount ?? 0,
    clubCount: bc.clubCount ?? bc.memberClubIds?.length ?? 0,
    freeAgentCount: bc.freeAgentCount ?? 0,
    tournamentIds: [],
    color: bc.color || "#4c8dff",
    initials: bc.initials || "CM",
    tier: (bc.tier || "New") as Community["tier"],
    creatorId: bc.creatorId ?? null,
    location: bc.location ?? undefined,
    motto: bc.motto ?? undefined,
    facebookUrl: bc.facebookUrl ?? undefined,
  };
}
