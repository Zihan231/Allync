import { test, expect } from "@playwright/test";
import { anon } from "../../lib/api";
import { castApis, type RoleKey } from "../../lib/cast";
import { expectMoved, snapshot } from "../../lib/money";

/**
 * Roles and coaching: the role picker's API, coach profiles, posts that need staff
 * approval, and coaching deals with exact wallet movements and the platform cut.
 */
const { cast, as, actor } = castApis();
const A = cast.clubs.alpha;
const B = cast.clubs.beta;
const coachId = () => actor("coach").userId;

let pct = 10;
const cut = (fee: number) => Math.round((fee * pct) / 100);
const platformTotal = async () => (await as("admin").get("/admin/coaching/deals?limit=1")).platformCommissionTk as number;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  pct = (await as("coach").get("/coaching/me")).settings.commissionPct;
});

test.describe("roles", () => {
  test("a user saves the roles he picked; the first is the default", async () => {
    const me = await as("coach").me();
    expect(me.roles).toEqual(["esports_professional", "coach", "player"]);
    expect(me.primaryRole).toBe("coach");
    expect(me.rolesChosenAt).toBeTruthy();
  });

  test("coach, creative and social need esports professional, and it needs one of them", async () => {
    expect((await as("entrant1").raw("PUT", "/users/me/roles", { roles: ["coach"], primaryRole: "coach" })).status).toBe(400);
    expect((await as("entrant1").raw("PUT", "/users/me/roles", { roles: ["esports_professional"], primaryRole: "esports_professional" })).status).toBe(400);
  });

  test("the default must be one of the picked roles, and roles are from the list", async () => {
    expect((await as("entrant1").raw("PUT", "/users/me/roles", { roles: ["player"], primaryRole: "organizer" })).status).toBe(400);
    expect((await as("entrant1").raw("PUT", "/users/me/roles", { roles: ["wizard"], primaryRole: "wizard" })).status).toBe(400);
    expect((await as("entrant1").raw("PUT", "/users/me/roles", { roles: [], primaryRole: "player" })).status).toBe(400);
  });

  test("roles can't be set through the generic profile edit", async () => {
    await as("entrant1").raw("PATCH", "/users/me", { roles: ["coach"], primaryRole: "coach" });
    expect((await as("entrant1").me()).roles).toEqual(["player"]);
  });
});

test.describe("coach profile and posts", () => {
  let postId = "";

  test("only users with the coach role can have a coach profile", async () => {
    const res = await as("entrant1").raw("PUT", "/coaching/me/profile", { headline: "Not a coach" });
    expect(res.status).toBe(400);
    const profile = await as("coach").get("/coaching/me");
    expect(profile.profile.headline).toContain("tactics coach");
  });

  test("the coach appears in the coaches directory", async () => {
    const list = await anon.get(`/coaching/coaches?search=${encodeURIComponent(cast.runId)}&available=true`);
    expect(list.data.map((c: any) => c.userId)).toContain(coachId());
  });

  test("a new post waits for review and is invisible to others", async () => {
    const form = new FormData();
    form.append("body", "Pressing triggers: when to jump the passing lane");
    form.append("links", "https://youtu.be/dQw4w9WgXcQ");
    const res = await fetch(`${process.env.E2E_API_URL ?? "http://localhost:3001"}/coaching/me/posts`, {
      method: "POST",
      headers: { authorization: `Bearer ${actor("coach").token}` },
      body: form,
    });
    expect(res.status).toBe(201);
    const post = await res.json();
    postId = post.id;
    expect(post.status).toBe("pending");
    expect((await anon.get(`/coaching/coaches/${coachId()}`)).posts.map((p: any) => p.id)).not.toContain(postId);
    expect((await as("coach").get(`/coaching/coaches/${coachId()}`)).posts.map((p: any) => p.id)).toContain(postId);
  });

  test("an empty post or a bad link is refused", async () => {
    for (const links of ["", "javascript:alert(1)"]) {
      const form = new FormData();
      form.append("body", "");
      form.append("links", links);
      const res = await fetch(`${process.env.E2E_API_URL ?? "http://localhost:3001"}/coaching/me/posts`, {
        method: "POST",
        headers: { authorization: `Bearer ${actor("coach").token}` },
        body: form,
      });
      expect(res.status, links || "empty").toBe(400);
    }
  });

  test("only staff review posts; rejecting needs a reason", async () => {
    expect((await as("coach").raw("GET", "/admin/coaching/posts")).status).toBe(403);
    expect((await as("alphaPresident").raw("POST", `/admin/coaching/posts/${postId}/review`, { approve: true })).status).toBe(403);
    const queue = await as("moderator").get("/admin/coaching/posts?status=pending");
    expect(queue.data.map((p: any) => p.id)).toContain(postId);
    expect((await as("moderator").raw("POST", `/admin/coaching/posts/${postId}/review`, { approve: false })).status).toBe(400);
  });

  test("once a moderator approves it, everyone sees it", async () => {
    await as("moderator").post(`/admin/coaching/posts/${postId}/review`, { approve: true });
    expect((await anon.get(`/coaching/coaches/${coachId()}`)).posts.map((p: any) => p.id)).toContain(postId);
    const notes = await as("coach").get("/notifications");
    const rows = Array.isArray(notes) ? notes : (notes.data ?? []);
    expect(rows.some((n: any) => n.code === "coaching.postApproved")).toBe(true);
  });
});

test.describe("coaching deals", () => {
  test("only a club leader can offer a coach a deal; only coaches can be offered", async () => {
    const body = { clubId: A, coachUserId: coachId(), feeTk: 0, days: 30 };
    for (const key of ["alphaCaptain", "alphaManager", "alphaPlayer", "betaPresident"] as RoleKey[]) {
      const res = await as(key).raw("POST", "/coaching/deals", body);
      expect(res.status, key).toBeGreaterThanOrEqual(400);
      expect(res.status, key).toBeLessThan(500);
    }
    const notCoach = await as("alphaPresident").raw("POST", "/coaching/deals", { ...body, coachUserId: actor("entrant1").userId });
    expect(notCoach.status).toBe(400);
    const requestByNonCoach = await as("entrant1").raw("POST", "/coaching/deals", { clubId: A, feeTk: 0, days: 30 });
    expect(requestByNonCoach.status).toBe(400);
  });

  test("the length must be within the settings", async () => {
    const res = await as("coach").raw("POST", "/coaching/deals", { clubId: A, feeTk: 0, days: 1 });
    expect(res.status).toBe(400);
  });

  test("a club offer holds the fee; on acceptance the coach is paid minus the platform cut", async () => {
    const club = as("alphaPresident");
    const coach = as("coach");
    const club0 = await snapshot(club, A);
    const coach0 = await snapshot(coach);
    const platform0 = await platformTotal();
    const FEE = 300;

    const deal = await club.post("/coaching/deals", { clubId: A, coachUserId: coachId(), feeTk: FEE, days: 30, paymentMethod: "bkash", message: "e2e" });
    expect(deal.status).toBe("pending");
    expect(deal.turn).toBe("coach");
    await expectMoved(club, club0, { balanceTk: -FEE, heldTk: FEE }, A, "club holds the fee");

    // A duplicate open deal with the same club is refused.
    expect((await coach.raw("POST", "/coaching/deals", { clubId: A, feeTk: 0, days: 30 })).status).toBe(400);
    // Only the coach answers it.
    expect((await club.raw("POST", `/coaching/deals/${deal.id}/respond`, { accept: true })).status).toBe(403);

    const done = await coach.post(`/coaching/deals/${deal.id}/respond`, { accept: true });
    expect(done.status).toBe("active");
    expect(done.commissionTk).toBe(cut(FEE));
    await expectMoved(club, club0, { balanceTk: -FEE }, A, "club paid the fee");
    await expectMoved(coach, coach0, { balanceTk: FEE - cut(FEE) }, undefined, "coach got the fee minus the cut");
    expect((await platformTotal()) - platform0).toBe(cut(FEE));

    const clubView = await anon.get(`/coaching/clubs/${A}`);
    expect(clubView.coach.coach.id).toBe(coachId());
    expect(clubView.isLeader).toBe(false);
    expect(clubView.open).toEqual([]);
  });

  test("a coach's request: the club counters (paying into the hold), the coach counters, the club accepts and pays the rest", async () => {
    const club = as("betaPresident");
    const coach = as("coach");
    const club0 = await snapshot(club, B);

    const req = await coach.post("/coaching/deals", { clubId: B, feeTk: 400, days: 20 });
    expect(req.turn).toBe("club");
    await expectMoved(club, club0, {}, B, "a request holds nothing");

    await club.post(`/coaching/deals/${req.id}/counter`, { feeTk: 250, paymentMethod: "nagad" });
    await expectMoved(club, club0, { balanceTk: -250, heldTk: 250 }, B, "club counter is held");
    expect((await club.raw("POST", `/coaching/deals/${req.id}/counter`, { feeTk: 260 })).status).toBe(403);

    await coach.post(`/coaching/deals/${req.id}/counter`, { feeTk: 300, days: 20 });
    const done = await club.post(`/coaching/deals/${req.id}/respond`, { accept: true, paymentMethod: "nagad" });
    // He already coaches Alpha, so this one is lined up after it.
    expect(done.status).toBe("scheduled");
    expect(new Date(done.startedAt).getTime()).toBeGreaterThan(Date.now() + 25 * 24 * 3600_000);
    await expectMoved(club, club0, { balanceTk: -300 }, B, "club paid 300 in all");
    expect(done.bids.map((b: any) => [b.party, b.feeTk])).toEqual([
      ["coach", 400],
      ["club", 250],
      ["coach", 300],
    ]);
  });

  test("ending early starts the lined-up deal; declining or withdrawing gives the club its money back", async () => {
    const club = as("alphaPresident");
    const club0 = await snapshot(club, A);
    const active = (await as("coach").get("/coaching/me")).deals.find((d: any) => d.status === "active" && d.club.id === A);
    await as("coach").post(`/coaching/deals/${active.id}/end`, {});
    // Ending early starts the lined-up Beta deal.
    const mine = await as("coach").get("/coaching/me");
    expect(mine.deals.find((d: any) => d.club.id === B && d.status === "active")).toBeTruthy();

    const offer = await club.post("/coaching/deals", { clubId: A, coachUserId: coachId(), feeTk: 120, days: 14, paymentMethod: "card" });
    await expectMoved(club, club0, { balanceTk: -120, heldTk: 120 }, A);
    await as("coach").post(`/coaching/deals/${offer.id}/respond`, { accept: false });
    await expectMoved(club, club0, {}, A, "declined: refunded");

    const second = await club.post("/coaching/deals", { clubId: A, coachUserId: coachId(), feeTk: 80, days: 14, paymentMethod: "card" });
    await club.post(`/coaching/deals/${second.id}/cancel`, {});
    await expectMoved(club, club0, {}, A, "withdrawn: refunded");
  });

  test("leaders see open deals on their club; the staff ledger lists deals", async () => {
    const req = await as("coach").post("/coaching/deals", { clubId: A, feeTk: 50, days: 14 });
    const leaderView = await as("alphaPresident").get(`/coaching/clubs/${A}`);
    expect(leaderView.isLeader).toBe(true);
    expect(leaderView.open.map((d: any) => d.id)).toContain(req.id);
    await as("coach").post(`/coaching/deals/${req.id}/cancel`, {});
    expect((await as("moderator").raw("GET", "/admin/coaching/deals")).status).toBe(403);
    expect((await as("admin").get("/admin/coaching/deals")).data.length).toBeGreaterThan(0);
  });
});
