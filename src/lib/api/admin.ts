import { api } from "./axios";

export type SystemRole = "moderator" | "admin" | "super_admin";
export const SYSTEM_ROLE_RANK: Record<SystemRole, number> = { moderator: 1, admin: 2, super_admin: 3 };

/** True when `role` is at least `min` (moderator < admin < super admin). */
export function hasRole(role: SystemRole | null | undefined, min: SystemRole): boolean {
  return Boolean(role && SYSTEM_ROLE_RANK[role] >= SYSTEM_ROLE_RANK[min]);
}

export type VerificationStatus = "none" | "pending" | "approved" | "rejected";
export type UserStatus = "active" | "suspended" | "banned" | "deleted" | "warned";
export type UserSort = "newest" | "oldest" | "name" | "last_login" | "warnings";
export type BinType = "user" | "club" | "community" | "tournament";
export type ContentType = Exclude<BinType, "user">;
export type GroupBy = "day" | "week" | "month";
export type BulkAction = "warn" | "suspend" | "unsuspend" | "ban" | "unban" | "force_logout" | "bin" | "notify";

export interface Paged<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ------------------------------------------------------------------ dashboard

export interface DashboardFilters {
  from?: string;
  to?: string;
  country?: string;
  division?: string;
  communityId?: string;
  clubId?: string;
  tournamentType?: "pvp" | "cvc" | "club";
  groupBy?: GroupBy;
  compare?: boolean;
}

export interface PeriodFigures {
  newUsers: number;
  activeUsers: number;
  newClubs: number;
  tournamentsCreated: number;
  tournamentsCompleted: number;
  matchesPlayed: number;
  transfers: number;
  transferVolumeTk: number;
  verificationsReviewed: number;
  staffActions: number;
}

export interface SeriesPoint {
  date: string;
  signups: number;
  activeUsers: number;
  matches: number;
  tournaments: number;
  transfers: number;
  transferTk: number;
}

export interface LabelValue {
  id?: string;
  label: string;
  value: number;
}

export interface AdminDashboard {
  range: { from: string; to: string; groupBy: GroupBy };
  previousRange: { from: string; to: string } | null;
  totals: {
    users: number;
    verifiedUsers: number;
    suspendedUsers: number;
    bannedUsers: number;
    staff: number;
    clubs: number;
    communities: number;
    liveTournaments: number;
    upcomingTournaments: number;
    openDisputes: number;
    walletBalanceTk: number;
    walletHeldTk: number;
    openOffers: number;
  };
  period: PeriodFigures;
  previous: PeriodFigures | null;
  series: SeriesPoint[];
  breakdowns: {
    usersByCountry: LabelValue[];
    usersByDivision: LabelValue[];
    tournamentsByStatus: LabelValue[];
    topClubsByMatches: LabelValue[];
  };
  attention: {
    pendingVerifications: number;
    openDisputes: number;
    staleDisputes: number;
    binExpiringSoon: number;
    suspensionsEndingToday: number;
    suspiciousIps: number;
    sharedIps: number;
    oldestDisputes: Array<{
      id: string;
      roundName: string;
      updatedAt: string;
      tournamentId: string;
      tournamentName: string;
      communityId: string | null;
      hostClubId: string | null;
    }>;
  };
}

export async function getAdminDashboard(filters: DashboardFilters): Promise<AdminDashboard> {
  return (await api.get("/admin/dashboard", { params: filters })).data;
}

// ---------------------------------------------------------------------- users

export interface AdminUsersQuery {
  search?: string;
  country?: string;
  division?: string;
  status?: UserStatus;
  verificationStatus?: VerificationStatus;
  verificationLevel?: number;
  systemRole?: "none" | "staff" | SystemRole;
  clubId?: string;
  communityId?: string;
  joinedFrom?: string;
  joinedTo?: string;
  sort?: UserSort;
  page?: number;
  limit?: number;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  country: string | null;
  division: string | null;
  district: string | null;
  dpUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  verificationLevel: string | number;
  verificationStatus: VerificationStatus;
  systemRole: SystemRole | null;
  suspendedUntil: string | null;
  bannedAt: string | null;
  warningsCount: number;
  deletedAt: string | null;
  clubId: string | null;
  clubName: string | null;
  clubRole: string | null;
  communityId: string | null;
  communityName: string | null;
  communityRole: string | null;
}

export interface AdminUserDetail extends AdminUserRow {
  bio: string | null;
  coverUrl: string | null;
  inGameId: string | null;
  birthday: string | null;
  updatedAt: string;
  documentType: string | null;
  hasDocument: boolean;
  verificationNote: string | null;
  verificationReviewedAt: string | null;
  verificationReviewedBy: string | null;
  suspendReason: string | null;
  banReason: string | null;
  points: number | null;
  konamiUid: string | null;
  walletTk: number | null;
  walletHeldTk: number | null;
  contractNo: string | null;
  lockEndsAt: string | null;
  stats: { transfers: number; logins: number; failedLogins7d: number };
  logins: Array<{ id: string; success: boolean; failureReason: string | null; ip: string | null; userAgent: string | null; createdAt: string }>;
  activity: ActivityRow[];
  audit: Array<{
    id: string;
    actorName: string;
    actorRole: string;
    action: string;
    reason: string | null;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    createdAt: string;
  }>;
  sharedIp: Array<{ id: string; name: string; ip: string }>;
}

export interface ActivityRow {
  id: string;
  type: string;
  summary: string;
  targetType: string | null;
  targetId: string | null;
  meta?: Record<string, unknown> | null;
  ip?: string | null;
  createdAt: string;
}

export async function getAdminUsers(query: AdminUsersQuery): Promise<Paged<AdminUserRow>> {
  return (await api.get("/admin/users", { params: query })).data;
}

export async function getAdminUser(id: string): Promise<AdminUserDetail> {
  return (await api.get(`/admin/users/${id}`)).data;
}

export async function getAdminUserActivity(id: string, params: { type?: string; page?: number; limit?: number }): Promise<Paged<ActivityRow>> {
  return (await api.get(`/admin/users/${id}/activity`, { params })).data;
}

export async function getUserDocument(id: string): Promise<{ documentType: string | null; documentDataUrl: string | null }> {
  return (await api.get(`/admin/users/${id}/document`)).data;
}

/** One moderation action on a user. */
export type UserAction =
  | { kind: "warn"; reason: string }
  | { kind: "suspend"; reason: string; until: string }
  | { kind: "unsuspend"; reason?: string }
  | { kind: "ban"; reason: string }
  | { kind: "unban"; reason?: string }
  | { kind: "force-logout" }
  | { kind: "reset-password"; password: string }
  | { kind: "role"; role: SystemRole | "none"; reason?: string }
  | { kind: "bin"; reason: string }
  | { kind: "edit"; fields: Record<string, string>; reason?: string };

export async function runUserAction(id: string, action: UserAction): Promise<unknown> {
  if (action.kind === "edit") return (await api.patch(`/admin/users/${id}`, { ...action.fields, reason: action.reason })).data;
  const { kind, ...body } = action;
  return (await api.post(`/admin/users/${id}/${kind}`, body)).data;
}

export async function bulkUserAction(body: {
  userIds: string[];
  action: BulkAction;
  reason?: string;
  until?: string;
  message?: string;
}): Promise<{ done: number; failed: Array<{ id: string; error: string }> }> {
  return (await api.post("/admin/users/bulk", body)).data;
}

// --------------------------------------------------------------- verification

export interface VerificationRow {
  id: string;
  name: string;
  email: string | null;
  dpUrl: string | null;
  country: string | null;
  documentType: string | null;
  verificationLevel: string | number;
  verificationStatus: VerificationStatus;
  verificationNote: string | null;
  verificationReviewedAt: string | null;
  reviewedBy: string | null;
  updatedAt: string;
  createdAt: string;
}

export async function getVerifications(params: { status?: VerificationStatus; search?: string; page?: number; limit?: number }): Promise<Paged<VerificationRow>> {
  return (await api.get("/admin/verifications", { params })).data;
}

export async function reviewVerification(id: string, body: { approve: boolean; level?: number; note?: string }): Promise<unknown> {
  return (await api.post(`/admin/verifications/${id}`, body)).data;
}

// ------------------------------------------------- content and recycle bin

export interface ContentRow {
  id: string;
  name: string;
  dpUrl?: string | null;
  createdAt: string;
  members?: number;
  clubs?: number;
  participants?: number;
  leader?: string | null;
  host?: string | null;
  status?: string;
  type?: string;
  startAt?: string;
  points?: number;
}

export async function getContent(type: ContentType, params: { search?: string; page?: number; limit?: number }): Promise<Paged<ContentRow>> {
  return (await api.get(`/admin/content/${type}`, { params })).data;
}

export async function binContent(type: ContentType, id: string, reason: string): Promise<unknown> {
  return (await api.post(`/admin/content/${type}/${id}/bin`, { reason })).data;
}

export interface BinRow {
  id: string;
  entityType: BinType;
  entityId: string;
  name: string;
  reason: string | null;
  deletedAt: string;
  purgeAfter: string;
  deletedById: string | null;
  deletedByName: string | null;
  memberCount: number;
}

export async function getBin(params: { type?: BinType; search?: string; page?: number; limit?: number }): Promise<Paged<BinRow>> {
  return (await api.get("/admin/bin", { params })).data;
}

export async function restoreFromBin(type: BinType, id: string): Promise<{ id: string; reattached: number; skipped: number }> {
  return (await api.post(`/admin/bin/${type}/${id}/restore`)).data;
}

export async function purgeFromBin(type: BinType, id: string): Promise<unknown> {
  return (await api.delete(`/admin/bin/${type}/${id}`)).data;
}

// ----------------------------------------------------------------- audit log

export interface AuditRow {
  id: string;
  actorId: string | null;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string | null;
  targetName: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string | null;
  ip: string | null;
  createdAt: string;
}

export interface AuditQuery {
  action?: string;
  targetType?: string;
  targetId?: string;
  actorId?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getAuditLog(params: AuditQuery): Promise<Paged<AuditRow>> {
  return (await api.get("/admin/audit", { params })).data;
}
