import { api } from "./axios";
import type { BackendUser } from "./types";

export interface AuthResponse {
  accessToken: string;
  user: BackendUser;
}

export interface TwoFactorChallenge {
  requiresTwoFactor: true;
  setupRequired: boolean;
  challengeToken: string;
  expiresInSeconds: number;
}

export interface TwoFactorSetup {
  secret: string;
  otpauthUri: string;
}

export type LoginResponse = AuthResponse | TwoFactorChallenge;

export function isTwoFactorChallenge(response: LoginResponse): response is TwoFactorChallenge {
  return "requiresTwoFactor" in response && response.requiresTwoFactor;
}

export async function loginRequest(payload: { email: string; password: string }): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>("/auth/login", payload);
  return res.data;
}

export async function setupStaffTwoFactor(challengeToken: string): Promise<TwoFactorSetup> {
  const res = await api.post<TwoFactorSetup>("/auth/staff-2fa/setup", { token: challengeToken });
  return res.data;
}

export async function verifyStaffTwoFactor(
  challengeToken: string,
  code: string,
): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/staff-2fa/verify", {
    token: challengeToken,
    code,
  });
  return res.data;
}

export async function registerRequest(payload: {
  name: string;
  email: string;
  password: string;
  /** E.164, e.g. "+8801712345678". */
  phoneNumber: string;
  country: string;
}): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/register", payload);
  return res.data;
}

export async function logoutRequest(): Promise<void> {
  await api.post("/auth/logout");
}
