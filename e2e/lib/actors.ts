import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { anon, Api } from "./api";
import { APP_URL, authFile, E2E_EMAIL_DOMAIN } from "./env";
import type { Actor } from "./cast";
import { setSystemRole } from "./db";
import { freshTotp } from "./totp";

const IMG = "https://picsum.photos/seed/allynq-e2e/400/400";
const COVER = "https://picsum.photos/seed/allynq-e2e-cover/1200/400";
// A 1×1 PNG: enough for the NID/passport upload organizers need.
const DOC = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

let phoneSeq = 0;
/** A valid, unique-looking Bangladeshi mobile number (+8801[3-9]XXXXXXXX). */
function phone(): string {
  phoneSeq += 1;
  const tail = `${Date.now() % 1_000_000}`.padStart(6, "0") + `${phoneSeq % 100}`.padStart(2, "0");
  return `+8801${7}${tail}`;
}

/** The profile fields the ProfileRequirementsGuard needs, plus an NID for organizer actions. */
export const COMPLETE_PROFILE = {
  dpUrl: IMG,
  coverUrl: COVER,
  inGameId: "E2E-KONAMI",
  facebookProfileName: "E2E Tester",
  facebookUrl: "https://facebook.com/e2e.tester",
  deviceName: "E2E Phone",
  deviceModel: "E2E-1",
  division: "Dhaka",
  district: "Dhaka",
  permanentAddress: "E2E Street, Dhaka",
  documentType: "national_id",
  documentDataUrl: DOC,
} as const;

export async function signUp(runId: string, key: string, name: string): Promise<Actor> {
  const email = `e2e+${runId}-${key.toLowerCase()}@${E2E_EMAIL_DOMAIN}`;
  const password = `E2e!${randomBytes(9).toString("base64url")}`;
  const res = await anon.post("/auth/register", { email, password, name: `E2E ${name}`, phoneNumber: phone(), country: "Bangladesh" });
  const token: string = res.accessToken;
  const api = new Api(token);
  await api.patch("/users/me", COMPLETE_PROFILE);
  const me = await api.me();
  const profile = await api.get(`/users/${me.id}/efootball-profile`);
  return { key, email, password, name: `E2E ${name}`, userId: me.id, profileId: profile.id, token };
}

/** Logs a user in again (fresh token), handling the staff 2FA challenge. */
export async function signIn(actor: Actor): Promise<Actor> {
  const res = await anon.post("/auth/login", { email: actor.email, password: actor.password });
  if (res.accessToken) return { ...actor, token: res.accessToken };
  if (!res.requiresTwoFactor) throw new Error(`Unexpected login answer for ${actor.key}: ${JSON.stringify(res)}`);
  let secret = actor.totpSecret;
  if (res.setupRequired) {
    secret = (await anon.post("/auth/staff-2fa/setup", { token: res.challengeToken })).secret;
  }
  if (!secret) throw new Error(`No authenticator secret for ${actor.key}`);
  const { code, window } = await freshTotp(secret, actor.totpWindow);
  const done = await anon.post("/auth/staff-2fa/verify", { token: res.challengeToken, code });
  return { ...actor, token: done.accessToken, totpSecret: secret, totpWindow: window };
}

export async function makeStaff(actor: Actor, role: NonNullable<Actor["systemRole"]>): Promise<Actor> {
  await setSystemRole(actor.email, role);
  return { ...(await signIn(actor)), systemRole: role };
}

/** A browser session (cookie + the app's "has session" hint, English UI) for `storageState`. */
export function writeStorageState(actor: Actor): string {
  const file = authFile(actor.key);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const url = new URL(APP_URL);
  const state = {
    cookies: [
      {
        name: "allync_token",
        value: actor.token,
        domain: url.hostname,
        path: "/",
        expires: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
        httpOnly: true,
        secure: false,
        sameSite: "Lax" as const,
      },
    ],
    origins: [
      {
        origin: url.origin,
        localStorage: [
          { name: "ALLYNQ_HAS_SESSION", value: "1" },
          { name: "ALLYNQ-locale", value: "en" },
        ],
      },
    ],
  };
  fs.writeFileSync(file, JSON.stringify(state, null, 2));
  return file;
}
