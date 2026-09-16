import axios, { type AxiosError } from "axios";

export interface ApiError {
  status: number;
  message: string;
  raw?: unknown;
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "message" in error &&
    typeof (error as ApiError).status === "number"
  );
}

function getApiBaseUrl(): string {
  // In the browser, go through this app's own /api/* rewrite proxy (see
  // next.config.ts) instead of the backend's cross-site origin directly —
  // some browsers (Safari ITP, Chrome's third-party-cookie phase-out) block
  // or partition the auth cookie between two different sites even with
  // SameSite=None; Secure set correctly. Routing through our own origin
  // makes the cookie first-party.
  if (typeof window !== "undefined") {
    return "/api";
  }

  const url =
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_API_URL_PROD
      : process.env.NEXT_PUBLIC_API_URL;

  return url || "http://localhost:3001";
}

export const api = axios.create({
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Resolved per-request (not once at module load) so the browser/server
// branch above is always evaluated in the environment actually making the
// call, matching how the previous fetch-based client worked.
api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string | string[] }>) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;
    const rawMessage = body?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(", ")
      : rawMessage || error.message || "Something went wrong";

    const apiError: ApiError = { status, message, raw: body };
    return Promise.reject(apiError);
  },
);
