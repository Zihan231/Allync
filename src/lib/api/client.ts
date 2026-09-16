export function getApiBaseUrl(): string {
  const url =
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_API_URL_PROD
      : process.env.NEXT_PUBLIC_API_URL;

  return url || "http://localhost:3001";
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) || {}),
  };

  // Auth is carried by the httpOnly "allync_token" cookie the backend sets on
  // login/register; the browser attaches it automatically when credentials
  // are included, and JS never has access to read or forward it manually.
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status} ${res.statusText}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// apiFetch throws "API 400 Bad Request: {...nest error json...}"; this pulls
// the human-readable `message` out of that JSON when present.
export function parseApiErrorMessage(err: unknown, fallback: string): string {
  let msg = err instanceof Error ? err.message : fallback;
  try {
    const parsed = JSON.parse(msg.replace(/^API \d+ [^:]+: /, ""));
    msg = parsed.message || msg;
  } catch {}
  return typeof msg === "string" ? msg.replace(/^API \d+ [^:]+: /, "") : fallback;
}
