import { api } from "./axios";
import type { Paged } from "./admin";

export type ReportTarget = "user" | "club" | "community" | "tournament" | "match";
export type ReportReason = "cheating" | "fake_result" | "abuse" | "fake_account" | "inappropriate_content" | "payment_issue" | "other";
export const REPORT_REASONS: ReportReason[] = ["cheating", "fake_result", "abuse", "fake_account", "inappropriate_content", "payment_issue", "other"];
export type ReportStatus = "open" | "in_review" | "action_taken" | "rejected" | "withdrawn";
export type ReportedAs = "self" | "club" | "community";
export type ReportAction = "none" | "warn" | "suspend" | "ban" | "bin";
export const MAX_REPORT_IMAGES = 3;

/** Where a reported thing lives in the app (matches have no page of their own). */
export function reportTargetHref(type: ReportTarget, id: string, extra?: { tournamentId?: string }): string | null {
  if (type === "user") return `/dashboard/efootball/players/${id}`;
  if (type === "club") return `/dashboard/efootball/clubs/${id}`;
  if (type === "community") return `/dashboard/efootball/community/${id}`;
  if (type === "tournament") return `/dashboard/efootball/tournaments/${id}`;
  if (type === "match" && extra?.tournamentId) return `/dashboard/efootball/tournaments/${extra.tournamentId}`;
  return null;
}

export interface MyReport {
  id: string;
  targetType: ReportTarget;
  targetId: string;
  targetName: string;
  reason: ReportReason;
  details: string;
  attachments: string[];
  reportedAs: ReportedAs;
  status: ReportStatus;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface ReportThreadMessage {
  id: string;
  fromStaff: boolean;
  authorName: string;
  body: string;
  createdAt: string;
  internal?: boolean;
  authorId?: string | null;
}

export interface MyReportDetail extends MyReport {
  messages: ReportThreadMessage[];
}

export interface CreateReportInput {
  targetType: ReportTarget;
  targetId: string;
  reason: ReportReason;
  details: string;
  reportedAs?: ReportedAs;
  images: File[];
}

export async function createReport(input: CreateReportInput): Promise<MyReport> {
  const form = new FormData();
  form.append("targetType", input.targetType);
  form.append("targetId", input.targetId);
  form.append("reason", input.reason);
  form.append("details", input.details);
  if (input.reportedAs) form.append("reportedAs", input.reportedAs);
  input.images.forEach((file) => form.append("images", file));
  const res = await api.post<MyReport>("/reports", form, { headers: { "Content-Type": "multipart/form-data" }, timeout: 0 });
  return res.data;
}

export async function getMyReports(params: { page?: number; limit?: number }): Promise<Paged<MyReport>> {
  return (await api.get("/reports/mine", { params })).data;
}

export async function getMyReport(id: string): Promise<MyReportDetail> {
  return (await api.get(`/reports/${id}`)).data;
}

export async function replyToReport(id: string, body: string): Promise<MyReportDetail> {
  return (await api.post(`/reports/${id}/messages`, { body })).data;
}

export async function withdrawReport(id: string): Promise<MyReportDetail> {
  return (await api.post(`/reports/${id}/withdraw`)).data;
}

// ------------------------------------------------------------- staff side

export interface AdminReportRow {
  id: string;
  targetType: ReportTarget;
  targetId: string;
  targetName: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  reportedAs: ReportedAs;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  attachmentCount: number;
  reporterId: string;
  reporterName: string;
  reporterDpUrl: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  reporterClubName: string | null;
  reporterCommunityName: string | null;
  openOnTarget: number;
  priority: number;
}

export interface AdminReportsQuery {
  status?: "active" | "all" | ReportStatus;
  targetType?: ReportTarget;
  reason?: ReportReason;
  assignee?: string;
  reportedAs?: ReportedAs | "leaders";
  targetId?: string;
  clubId?: string;
  communityId?: string;
  from?: string;
  to?: string;
  search?: string;
  sort?: "priority" | "newest" | "oldest";
  page?: number;
  limit?: number;
}

export interface AdminReportDetail extends AdminReportRow {
  attachments: string[];
  reporterClubId: string | null;
  reporterCommunityId: string | null;
  contextClubId: string | null;
  contextCommunityId: string | null;
  resolution: string | null;
  resolutionAction: string | null;
  falseReport: boolean;
  resolvedByName: string | null;
  reporterStrikes: number;
  reporterTotal: number;
  reporterFalse: number;
  messages: ReportThreadMessage[];
  related: Array<{ id: string; reason: ReportReason; status: ReportStatus; createdAt: string; reportedAs: ReportedAs; reporterName: string }>;
  target: Record<string, unknown> | null;
}

export interface ResolveReportInput {
  outcome: "action_taken" | "rejected";
  resolution: string;
  action?: ReportAction;
  actionReason?: string;
  until?: string;
  falseReport?: boolean;
  closeSimilar?: boolean;
}

export async function getAdminReports(query: AdminReportsQuery): Promise<Paged<AdminReportRow>> {
  return (await api.get("/admin/reports", { params: query })).data;
}

export async function getAdminReportCounts(): Promise<{ active: number; unassigned: number; mine: number }> {
  return (await api.get("/admin/reports/counts")).data;
}

export async function getAdminReport(id: string): Promise<AdminReportDetail> {
  return (await api.get(`/admin/reports/${id}`)).data;
}

export async function assignReport(id: string, assigneeId: string | null): Promise<AdminReportDetail> {
  return (await api.post(`/admin/reports/${id}/assign`, { assigneeId })).data;
}

export async function addReportNote(id: string, body: string, internal: boolean): Promise<AdminReportDetail> {
  return (await api.post(`/admin/reports/${id}/notes`, { body, internal })).data;
}

export async function resolveReport(id: string, input: ResolveReportInput): Promise<AdminReportDetail> {
  return (await api.post(`/admin/reports/${id}/resolve`, input)).data;
}

// --------------------------------------------------------- activity feeds

export interface ActivityFeedRow {
  id: string;
  userId: string | null;
  userName: string | null;
  userDpUrl: string | null;
  type: string;
  summary: string;
  targetType: string | null;
  targetId: string | null;
  targetName: string | null;
  meta: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
}

export interface LoginFeedRow {
  id: string;
  userId: string | null;
  userName: string | null;
  email: string;
  success: boolean;
  failureReason: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  accountsOnIp: number;
}

export interface ActivityFeedQuery {
  userId?: string;
  type?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LoginFeedQuery {
  result?: "success" | "failed";
  ip?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getActivityFeed(params: ActivityFeedQuery): Promise<Paged<ActivityFeedRow>> {
  return (await api.get("/admin/activity", { params })).data;
}

export async function getLoginFeed(params: LoginFeedQuery): Promise<Paged<LoginFeedRow>> {
  return (await api.get("/admin/logins", { params })).data;
}
