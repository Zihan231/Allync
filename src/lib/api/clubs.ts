import { api } from "./axios";
import type { BackendClub, PaginatedResponse } from "./types";

export interface ClubListQuery {
  page: number;
  limit: number;
  search?: string;
  stage?: string;
  id?: string;
  excludeId?: string;
}

/** One page of lightweight club cards (no members). */
export async function getClubsPage(query: ClubListQuery): Promise<PaginatedResponse<BackendClub>> {
  const res = await api.get<PaginatedResponse<BackendClub>>("/clubs", { params: query });
  return res.data;
}

export async function getClubs(): Promise<BackendClub[]> {
  const res = await api.get<BackendClub[]>("/clubs");
  return res.data;
}

export async function getClub(clubId: string): Promise<BackendClub> {
  const res = await api.get<BackendClub>(`/clubs/${clubId}`);
  return res.data;
}

export interface CreateClubPayload {
  name: string;
  description: string;
  color: string;
  initials: string;
  joinPolicy: string;
  dpUrl?: string | null;
  coverUrl?: string | null;
  location?: string | null;
}

export async function createClubRequest(payload: CreateClubPayload): Promise<BackendClub> {
  const res = await api.post<BackendClub>("/clubs", payload);
  return res.data;
}

export async function updateClubRequest(
  clubId: string,
  payload: Record<string, unknown>,
): Promise<BackendClub> {
  const res = await api.patch<BackendClub>(`/clubs/${clubId}`, payload);
  return res.data;
}

export async function deleteClubRequest(clubId: string): Promise<void> {
  await api.delete(`/clubs/${clubId}`);
}

export interface ChangeManagerPayload {
  targetUserId?: string;
  targetProfileId?: string;
}

export interface ChangeManagerResponse {
  success: boolean;
  message: string;
  clubId: string;
  clubName: string;
  previousManager: { id: string; userId: string; name: string; role: string } | null;
  newManager: { id: string; userId: string; name: string; role: string };
}

export async function getClubManagerRequest(clubId: string): Promise<any> {
  const res = await api.get(`/clubs/${clubId}/manager`);
  return res.data;
}

export async function changeClubManagerRequest(
  clubId: string,
  payload: ChangeManagerPayload,
): Promise<ChangeManagerResponse> {
  const res = await api.patch<ChangeManagerResponse>(`/clubs/${clubId}/manager`, payload);
  return res.data;
}

export async function transferClubManagerRequest(
  clubId: string,
  payload: ChangeManagerPayload,
): Promise<ChangeManagerResponse> {
  const res = await api.post<ChangeManagerResponse>(`/clubs/${clubId}/manager/transfer`, payload);
  return res.data;
}

export interface TransferPresidentPayload {
  targetUserId?: string;
  targetProfileId?: string;
}

export interface TransferPresidentResponse {
  success: boolean;
  message: string;
  clubId?: string;
  newPresidentId?: string;
  newPresidentUserId?: string;
}

export async function transferClubPresidentRequest(
  clubId: string,
  payload: TransferPresidentPayload,
): Promise<TransferPresidentResponse> {
  const res = await api.post<TransferPresidentResponse>(`/clubs/${clubId}/president/transfer`, payload);
  return res.data;
}

/** Staff positions assignable from club Settings; `Player` clears a member's position. */
export const ASSIGNABLE_CLUB_POSITIONS = [
  "General Secretary",
  "Manager",
  "Captain",
  "Vice-Captain",
  "Academy Captain",
] as const;
export type ClubPosition = (typeof ASSIGNABLE_CLUB_POSITIONS)[number] | "Player";

/** Puts a member (by profile id) in a staff position, or clears theirs with `Player`. */
export async function assignClubPositionRequest(clubId: string, profileId: string, role: ClubPosition) {
  const res = await api.patch(`/clubs/${clubId}/positions`, { profileId, role });
  return res.data;
}

/** The club's match-official nominees (user ids of members). */
export async function setClubMatchOfficialsRequest(clubId: string, userIds: string[]): Promise<{ matchOfficialIds: string[] }> {
  const res = await api.put<{ matchOfficialIds: string[] }>(`/clubs/${clubId}/match-officials`, { userIds });
  return res.data;
}

export async function leaveClubRequest(clubId: string): Promise<any> {
  const res = await api.post(`/clubs/${clubId}/leave`);
  return res.data;
}
