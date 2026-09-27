import type { MockUser } from "./SessionContext";

// UI mirror of the backend rules in ClubsService.create / CommunitiesService.create.
// The backend stays authoritative; these only explain why the create button is locked.

/** Why this user can't create a club, or null if they can. */
export function clubCreateBlockReason(user: MockUser): string | null {
  if (user.club) {
    return `You are already in ${user.club.name}. Leave your club to create a new one.`;
  }
  if (user.community?.role === "President" || user.community?.role === "Vice President") {
    return `As ${user.community.role} of ${user.community.name}, you can't create a club. Hand over your community role first.`;
  }
  return null;
}

/** Why this user can't create a community, or null if they can. */
export function communityCreateBlockReason(user: MockUser): string | null {
  if (user.club?.role === "President" || user.club?.role === "General Secretary") {
    return `As ${user.club.role} of ${user.club.name}, you can't create a community. Hand over your club role first.`;
  }
  if (user.community) {
    return `You are already a member of ${user.community.name}. Leave it to create a new community.`;
  }
  return null;
}
