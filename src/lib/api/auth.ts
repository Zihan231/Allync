import { api } from "./axios";
import type { BackendUser } from "./types";

export interface AuthResponse {
  accessToken: string;
  user: BackendUser;
}

export async function loginRequest(payload: { email: string; password: string }): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/login", payload);
  return res.data;
}

export async function registerRequest(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/register", payload);
  return res.data;
}

export async function logoutRequest(): Promise<void> {
  await api.post("/auth/logout");
}
