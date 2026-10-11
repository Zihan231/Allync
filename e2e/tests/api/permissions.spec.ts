import { test, expect } from "@playwright/test";
import { Api, anon } from "../../lib/api";
import { castApis, ROLE_KEYS, type RoleKey } from "../../lib/cast";

/**
 * Who may do what, for every role. Guards run before body validation, so an allowed
 * caller sending an invalid body gets 400 (nothing changes) and a denied one gets 403.
 * Destructive routes (delete club/community) are only checked for the denied roles.
 */
const { cast, as } = castApis();
// The Ban Target is banned (and signed out) by the moderation suite, so he isn't a reliable caller here.
const ALL = (Object.keys(ROLE_KEYS) as RoleKey[]).filter((r) => r !== "banTarget");
const STAFF: RoleKey[] = ["moderator", "admin", "superAdmin"];

type Case = {
  name: string;
  method: string;
  path: string;
  body?: unknown;
  allowed: RoleKey[];
  /** Skip calling the allowed roles (the call would really change data). */
  denyOnly?: boolean;
  /** Roles not checked here (e.g. staff overrides tested elsewhere). */
  skip?: RoleKey[];
};

const A = cast.clubs.alpha;
const C = cast.communityId;
const BAD = { __invalid: true, name: 12345, role: "Nope", color: 5 };

const cases: Case[] = [
  // ------------------------------------------------------------- club Alpha
  { name: "edit club", method: "PATCH", path: `/clubs/${A}`, body: { minRoster: -5 }, allowed: ["alphaPresident", "alphaGs"] },
  { name: "delete club", method: "DELETE", path: `/clubs/${A}`, allowed: ["alphaPresident"], denyOnly: true },
  { name: "assign club position", method: "PATCH", path: `/clubs/${A}/positions`, body: BAD, allowed: ["alphaPresident", "alphaGs"] },
  { name: "set club match officials", method: "PUT", path: `/clubs/${A}/match-officials`, body: { userIds: "x" }, allowed: ["alphaPresident", "alphaGs"] },
  { name: "change club manager", method: "PATCH", path: `/clubs/${A}/manager`, body: BAD, allowed: ["alphaPresident", "alphaGs"] },
  { name: "transfer club presidency", method: "POST", path: `/clubs/${A}/president/transfer`, body: BAD, allowed: ["alphaPresident", "alphaGs"] },
  { name: "create club team", method: "POST", path: `/clubs/${A}/teams`, body: BAD, allowed: ["alphaPresident", "alphaManager"] },
  // ------------------------------------------------------------- community
  { name: "edit community", method: "PATCH", path: `/communities/${C}`, body: { joinPolicy: "nope" }, allowed: ["commPresident"] },
  { name: "delete community", method: "DELETE", path: `/communities/${C}`, allowed: ["commPresident"], denyOnly: true },
  { name: "see community join requests", method: "GET", path: `/communities/${C}/requests`, allowed: ["commPresident", "commVicePresident", "commTeamManager"] },
  { name: "assign community role", method: "PATCH", path: `/communities/${C}/roles`, body: BAD, allowed: ["commPresident"] },
  { name: "transfer community presidency", method: "POST", path: `/communities/${C}/president/transfer`, body: BAD, allowed: ["commPresident", "commVicePresident"] },
  // ------------------------------------------------------------- staff ladder
  { name: "admin: users list", method: "GET", path: `/admin/users`, allowed: STAFF },
  { name: "admin: reports queue", method: "GET", path: `/admin/reports`, allowed: STAFF },
  { name: "admin: disputes", method: "GET", path: `/admin/disputes`, allowed: STAFF },
  { name: "admin: store items", method: "GET", path: `/admin/store/items`, allowed: ["admin", "superAdmin"] },
  { name: "admin: wallet ledger", method: "GET", path: `/admin/wallets/ledger`, allowed: ["admin", "superAdmin"] },
  { name: "admin: transfer offers", method: "GET", path: `/admin/transfers/offers`, allowed: ["admin", "superAdmin"] },
  { name: "admin: security bans", method: "GET", path: `/admin/security/bans`, allowed: ["admin", "superAdmin"] },
  { name: "admin: announcements", method: "GET", path: `/admin/announcements`, allowed: ["admin", "superAdmin"] },
  { name: "admin: platform settings", method: "GET", path: `/admin/settings`, allowed: ["superAdmin"] },
  { name: "admin: audit log", method: "GET", path: `/admin/audit`, allowed: ["superAdmin"] },
  { name: "admin: backups", method: "GET", path: `/admin/backups`, allowed: ["superAdmin"] },
  { name: "admin: adjust a wallet", method: "POST", path: `/admin/wallets/adjust`, body: BAD, allowed: ["superAdmin"] },
  { name: "admin: change a staff role", method: "POST", path: `/admin/users/${cast.actors.freeAgent.userId}/role`, body: { role: "nope" }, allowed: ["superAdmin"] },
  { name: "admin: create store item", method: "POST", path: `/admin/store/items`, body: BAD, allowed: ["admin", "superAdmin"] },
];

const isDenied = (status: number) => status === 403;

test.describe("permission matrix (API)", () => {
  for (const c of cases) {
    test(c.name, async () => {
      const wrong: string[] = [];
      for (const role of ALL) {
        if (c.skip?.includes(role)) continue;
        const allowed = c.allowed.includes(role);
        if (allowed && c.denyOnly) continue;
        const res = await as(role).raw(c.method, c.path, c.body);
        if (allowed && (isDenied(res.status) || res.status === 401)) wrong.push(`${role} should be ALLOWED, got ${res.status}`);
        if (!allowed && !isDenied(res.status)) wrong.push(`${role} should be DENIED (403), got ${res.status}`);
      }
      const guest = await anon.raw(c.method, c.path, c.body);
      if (c.path.startsWith("/admin") || c.method !== "GET") {
        if (guest.status !== 401) wrong.push(`guest should get 401, got ${guest.status}`);
      }
      expect(wrong, wrong.join("\n")).toEqual([]);
    });
  }
});

test.describe("club leadership in transfers", () => {
  test("only the President and General Secretary lead the club's transfers", async () => {
    const leaders: RoleKey[] = ["alphaPresident", "alphaGs"];
    for (const role of ALL.filter((r) => r.startsWith("alpha"))) {
      const view = await as(role).get(`/transfers/clubs/${A}`);
      expect(view.isLeader, role).toBe(leaders.includes(role));
    }
  });

  test("only a leader can spend from or top up the club wallet", async () => {
    for (const role of ["alphaCaptain", "alphaViceCaptain", "alphaManager", "alphaPlayer", "betaPresident", "freeAgent"] as RoleKey[]) {
      const res = await as(role).raw("POST", "/transfers/wallets/top-up", { clubId: A });
      expect(res.status, role).toBeGreaterThanOrEqual(400);
    }
  });

  test("only a leader can send loan proposals for the club", async () => {
    const body = { clubId: A, playerUserId: cast.actors.betaPlayer.userId, feeTk: 0, matches: 1, maxDays: 7 };
    for (const role of ["alphaCaptain", "alphaViceCaptain", "alphaAcademyCaptain", "alphaManager", "alphaPlayer"] as RoleKey[]) {
      const res = await as(role).raw("POST", "/transfers/loans", body);
      expect(res.status, role).toBeGreaterThanOrEqual(400);
      expect(res.status, role).toBeLessThan(500);
    }
  });
});

test.describe("staff rank rule", () => {
  // A staff member can only act on users ranked below them.
  const target = (key: RoleKey) => cast.actors[key].userId;

  test("a moderator can't suspend an admin, an admin can't ban a super admin", async () => {
    const until = new Date(Date.now() + 24 * 3600_000).toISOString();
    const r1 = await as("moderator").raw("POST", `/admin/users/${target("admin")}/suspend`, { until, reason: "e2e rank check" });
    expect(r1.status, JSON.stringify(r1.body)).toBe(403);
    const r2 = await as("admin").raw("POST", `/admin/users/${target("superAdmin")}/ban`, { reason: "e2e rank check" });
    expect(r2.status, JSON.stringify(r2.body)).toBe(403);
    const r3 = await as("admin").raw("POST", `/admin/users/${target("admin")}/ban`, { reason: "e2e: self" });
    expect(r3.status).toBeGreaterThanOrEqual(400);
  });

  test("a super admin can't be demoted by an admin", async () => {
    const res = await as("admin").raw("POST", `/admin/users/${target("superAdmin")}/role`, { role: null });
    expect(res.status).toBe(403);
  });
});

test.describe("guests", () => {
  test("public reads work without signing in", async () => {
    for (const path of ["/clubs", "/communities", "/tournaments", "/store/catalog", `/clubs/${A}`, `/communities/${C}/members`]) {
      const res = await anon.raw("GET", path);
      expect(res.status, path).toBe(200);
    }
  });

  test("private reads need a session", async () => {
    for (const path of ["/users/me", "/transfers/me", "/store/me", "/notifications", "/tournaments/my-games"]) {
      const res = await anon.raw("GET", path);
      expect(res.status, path).toBe(401);
    }
  });

  test("a bad token is refused", async () => {
    expect((await new Api("not-a-token").raw("GET", "/users/me")).status).toBe(401);
  });
});
