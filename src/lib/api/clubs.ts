import { api } from "./axios";
import type { BackendClub } from "./types";

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

export async function joinClubRequest(clubId: string): Promise<any> {
  const res = await api.post(`/clubs/${clubId}/join`);
  return res.data;
}

export async function getMyClubRequest(clubId: string): Promise<{ hasPendingRequest: boolean; request: any }> {
  const res = await api.get(`/clubs/${clubId}/my-request`);
  return res.data;
}

export async function getClubRequests(clubId: string): Promise<any[]> {
  const res = await api.get(`/clubs/${clubId}/requests`);
  return res.data;
}

export async function reviewClubRequest(
  clubId: string,
  requestId: string,
  status: 'approved' | 'rejected',
): Promise<any> {
  const res = await api.post(`/clubs/${clubId}/requests/${requestId}/review`, { status });
  return res.data;
}

export async function leaveClubRequest(clubId: string): Promise<any> {
  const res = await api.post(`/clubs/${clubId}/leave`);
  return res.data;
}
