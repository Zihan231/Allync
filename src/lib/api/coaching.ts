import { api } from "./axios";
import type { PaymentMethod } from "./transfers";

/** What a user can be on Allynq (picked at sign-up, changed from the profile). */
export const USER_ROLES = ["player", "organizer", "coach", "creative", "sponsor", "social"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export type CoachProfile = {
  userId: string;
  headline: string;
  bio: string | null;
  youtubeChannelUrl: string | null;
  specialities: string[];
  askingFeeTk: number | null;
  available: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CoachPostStatus = "pending" | "approved" | "rejected";
export type CoachPostMedia = { type: "image" | "video"; url: string };
export type CoachPost = {
  id: string;
  coachUserId: string;
  body: string;
  links: string[];
  media: CoachPostMedia[];
  status: CoachPostStatus;
  rejectReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  coach?: { id: string; name: string; dpUrl: string | null };
};

export type CoachingParty = "coach" | "club";
export type CoachingStatus = "pending" | "scheduled" | "active" | "completed" | "ended" | "declined" | "cancelled" | "expired";
export type CoachingBid = { party: CoachingParty; byUserId: string; feeTk: number; days: number; message: string | null; at: string };
export type PartyRef = { id: string; name: string; dpUrl: string | null };

export type CoachingDeal = {
  id: string;
  status: CoachingStatus;
  origin: CoachingParty;
  turn: CoachingParty;
  feeTk: number;
  heldTk: number;
  days: number;
  commissionPct: number;
  commissionTk: number;
  netTk: number;
  message: string | null;
  bids: CoachingBid[];
  coach: PartyRef;
  club: PartyRef & { color: string | null };
  expiresAt: string;
  createdAt: string;
  startedAt: string | null;
  endsAt: string | null;
  endedAt: string | null;
  endReason: "time" | "coach" | "club" | "staff" | null;
  paymentRef: string | null;
  paidAt: string | null;
};

export type CoachingSettings = { commissionPct: number; minDays: number; maxDays: number; offerExpiryDays: number };

export type MyCoaching = {
  profile: CoachProfile | null;
  posts: CoachPost[];
  deals: CoachingDeal[];
  current: CoachingDeal | null;
  earnedTk: number;
  settings: CoachingSettings;
};

export type CoachCard = {
  userId: string;
  name: string;
  dpUrl: string | null;
  headline: string;
  specialities: string[];
  askingFeeTk: number | null;
  available: boolean;
  youtubeChannelUrl: string | null;
  posts: number;
  currentClub: { id: string; name: string; endsAt: string | null } | null;
};

export type CoachDetail = {
  user: { id: string; name: string; dpUrl: string | null; coverUrl: string | null; roles: string[] };
  profile: CoachProfile;
  posts: CoachPost[];
  currentClub: { id: string; name: string; dpUrl: string | null; endsAt: string | null } | null;
};

export type ClubCoaching = {
  clubId: string;
  isLeader: boolean;
  coach: CoachingDeal | null;
  open: CoachingDeal[];
  settings: CoachingSettings;
};

type Paged<T> = { data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } };

// ------------------------------------------------------------------- roles

export async function setMyRoles(roles: UserRole[], primaryRole: UserRole) {
  return (await api.put("/users/me/roles", { roles, primaryRole })).data;
}

// ------------------------------------------------------------------- coach

export async function getMyCoaching(): Promise<MyCoaching> {
  return (await api.get("/coaching/me")).data;
}

export async function updateCoachProfile(input: Partial<Omit<CoachProfile, "userId" | "createdAt" | "updatedAt">>): Promise<CoachProfile> {
  return (await api.put("/coaching/me/profile", input)).data;
}

export async function createCoachPost(input: { body: string; links: string[]; files: File[] }): Promise<CoachPost> {
  const form = new FormData();
  form.append("body", input.body);
  form.append("links", input.links.join("\n"));
  input.files.forEach((file) => form.append("media", file));
  return (await api.post("/coaching/me/posts", form, { headers: { "Content-Type": "multipart/form-data" }, timeout: 0 })).data;
}

export async function deleteCoachPost(id: string) {
  return (await api.delete(`/coaching/me/posts/${id}`)).data;
}

export async function getCoaches(params: { search?: string; available?: boolean; page?: number; limit?: number }): Promise<Paged<CoachCard>> {
  return (
    await api.get("/coaching/coaches", {
      params: { ...params, available: params.available === undefined ? undefined : String(params.available) },
    })
  ).data;
}

export async function getCoach(userId: string): Promise<CoachDetail> {
  return (await api.get(`/coaching/coaches/${userId}`)).data;
}

export async function getClubCoaching(clubId: string): Promise<ClubCoaching> {
  return (await api.get(`/coaching/clubs/${clubId}`)).data;
}

// ------------------------------------------------------------------- deals

export async function createCoachingDeal(input: {
  clubId: string;
  coachUserId?: string;
  feeTk: number;
  days: number;
  message?: string;
  paymentMethod?: PaymentMethod;
}): Promise<CoachingDeal> {
  return (await api.post("/coaching/deals", input)).data;
}

export async function respondCoachingDeal(id: string, accept: boolean, paymentMethod?: PaymentMethod): Promise<CoachingDeal> {
  return (await api.post(`/coaching/deals/${id}/respond`, { accept, paymentMethod })).data;
}

export async function counterCoachingDeal(
  id: string,
  input: { feeTk: number; days?: number; message?: string; paymentMethod?: PaymentMethod },
): Promise<CoachingDeal> {
  return (await api.post(`/coaching/deals/${id}/counter`, input)).data;
}

export async function cancelCoachingDeal(id: string): Promise<CoachingDeal> {
  return (await api.post(`/coaching/deals/${id}/cancel`, {})).data;
}

export async function endCoachingDeal(id: string): Promise<CoachingDeal> {
  return (await api.post(`/coaching/deals/${id}/end`, {})).data;
}

// ------------------------------------------------------------------- staff

export async function getAdminCoachPosts(params: { status?: CoachPostStatus; page?: number; limit?: number }): Promise<
  Paged<CoachPost> & { counts: Partial<Record<CoachPostStatus, number>> }
> {
  return (await api.get("/admin/coaching/posts", { params })).data;
}

export async function reviewCoachPost(id: string, approve: boolean, reason?: string): Promise<CoachPost> {
  return (await api.post(`/admin/coaching/posts/${id}/review`, { approve, reason })).data;
}

/** YouTube watch / short / embed links → the embed URL; null for other links. */
export function youtubeEmbedUrl(link: string): string | null {
  try {
    const url = new URL(link);
    const host = url.hostname.replace(/^www\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.slice(1);
    else if (host.endsWith("youtube.com")) {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2] ?? null;
    }
    return id && /^[\w-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch {
    return null;
  }
}
