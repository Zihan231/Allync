import { api, isApiError } from "./axios";
import type { DesignAssets, StoreItem } from "./store";

/** What a creator can design (titles stay system-granted, so they're not here). */
export const CREATOR_CATEGORIES = ["badge", "frame", "theme", "club_theme", "tournament_banner", "sticker_pack"] as const;
export type CreatorCategory = (typeof CREATOR_CATEGORIES)[number];
/** Step 1 sells player items; clubs, tournaments and stickers follow. */
export const LIVE_CREATOR_CATEGORIES: CreatorCategory[] = ["badge", "frame", "theme"];

export const RARITIES = ["common", "rare", "epic", "legendary", "mythic"] as const;
export type Rarity = (typeof RARITIES)[number];

/** Words a design's name can't use: ranks and titles are given by the system, not bought. Mirrors the server. */
export const RESERVED_NAME_WORDS = [
  "king", "queen", "champion", "champ", "mvp", "legend", "official", "verified", "staff", "admin", "moderator",
  "goat", "winner", "pro", "best", "top", "number one", "#1", "allynq", "allync",
];

/** The reserved word a name uses, if any (whole words only: "Kingfisher" is fine). Same check as the server. */
export function reservedWordIn(name: string): string | null {
  const lower = ` ${name.toLowerCase().replace(/[^a-z0-9#]+/g, " ")} `;
  return RESERVED_NAME_WORDS.find((word) => lower.includes(` ${word} `)) ?? null;
}

export type DesignStatus = "pending" | "approved" | "rejected";

/** A creator's design as they see it (all statuses, with review notes and revenue). */
export interface CreatorDesign extends StoreItem {
  category: StoreItem["category"];
  reviewStatus: DesignStatus;
  pendingAssets: DesignAssets | null;
  rejectReason: string | null;
  reviewedAt: string | null;
  salesCount: number;
  revenueTk: number;
  createdAt: string;
  updatedAt: string;
}

export interface MyCreator {
  designs: CreatorDesign[];
  stats: { earnedTk: number; sales: number; live: number; inReview: number };
  /** The platform's cut of each sale, in percent. */
  commissionPct: number;
}

export interface PublicCreator {
  user: { id: string; name: string; dpUrl: string | null; coverUrl: string | null; joinedAt: string };
  designs: StoreItem[];
  sales: number;
}

export interface DesignInput {
  category?: CreatorCategory;
  name?: string;
  description?: string;
  priceTk?: number;
  rarity?: Rarity;
  primaryColor?: string;
  secondaryColor?: string;
  active?: boolean;
}

export interface DesignFiles {
  image?: File | null;
  frame?: File | null;
  banner?: File | null;
  stickers?: File[];
}

function designForm(input: DesignInput, files: DesignFiles): FormData {
  const form = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") form.append(key, String(value));
  });
  if (files.image) form.append("image", files.image);
  if (files.frame) form.append("frame", files.frame);
  if (files.banner) form.append("banner", files.banner);
  files.stickers?.forEach((file) => form.append("stickers", file));
  return form;
}

const multipart = { headers: { "Content-Type": "multipart/form-data" }, timeout: 0 };

export async function getMyCreator(): Promise<MyCreator> {
  return (await api.get("/creators/me")).data;
}

export async function createDesign(input: DesignInput, files: DesignFiles): Promise<CreatorDesign> {
  return (await api.post("/creators/designs", designForm(input, files), multipart)).data;
}

export async function updateDesign(id: string, input: DesignInput, files: DesignFiles = {}): Promise<CreatorDesign> {
  return (await api.patch(`/creators/designs/${id}`, designForm(input, files), multipart)).data;
}

export async function deleteDesign(id: string): Promise<{ deleted?: boolean; delisted?: boolean }> {
  return (await api.delete(`/creators/designs/${id}`)).data;
}

export async function getCreator(userId: string): Promise<PublicCreator> {
  return (await api.get(`/creators/${userId}`)).data;
}

// ------------------------------------------------------------------- staff

export type AdminDesign = CreatorDesign & { creator: { id: string; name: string } | null };
export type AdminDesigns = {
  data: AdminDesign[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  counts: Record<DesignStatus, number>;
};

export async function getAdminDesigns(params: { status: DesignStatus; page?: number; limit?: number }): Promise<AdminDesigns> {
  return (await api.get("/admin/creators/designs", { params })).data;
}

export async function reviewDesign(
  id: string,
  input: { approve: boolean; reason?: string; priceTk?: number; rarity?: Rarity },
): Promise<CreatorDesign> {
  return (await api.post(`/admin/creators/designs/${id}/review`, input)).data;
}

/** The server's message for a failed request (validation messages joined). */
export function apiMessage(err: unknown, fallback: string): string {
  if (isApiError(err)) return err.message || fallback;
  const data = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data;
  return (Array.isArray(data?.message) ? data.message.join(", ") : data?.message) || fallback;
}
