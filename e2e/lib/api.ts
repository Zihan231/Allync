import { API_URL } from "./env";

export class ApiError extends Error {
  constructor(
    readonly method: string,
    readonly path: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`${method} ${path} → ${status}: ${JSON.stringify(body).slice(0, 400)}`);
  }
}

export type ApiResult<T = any> = { status: number; body: T; ok: boolean };

/**
 * A tiny JSON client for the Allynq API, signed in with a Bearer token (the API also
 * accepts the `allync_token` cookie the browser uses).
 */
export class Api {
  constructor(readonly token?: string) {}

  /** Any status: for permission checks that expect a 4xx. */
  async raw<T = any>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        ...(this.token ? { authorization: `Bearer ${this.token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      /* plain text */
    }
    return { status: res.status, body: parsed as T, ok: res.ok };
  }

  /** Throws unless the call succeeds. */
  async call<T = any>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await this.raw<T>(method, path, body);
    if (!res.ok) throw new ApiError(method, path, res.status, res.body);
    return res.body;
  }

  get = <T = any>(path: string) => this.call<T>("GET", path);
  post = <T = any>(path: string, body?: unknown) => this.call<T>("POST", path, body ?? {});
  patch = <T = any>(path: string, body?: unknown) => this.call<T>("PATCH", path, body ?? {});
  put = <T = any>(path: string, body?: unknown) => this.call<T>("PUT", path, body ?? {});
  del = <T = any>(path: string) => this.call<T>("DELETE", path);

  // ------------------------------------------------------------- shortcuts

  me = () => this.get("/users/me");
  myWallet = async () => (await this.get("/transfers/me")).wallet as { balanceTk: number; heldTk: number };
  clubWallet = async (clubId: string) => (await this.get(`/transfers/clubs/${clubId}`)).wallet as { balanceTk: number; heldTk: number };
  topUp = (clubId?: string) => this.post("/transfers/wallets/top-up", clubId ? { clubId } : {});
}

export const anon = new Api();
