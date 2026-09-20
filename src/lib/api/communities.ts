import { api } from "./axios";
import type { BackendCommunity, BackendCommunityMember } from "./types";

export interface CreateCommunityPayload {
  name: string;
  rules: string;
  joinPolicy?: string;
  color?: string;
  initials?: string;
  dpUrl?: string | null;
  coverUrl?: string | null;
  location?: string | null;
  motto?: string | null;
  facebookUrl?: string | null;
}

export async function getCommunities(query?: { search?: string; tier?: string }): Promise<BackendCommunity[]> {
  const res = await api.get<BackendCommunity[]>("/communities", { params: query });
  return res.data;
}

export async function getCommunity(id: string): Promise<BackendCommunity> {
  const res = await api.get<BackendCommunity>(`/communities/${id}`);
  return res.data;
}

export async function createCommunityRequest(payload: CreateCommunityPayload): Promise<BackendCommunity> {
  const res = await api.post<BackendCommunity>("/communities", payload);
  return res.data;
}

export async function updateCommunityRequest(
  communityId: string,
  payload: Record<string, unknown>,
): Promise<BackendCommunity> {
  const res = await api.patch<BackendCommunity>(`/communities/${communityId}`, payload);
  return res.data;
}

export async function deleteCommunityRequest(communityId: string): Promise<void> {
  await api.delete(`/communities/${communityId}`);
}

export async function joinCommunityRequest(communityId: string): Promise<any> {
  const res = await api.post(`/communities/${communityId}/join`);
  return res.data;
}

export async function leaveCommunityRequest(communityId: string): Promise<any> {
  const res = await api.post(`/communities/${communityId}/leave`);
  return res.data;
}

export async function addClubToCommunityRequest(communityId: string, clubId: string): Promise<any> {
  const res = await api.post(`/communities/${communityId}/clubs/${clubId}`);
  return res.data;
}

export async function removeClubFromCommunityRequest(communityId: string, clubId: string): Promise<any> {
  const res = await api.delete(`/communities/${communityId}/clubs/${clubId}`);
  return res.data;
}

export async function getCommunityMembersRequest(communityId: string): Promise<BackendCommunityMember[]> {
  const res = await api.get<BackendCommunityMember[]>(`/communities/${communityId}/members`);
  return res.data;
}

export async function getCommunityRequestsRequest(communityId: string): Promise<any[]> {
  const res = await api.get(`/communities/${communityId}/requests`);
  return res.data;
}

export async function reviewCommunityRequestRequest(
  communityId: string,
  requestId: string,
  status: "approved" | "rejected",
): Promise<any> {
  const res = await api.post(`/communities/${communityId}/requests/${requestId}/review`, { status });
  return res.data;
}

export async function transferCommunityPresidentRequest(
  communityId: string,
  payload: { targetUserId?: string; targetProfileId?: string },
): Promise<any> {
  const res = await api.post(`/communities/${communityId}/president/transfer`, payload);
  return res.data;
}

export async function getMyCommunityRequest(communityId: string): Promise<{ hasPendingRequest: boolean; request: any }> {
  const res = await api.get(`/communities/${communityId}/my-request`);
  return res.data;
}
