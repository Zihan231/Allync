import { api } from "./axios";
import type { CoachPost } from "./coaching";

export type SponsorTier = "title" | "gold" | "partner";
export const SPONSOR_TIERS: SponsorTier[] = ["title", "gold", "partner"];
export type SponsorTargetType = "tournament" | "community";
export type SponsorshipStatus = "pending" | "active" | "completed" | "declined" | "cancelled" | "expired" | "ended";
export type SponsorshipParty = "sponsor" | "host";

export interface SponsorProfile {
  userId: string;
  brandName: string;
  tagline: string;
  about: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  website: string | null;
  facebookUrl: string | null;
  industry: string | null;
  verifiedAt: string | null;
}

export interface SponsorBrand {
  id: string;
  name: string;
  brandName: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  website: string | null;
  verified: boolean;
}

export interface SponsorshipTarget {
  type: SponsorTargetType;
  id: string;
  name: string;
  status: string | null;
  startAt: string | null;
  link: string;
  dpUrl: string | null;
}

export interface SponsorshipBid {
  party: SponsorshipParty;
  byUserId: string;
  amountTk: number;
  tier: SponsorTier;
  days: number | null;
  message: string | null;
  at: string;
}

export interface Sponsorship {
  id: string;
  sponsorUserId: string;
  targetType: SponsorTargetType;
  tournamentId: string | null;
  communityId: string | null;
  tier: SponsorTier;
  amountTk: number;
  heldTk: number;
  commissionPct: number;
  commissionTk: number;
  netTk: number;
  days: number | null;
  origin: SponsorshipParty;
  turn: SponsorshipParty;
  bids: SponsorshipBid[];
  message: string | null;
  status: SponsorshipStatus;
  expiresAt: string;
  startedAt: string | null;
  endsAt: string | null;
  endedAt: string | null;
  paidAt: string | null;
  sponsor: SponsorBrand;
  target: SponsorshipTarget;
  /** Set when the viewer is the sponsor (or, on a target's list, its host). */
  mySide: SponsorshipParty | null;
}

/** On public lists, terms stay private. */
export type PublicSponsorship = Omit<Sponsorship, "amountTk" | "heldTk" | "commissionTk" | "commissionPct" | "bids" | "netTk">;

export interface SponsorStats {
  views: number;
  clicks: number;
  perDeal: Array<{ sponsorshipId: string; views: number; clicks: number }>;
  daily: Array<{ day: string; views: number; clicks: number }>;
  posts: { reach: number; likes: number; comments: number; saves: number };
}

export interface SponsorSettings {
  commissionPct: number;
  offerExpiryDays: number;
  minDays: number;
  maxDays: number;
}

export interface MySponsor {
  profile: SponsorProfile | null;
  posts: CoachPost[];
  deals: Sponsorship[];
  spentTk: number;
  stats: SponsorStats;
  settings: SponsorSettings;
}

export interface SponsorCard {
  userId: string;
  name: string;
  brandName: string;
  tagline: string;
  industry: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  verified: boolean;
  sponsorships: number;
}

export interface PublicSponsor {
  user: { id: string; name: string; dpUrl: string | null; coverUrl: string | null; joinedAt: string | null };
  profile: SponsorProfile & { verified: boolean };
  posts: CoachPost[];
  sponsorships: PublicSponsorship[];
}

export interface SponsorCall {
  id: string;
  targetType: SponsorTargetType;
  tournamentId: string | null;
  communityId: string | null;
  tiers: SponsorTier[];
  note: string | null;
  askTk: number | null;
  open: boolean;
  name?: string;
  startAt?: string | null;
  hostName?: string | null;
  link?: string;
}

export interface TargetSponsors {
  target: { type: SponsorTargetType; id: string; name: string };
  sponsors: PublicSponsorship[];
  title: PublicSponsorship | null;
  canManage: boolean;
  pending: Sponsorship[];
  call: SponsorCall | null;
  limits: Record<SponsorTier, number>;
  /** The platform's cut of a sponsorship, in percent. */
  commissionPct: number;
}

type Paged<T> = { data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } };

export interface SponsorProfileInput {
  brandName?: string;
  tagline?: string;
  about?: string;
  website?: string;
  facebookUrl?: string;
  industry?: string;
  logo?: File | null;
  banner?: File | null;
}

const multipart = { headers: { "Content-Type": "multipart/form-data" }, timeout: 0 };

export async function getMySponsor(): Promise<MySponsor> {
  return (await api.get("/sponsors/me")).data;
}

export async function saveSponsorProfile(input: SponsorProfileInput): Promise<SponsorProfile> {
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (value instanceof File) form.append(key, value);
    else if (value !== undefined && value !== null) form.append(key, String(value));
  }
  return (await api.put("/sponsors/me", form, multipart)).data;
}

export async function createSponsorPost(input: { body: string; links: string[]; files: File[] }): Promise<CoachPost> {
  const form = new FormData();
  form.append("body", input.body);
  form.append("links", input.links.join("\n"));
  input.files.forEach((file) => form.append("media", file));
  return (await api.post("/sponsors/me/posts", form, multipart)).data;
}

export async function deleteSponsorPost(id: string) {
  return (await api.delete(`/sponsors/me/posts/${id}`)).data;
}

export async function getSponsors(params: { search?: string; verified?: boolean; page?: number; limit?: number }): Promise<Paged<SponsorCard>> {
  return (await api.get("/sponsors", { params: { ...params, verified: params.verified ? "true" : undefined } })).data;
}

export async function getSponsor(userId: string): Promise<PublicSponsor> {
  return (await api.get(`/sponsors/${userId}`)).data;
}

export interface SponsorshipInput {
  targetType: SponsorTargetType;
  targetId: string;
  sponsorUserId?: string;
  tier: SponsorTier;
  amountTk: number;
  days?: number;
  message?: string;
}

export async function createSponsorship(input: SponsorshipInput): Promise<Sponsorship> {
  return (await api.post("/sponsorships", input)).data;
}

export async function respondSponsorship(id: string, accept: boolean): Promise<Sponsorship> {
  return (await api.post(`/sponsorships/${id}/respond`, { accept })).data;
}

export async function counterSponsorship(id: string, input: { amountTk: number; tier?: SponsorTier; days?: number; message?: string }): Promise<Sponsorship> {
  return (await api.post(`/sponsorships/${id}/counter`, input)).data;
}

export async function cancelSponsorship(id: string): Promise<Sponsorship> {
  return (await api.post(`/sponsorships/${id}/cancel`, {})).data;
}

export async function endSponsorship(id: string): Promise<Sponsorship> {
  return (await api.post(`/sponsorships/${id}/end`, {})).data;
}

export async function getTargetSponsors(type: SponsorTargetType, id: string): Promise<TargetSponsors> {
  return (await api.get(`/sponsorships/target/${type}/${id}`)).data;
}

export async function getSponsorCalls(): Promise<SponsorCall[]> {
  return (await api.get("/sponsorships/calls")).data;
}

export async function openSponsorCall(input: { targetType: SponsorTargetType; targetId: string; tiers: SponsorTier[]; note?: string; askTk?: number }): Promise<SponsorCall> {
  return (await api.post("/sponsorships/calls", input)).data;
}

export async function closeSponsorCall(id: string): Promise<SponsorCall> {
  return (await api.delete(`/sponsorships/calls/${id}`)).data;
}

export async function sendImpressions(items: Array<{ sponsorshipId: string; views?: number; clicks?: number }>) {
  return (await api.post("/sponsorships/impressions", { items })).data;
}

// ------------------------------------------------------------------- staff

export type AdminSponsor = SponsorCard & { deals: Sponsorship[] };

export async function getAdminSponsors(params: { search?: string; page?: number }): Promise<Paged<AdminSponsor>> {
  return (await api.get("/admin/sponsors", { params })).data;
}

export async function verifySponsor(userId: string, verified: boolean) {
  return (await api.post(`/admin/sponsors/${userId}/verify`, { verified })).data;
}
