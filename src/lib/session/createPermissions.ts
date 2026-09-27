import type { MockUser } from "./SessionContext";

// UI mirror of the backend rules in ClubsService.create / CommunitiesService.create.
// The backend stays authoritative; these only explain why the create button is locked.

export type CreateBlock = {
  /** A few words shown next to the locked button. */
  short: string;
  /** Full explanation for tooltips and the create page. */
  full: string;
};

/** Why this user can't create a club, or null if they can. */
export function clubCreateBlockReason(user: MockUser): CreateBlock | null {
  if (user.club) {
    return {
      short: `You're already in ${user.club.name}`,
      full: `You are already in ${user.club.name}. Leave your club to create a new one.`,
    };
  }
  if (user.community?.role === "President" || user.community?.role === "Vice President") {
    return {
      short: `Community ${user.community.role}s can't create clubs`,
      full: `As ${user.community.role} of ${user.community.name}, you can't create a club. Hand over your community role first.`,
    };
  }
  return null;
}

/** Why this user can't create a community, or null if they can. */
export function communityCreateBlockReason(user: MockUser): CreateBlock | null {
  if (user.club?.role === "President" || user.club?.role === "General Secretary") {
    return {
      short: `Club ${user.club.role === "President" ? "Presidents" : "General Secretaries"} can't create communities`,
      full: `As ${user.club.role} of ${user.club.name}, you can't create a community. Hand over your club role first.`,
    };
  }
  if (user.community) {
    return {
      short: `You're already in ${user.community.name}`,
      full: `You are already a member of ${user.community.name}. Leave it to create a new community.`,
    };
  }
  return null;
}
