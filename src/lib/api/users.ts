import { api } from "./axios";
import type { BackendUser, BackendEfootballProfile } from "./types";

export async function getUsers(): Promise<BackendUser[]> {
  const res = await api.get<BackendUser[]>("/users");
  return res.data;
}

export async function getMe(): Promise<BackendUser> {
  const res = await api.get<BackendUser>("/users/me");
  return res.data;
}

export async function updateMe(payload: Record<string, unknown>): Promise<BackendUser> {
  const res = await api.patch<BackendUser>("/users/me", payload);
  return res.data;
}

export async function upsertMyEfootballProfile(
  payload: Record<string, unknown>,
): Promise<BackendEfootballProfile> {
  const res = await api.put<BackendEfootballProfile>("/users/me/efootball-profile", payload);
  return res.data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}
