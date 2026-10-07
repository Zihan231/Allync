import { api } from "./axios";
import type { Paged } from "./admin";
import type { OfferKind, OfferStatus } from "./transfers";

// ---------------------------------------------------------- transfers and wallets

export interface AdminOfferRow {
  id: string;
  kind: OfferKind;
  status: OfferStatus;
  amountTk: number;
  payeeType: "player" | "club";
  paymentRef: string | null;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string;
  playerUserId: string;
  playerName: string;
  playerDpUrl: string | null;
  toClubId: string;
  toClubName: string;
  fromClubId: string | null;
  fromClubName: string | null;
  reversible: boolean;
}

export interface AdminOffersQuery {
  status?: "open" | OfferStatus;
  kind?: OfferKind;
  clubId?: string;
  playerUserId?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export type LedgerKind = "top_up" | "hold" | "refund" | "payout_sent" | "received" | "adjustment" | "reversal";

export interface LedgerRow {
  id: string;
  kind: LedgerKind;
  amountTk: number;
  offerId: string | null;
  counterparty: string | null;
  reference: string | null;
  createdAt: string;
  ownerType: "user" | "club";
  ownerId: string;
  ownerName: string | null;
  balanceTk: number;
  heldTk: number;
}

export interface LedgerQuery {
  ownerType?: "user" | "club";
  ownerId?: string;
  kind?: LedgerKind;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const getAdminOffers = async (q: AdminOffersQuery): Promise<Paged<AdminOfferRow>> => (await api.get("/admin/transfers/offers", { params: q })).data;
export const getLedger = async (q: LedgerQuery): Promise<Paged<LedgerRow> & { totals: { balanceTk: number; heldTk: number; wallets: number } }> =>
  (await api.get("/admin/wallets/ledger", { params: q })).data;
export const getWallet = async (ownerType: "user" | "club", ownerId: string): Promise<{ balanceTk: number | null; heldTk: number | null }> =>
  (await api.get(`/admin/wallets/${ownerType}/${ownerId}`)).data;

export type PlatformAction =
  | { kind: "cancelOffer" | "reverseOffer"; id: string; reason: string }
  | { kind: "endLock"; userId: string; reason: string }
  | { kind: "adjustWallet"; ownerType: "user" | "club"; ownerId: string; amountTk: number; reason: string };

export async function runPlatformAction(a: PlatformAction): Promise<unknown> {
  switch (a.kind) {
    case "cancelOffer":
      return (await api.post(`/admin/transfers/offers/${a.id}/cancel`, { reason: a.reason })).data;
    case "reverseOffer":
      return (await api.post(`/admin/transfers/offers/${a.id}/reverse`, { reason: a.reason })).data;
    case "endLock":
      return (await api.post("/admin/transfers/end-lock", { userId: a.userId, reason: a.reason })).data;
    case "adjustWallet":
      return (await api.post("/admin/wallets/adjust", { ownerType: a.ownerType, ownerId: a.ownerId, amountTk: a.amountTk, reason: a.reason })).data;
  }
}

// ------------------------------------------------------------------ settings

export interface PlatformSettings {
  transfers: { baseFeeTk: number; lockDays: number; offerExpiryDays: number; clubStartingBalanceTk: number; playerStartingBalanceTk: number; demoTopUpTk: number };
  admin: { binRetentionDays: number; moderatorMaxSuspendDays: number; reportDailyLimit: number; reportStrikeLimit: number };
  features: { signupsOpen: boolean; transfersOpen: boolean; reportsOpen: boolean };
  maintenance: { enabled: boolean; message: string };
}
export type SettingsSection = keyof PlatformSettings;

export const getPlatformSettings = async (): Promise<PlatformSettings> => (await api.get("/admin/settings")).data;
export const updatePlatformSettings = async (section: SettingsSection, patch: Record<string, unknown>): Promise<PlatformSettings> =>
  (await api.patch(`/admin/settings/${section}`, patch)).data;

/** What every visitor may know: maintenance and which features are on. No sign-in needed. */
export interface PublicSettings {
  maintenance: { enabled: boolean; message: string };
  features: { signupsOpen: boolean; transfersOpen: boolean; reportsOpen: boolean };
}
export const getPublicSettings = async (): Promise<PublicSettings> => (await api.get("/settings/public")).data;

// ------------------------------------------------------------- announcements

export type AudienceType = "all" | "staff" | "leaders" | "country" | "community" | "club";

export interface AnnouncementInput {
  title: string;
  message: string;
  link?: string;
  audience: AudienceType;
  country?: string;
  targetId?: string;
  scheduledFor?: string;
}

export interface AnnouncementRow {
  id: string;
  title: string;
  message: string;
  link: string | null;
  audienceLabel: string;
  status: "scheduled" | "sent" | "cancelled";
  scheduledFor: string | null;
  sentAt: string | null;
  recipients: number;
  createdAt: string;
  createdByName: string | null;
}

export const getAnnouncements = async (params: { page?: number; limit?: number }): Promise<Paged<AnnouncementRow>> =>
  (await api.get("/admin/announcements", { params })).data;
export const previewAnnouncement = async (input: Pick<AnnouncementInput, "audience" | "country" | "targetId"> & { title: string; message: string }) =>
  (await api.post<{ recipients: number; label: string }>("/admin/announcements/preview", input)).data;
export const createAnnouncement = async (input: AnnouncementInput): Promise<AnnouncementRow> => (await api.post("/admin/announcements", input)).data;
export const cancelAnnouncement = async (id: string): Promise<AnnouncementRow> => (await api.post(`/admin/announcements/${id}/cancel`)).data;

// -------------------------------------------------------------------- health

export interface HealthJob {
  name: string;
  runs: number;
  failures: number;
  lastStartedAt: string | null;
  lastFinishedAt: string | null;
  lastDurationMs: number | null;
  lastError: string | null;
  lastErrorAt: string | null;
  lastResult: string | null;
  lastOk: boolean | null;
}

export interface Health {
  server: { uptimeSeconds: number; node: string; memoryMb: { rss: number; heapUsed: number; heapTotal: number } };
  database: { bytes: number; connections: number; tables: Array<{ name: string; rows: number; bytes: number }> };
  uploads: Array<{ folder: string; bytes: number; files: number }>;
  activity: { notifications24h: number; signIns24h: number; failedSignIns24h: number; actions24h: number };
  maintenance: { enabled: boolean; message: string };
  features: { signupsOpen: boolean; transfersOpen: boolean; reportsOpen: boolean };
  startedAt: string;
  jobs: HealthJob[];
  errors: Array<{ at: string; method: string; path: string; status: number; message: string }>;
  errorCount: number;
}

export const getHealth = async (): Promise<Health> => (await api.get("/admin/health")).data;
