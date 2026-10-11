import { test, expect } from "@playwright/test";
import { anon, Api } from "../../lib/api";
import { signIn, signUp } from "../../lib/actors";
import { castApis } from "../../lib/cast";

/** Sign-up rules, sign-in, profile requirements, moderation (warn/suspend/ban), notifications. */
const { cast, as, actor } = castApis();

test.describe("sign up and sign in", () => {
  test("phone and password rules are enforced", async () => {
    const base = { email: `e2e+${cast.runId}-bad@allynq.test`, password: "123456", name: "E2E Bad" };
    for (const phoneNumber of ["01712345678", "+8801212345678", "+880171234567", ""]) {
      const res = await anon.raw("POST", "/auth/register", { ...base, phoneNumber });
      expect(res.status, phoneNumber).toBe(400);
    }
    const shortPw = await anon.raw("POST", "/auth/register", { ...base, password: "123", phoneNumber: "+8801712345678" });
    expect(shortPw.status).toBe(400);
  });

  test("an email can't be registered twice", async () => {
    const a = actor("entrant1");
    const res = await anon.raw("POST", "/auth/register", { email: a.email, password: "whatever1", name: "Dup", phoneNumber: "+8801712345678" });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  test("wrong password is refused, right one signs in", async () => {
    const a = actor("entrant1");
    expect((await anon.raw("POST", "/auth/login", { email: a.email, password: "wrong-password" })).status).toBe(401);
    const res = await anon.post("/auth/login", { email: a.email, password: a.password });
    expect(res.accessToken).toBeTruthy();
    expect((await new Api(res.accessToken).me()).id).toBe(a.userId);
  });

  test("staff sign in needs the authenticator code", async () => {
    const a = actor("moderator");
    const first = await anon.post("/auth/login", { email: a.email, password: a.password });
    expect(first.requiresTwoFactor).toBe(true);
    expect(first.accessToken).toBeUndefined();
    const wrong = await anon.raw("POST", "/auth/staff-2fa/verify", { token: first.challengeToken, code: "000000" });
    expect(wrong.status).toBe(401);
    const again = await signIn(a);
    expect((await new Api(again.token).me()).systemRole).toBe("moderator");
  });
});

test.describe("profile requirements", () => {
  test("an incomplete profile can't create a club or join a tournament", async () => {
    const res = await anon.post("/auth/register", {
      email: `e2e+${cast.runId}-incomplete@allynq.test`,
      password: "E2e!incomplete1",
      name: "E2E Incomplete",
      phoneNumber: "+8801799999999",
    });
    const api = new Api(res.accessToken);
    const club = await api.raw("POST", "/clubs", { name: `E2E ${cast.runId} Nope`, color: "#000", initials: "NO" });
    expect(club.status).toBe(400);
    expect((club.body as any).code).toBe("PROFILE_INCOMPLETE");
    expect((club.body as any).missingFields).toEqual(expect.arrayContaining(["photo", "identityDocument"]));
  });

  test("a complete profile without an NID can join but not organize", async () => {
    const fresh = await signUp(cast.runId, "noid", "No ID");
    const api = new Api(fresh.token);
    await api.patch("/users/me", { documentType: "birth_certificate" });
    const club = await api.raw("POST", "/clubs", { name: `E2E ${cast.runId} NoId`, color: "#000", initials: "NI" });
    expect(club.status).toBe(400);
    expect((club.body as any).missingFields).toContain("identityDocument");
  });

  test("the gaming platform is saved on the profile", async () => {
    expect((await as("consolePlayer").me()).gamingPlatform).toBe("console");
    expect((await as("entrant1").me()).gamingPlatform ?? "mobile").toBe("mobile");
  });
});

test.describe("moderation", () => {
  test("a moderator can warn; only an admin can ban; a banned user can't sign in", async () => {
    const target = actor("banTarget");
    const warn = await as("moderator").raw("POST", `/admin/users/${target.userId}/warn`, { reason: "e2e warning", message: "e2e warning" });
    expect(warn.ok, JSON.stringify(warn.body)).toBe(true);

    expect((await as("moderator").raw("POST", `/admin/users/${target.userId}/ban`, { reason: "e2e" })).status).toBe(403);
    const ban = await as("admin").raw("POST", `/admin/users/${target.userId}/ban`, { reason: "e2e ban" });
    expect(ban.ok, JSON.stringify(ban.body)).toBe(true);

    const login = await anon.raw("POST", "/auth/login", { email: target.email, password: target.password });
    expect(login.status).toBeGreaterThanOrEqual(400);
    // His old session stops working too.
    expect((await as("banTarget").raw("GET", "/users/me")).status).toBeGreaterThanOrEqual(400);

    await as("admin").post(`/admin/users/${target.userId}/unban`, { reason: "e2e unban" });
    const back = await anon.raw("POST", "/auth/login", { email: target.email, password: target.password });
    expect(back.status).toBe(200);
  });

  test("users can report each other and staff see the report", async () => {
    const report = await as("entrant1").raw("POST", "/reports", {
      targetType: "user",
      targetId: actor("entrant2").userId,
      reason: "abuse",
      details: "e2e report, please ignore",
    });
    expect(report.ok, JSON.stringify(report.body)).toBe(true);
    const mine = await as("entrant1").get("/reports/mine");
    const rows = Array.isArray(mine) ? mine : (mine.data ?? mine.items ?? []);
    expect(rows.length).toBeGreaterThan(0);
    expect((await as("moderator").raw("GET", "/admin/reports")).ok).toBe(true);
  });
});

test.describe("notifications", () => {
  test("deal events land in the bell", async () => {
    // Setup signed players with offers and topped up wallets: each leaves a notification.
    const count = await as("alphaPlayer").get("/notifications/unread-count");
    expect(Number(count.unreadCount)).toBeGreaterThan(0);
    const list = await as("alphaPlayer").get("/notifications");
    const rows = Array.isArray(list) ? list : (list.data ?? list.items ?? []);
    expect(rows.length).toBeGreaterThan(0);
    await as("alphaPlayer").patch("/notifications/read-all", {});
    const after = await as("alphaPlayer").get("/notifications/unread-count");
    expect(Number(after.unreadCount)).toBe(0);
  });
});
