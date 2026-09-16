import { api } from "./axios";
import type { BackendClub } from "./types";

export async function getClubs(): Promise<BackendClub[]> {
  const res = await api.get<BackendClub[]>("/clubs");
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
