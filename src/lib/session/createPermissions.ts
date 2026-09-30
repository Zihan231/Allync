import { format, type TranslationDict } from "@/lib/i18n/translations";
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
export function clubCreateBlockReason(user: MockUser, t: TranslationDict): CreateBlock | null {
  const cb = t.dashboard.createBlock;
  if (user.club) {
    return {
      short: format(cb.alreadyInClubShort, { name: user.club.name }),
      full: format(cb.alreadyInClubFull, { name: user.club.name }),
    };
  }
  if (user.community?.role === "President" || user.community?.role === "Vice President") {
    const isPresident = user.community.role === "President";
    return {
      short: isPresident ? cb.communityPresidentsNoClubShort : cb.communityVicePresidentsNoClubShort,
      full: format(cb.communityLeaderNoClubFull, {
        role: isPresident ? t.dashboard.community.presidentLabel : t.dashboard.community.vicePresidentLabel,
        name: user.community.name,
      }),
    };
  }
  return null;
}

/**
 * Why a community leader can't join a club, or null (mirrors ClubsService.join).
 * Being in another club is handled separately on the club page.
 */
export function clubJoinBlockReason(user: MockUser, t: TranslationDict): string | null {
  if (user.community?.role !== "President" && user.community?.role !== "Vice President") return null;
  return format(t.dashboard.createBlock.communityLeaderNoJoinFull, {
    role:
      user.community.role === "President"
        ? t.dashboard.community.presidentLabel
        : t.dashboard.community.vicePresidentLabel,
    name: user.community.name,
  });
}

/** Why this user can't create a community, or null if they can. */
export function communityCreateBlockReason(user: MockUser, t: TranslationDict): CreateBlock | null {
  const cb = t.dashboard.createBlock;
  if (user.club?.role === "President" || user.club?.role === "General Secretary") {
    const isPresident = user.club.role === "President";
    return {
      short: isPresident ? cb.clubPresidentsNoCommunityShort : cb.clubSecretariesNoCommunityShort,
      full: format(cb.clubLeaderNoCommunityFull, {
        role: isPresident ? t.dashboard.club.presidentLabel : t.dashboard.club.generalSecretaryLabel,
        name: user.club.name,
      }),
    };
  }
  if (user.community) {
    return {
      short: format(cb.alreadyInCommunityShort, { name: user.community.name }),
      full: format(cb.alreadyInCommunityFull, { name: user.community.name }),
    };
  }
  return null;
}
