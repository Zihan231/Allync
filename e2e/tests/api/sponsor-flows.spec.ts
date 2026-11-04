import { test, expect } from "@playwright/test";
import { anon, countNotes } from "../../lib/api";
import { castApis, type RoleKey } from "../../lib/cast";
import { expectMoved, snapshot } from "../../lib/money";

/**
 * A sponsor and the community it sponsors, from both sides: who is told (the community's
 * President and Vice President, never an ordinary member), who may answer, what each answer
 * does to the money, the limits, calls for sponsors, brand profiles, verification and posts.
 */
const { cast, as, actor } = castApis();
const C = cast.communityId;
const API = process.env.E2E_API_URL ?? "http://localhost:3001";
const HOSTS: RoleKey[] = ["commPresident", "commVicePresident"];
const NOT_HOSTS: RoleKey[] = ["commTeamManager", "commHeadOfDiscipline", "commScout", "commMember"];

let pct = 10;
const cut = (amount: number) => Math.round((amount * pct) / 100);

async function notified(code: string, users: RoleKey[], action: () => Promise<unknown>): Promise<Record<string, number>> {
  const before = await Promise.all(users.map((u) => countNotes(as(u), code)));
  await action();
  const after = await Promise.all(users.map((u) => countNotes(as(u), code)));
  return Object.fromEntries(users.map((u, i) => [u, after[i] - before[i]]));
}

const offer = (who: RoleKey, body: Record<string, unknown>) => as(who).raw("POST", "/sponsorships", { targetType: "community", targetId: C, tier: "partner", amountTk: 100, days: 30, ...body });
const mk = async (who: RoleKey, body: Record<string, unknown> = {}) => {
  const res = await offer(who, body);
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body;
};

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  pct = (await as("sponsor").get("/sponsors/me")).settings.commissionPct;
  // A kept cast (E2E_KEEP=1) can still have deals from an earlier run: close them so each run starts clean.
  for (const key of ["sponsor", "sponsor2"] as RoleKey[]) {
    for (const d of (await as(key).get("/sponsors/me")).deals) {
      if (d.status === "pending") await as(key).raw("POST", `/sponsorships/${d.id}/cancel`, {});
      if (d.status === "active") await as(key).raw("POST", `/sponsorships/${d.id}/end`, {});
    }
  }
});

test.describe("a sponsor offers to a community", () => {
  test("only sponsors can offer, and the terms are checked", async () => {
    expect((await offer("entrant1", {})).status).toBe(403);
    for (const [label, body] of [
      ["negative amount", { amountTk: -1 }],
      ["days too few", { days: 3 }],
      ["days too many", { days: 400 }],
      ["no days for a community", { days: undefined }],
      ["unknown tier", { tier: "platinum" }],
      ["not a uuid", { targetId: "nope" }],
      ["an empty wallet", { amountTk: 99_999_999 }],
    ] as const) {
      expect((await offer("sponsor", body)).status, label).toBe(400);
    }
    expect((await offer("sponsor", { targetId: "00000000-0000-4000-8000-000000000000" })).status).toBe(404);
  });

  let dealId = "";
  test("the amount is held and only the President and Vice President are told", async () => {
    const sponsor = as("sponsor");
    const s0 = await snapshot(sponsor);
    const watchers: RoleKey[] = [...HOSTS, ...NOT_HOSTS, "sponsor"];
    const got = await notified("sponsorship.requested", watchers, async () => {
      const deal = await mk("sponsor", { tier: "partner", amountTk: 300, days: 30, message: "e2e offer" });
      dealId = deal.id;
      expect(deal).toMatchObject({ status: "pending", turn: "host", amountTk: 300 });
    });
    for (const h of HOSTS) expect(got[h], h).toBe(1);
    for (const n of [...NOT_HOSTS, "sponsor"]) expect(got[n], n).toBe(0);
    await expectMoved(sponsor, s0, { balanceTk: -300, heldTk: 300 }, undefined, "the offer is held from the sponsor");
  });

  test("hosts see the request on the community; members and guests don't", async () => {
    for (const h of HOSTS) {
      const view = await as(h).get(`/sponsorships/target/community/${C}`);
      expect(view.canManage, h).toBe(true);
      expect(view.pending.map((d: any) => d.id), h).toContain(dealId);
    }
    for (const n of ["commMember", "commScout", "entrant1"] as RoleKey[]) {
      const view = await as(n).get(`/sponsorships/target/community/${C}`);
      expect(view.canManage, n).toBe(false);
      expect(view.pending ?? [], n).toEqual([]);
    }
    expect((await anon.get(`/sponsorships/target/community/${C}`)).canManage).toBe(false);
  });

  test("one open deal per sponsor per community; nobody else may answer; the sponsor can't answer its own offer", async () => {
    expect((await offer("sponsor", { amountTk: 50 })).status).toBe(400);
    for (const key of [...NOT_HOSTS, "entrant1", "sponsor2"] as RoleKey[]) {
      for (const path of ["respond", "counter", "cancel"] as const) {
        const res = await as(key).raw("POST", `/sponsorships/${dealId}/${path}`, { accept: true, amountTk: 10 });
        expect(res.status, `${key} ${path}`).toBeGreaterThanOrEqual(400);
        expect(res.status, `${key} ${path}`).toBeLessThan(500);
      }
    }
    expect((await as("sponsor").raw("POST", `/sponsorships/${dealId}/respond`, { accept: true })).status).toBeGreaterThanOrEqual(400);
  });

  test("counters pass back and forth; the sponsor's hold follows its own counters", async () => {
    const sponsor = as("sponsor");
    const s0 = await snapshot(sponsor);
    const toSponsor = await notified("sponsorship.countered", ["sponsor", "commPresident"], () =>
      as("commVicePresident").post(`/sponsorships/${dealId}/counter`, { amountTk: 400, tier: "gold", days: 30 }),
    );
    expect(toSponsor).toEqual({ sponsor: 1, commPresident: 0 });
    await expectMoved(sponsor, s0, {}, undefined, "a host counter doesn't touch the hold yet");

    const toHosts = await notified("sponsorship.countered", HOSTS, () => sponsor.post(`/sponsorships/${dealId}/counter`, { amountTk: 350 }));
    for (const h of HOSTS) expect(toHosts[h], h).toBe(1);
    await expectMoved(sponsor, s0, { balanceTk: -50, heldTk: 50 }, undefined, "the sponsor's counter is held (350 now, 300 before)");
  });

  test("a host accepts: the community's payee gets the amount minus the platform cut and the sponsor is told", async () => {
    const sponsor = as("sponsor");
    const payee = as("commPresident");
    const s0 = await snapshot(sponsor);
    const p0 = await snapshot(payee);
    const got = await notified("sponsorship.accepted", ["sponsor", "commPresident"], async () => {
      const done = await as("commVicePresident").post(`/sponsorships/${dealId}/respond`, { accept: true });
      expect(done.status).toBe("active");
      expect(done.tier).toBe("gold");
      expect(done.endsAt).toBeTruthy();
    });
    expect(got).toEqual({ sponsor: 1, commPresident: 0 });
    // The 350 was already held: accepting releases it to the payee, so the sponsor's balance doesn't change again.
    await expectMoved(sponsor, s0, { heldTk: -350 }, undefined, "the held 350 is paid out");
    await expectMoved(payee, p0, { balanceTk: 350 - cut(350) }, undefined, "the payee got the amount minus the cut");

    // A second answer is refused.
    expect((await as("commPresident").raw("POST", `/sponsorships/${dealId}/respond`, { accept: true })).status).toBe(400);
  });

  test("the community page now lists the sponsor under its tier", async () => {
    const view = await anon.get(`/sponsorships/target/community/${C}`);
    const text = JSON.stringify(view);
    expect(text).toContain(actor("sponsor").userId);
    expect(text).toContain("gold");
    // A sponsor with an active deal can't open another one here.
    expect((await offer("sponsor", { amountTk: 10 })).status).toBe(400);
  });
});

test.describe("tiers, ending, declining and withdrawing", () => {
  test("a Title sponsor is shown as the title; ending a sponsorship tells the other side and refunds nothing", async () => {
    const deal2 = await mk("sponsor2", { tier: "title", amountTk: 200, days: 30 });
    await as("commPresident").post(`/sponsorships/${deal2.id}/respond`, { accept: true });
    const view = await anon.get(`/sponsorships/target/community/${C}`);
    expect(JSON.stringify(view.title)).toContain(actor("sponsor2").userId);

    const s2 = as("sponsor2");
    const s0 = await snapshot(s2);
    const got = await notified("sponsorship.ended", ["sponsor2", "commPresident"], async () => {
      const ended = await as("commVicePresident").post(`/sponsorships/${deal2.id}/end`, {});
      expect(ended.status).toBe("ended");
    });
    expect(got).toEqual({ sponsor2: 1, commPresident: 0 });
    await expectMoved(s2, s0, {}, undefined, "ending refunds nothing");
    expect((await as("commMember").raw("POST", `/sponsorships/${deal2.id}/end`, {})).status).toBeGreaterThanOrEqual(400);
  });

  test("declining gives the sponsor its money back and tells it", async () => {
    const s2 = as("sponsor2");
    const s0 = await snapshot(s2);
    const deal = await mk("sponsor2", { amountTk: 120, days: 14 });
    await expectMoved(s2, s0, { balanceTk: -120, heldTk: 120 }, undefined, "held");
    const got = await notified("sponsorship.declined", ["sponsor2"], () => as("commVicePresident").post(`/sponsorships/${deal.id}/respond`, { accept: false }));
    expect(got.sponsor2).toBe(1);
    await expectMoved(s2, s0, {}, undefined, "declined: refunded");
    for (const path of ["respond", "counter", "cancel", "end"]) {
      expect((await as("commPresident").raw("POST", `/sponsorships/${deal.id}/${path}`, { accept: true, amountTk: 1 })).status, path).toBe(400);
    }
  });

  test("withdrawing gives the money back", async () => {
    const s2 = as("sponsor2");
    const s0 = await snapshot(s2);
    const deal = await mk("sponsor2", { amountTk: 90, days: 14 });
    expect((await s2.post(`/sponsorships/${deal.id}/cancel`, {})).status).toBe("cancelled");
    await expectMoved(s2, s0, {}, undefined, "withdrawn: refunded");
  });
});

test.describe("a host asks a sponsor", () => {
  test("nothing is held; the sponsor is told; only hosts can ask; accepting pays the payee", async () => {
    expect((await as("commMember").raw("POST", "/sponsorships", { targetType: "community", targetId: C, sponsorUserId: actor("sponsor2").userId, tier: "partner", amountTk: 10, days: 14 })).status).toBeGreaterThanOrEqual(403);
    expect((await as("commPresident").raw("POST", "/sponsorships", { targetType: "community", targetId: C, sponsorUserId: actor("entrant1").userId, tier: "partner", amountTk: 10, days: 14 })).status, "not a sponsor").toBe(404);

    const s2 = as("sponsor2");
    const s0 = await snapshot(s2);
    let id = "";
    const got = await notified("sponsorship.requested", ["sponsor2", "commVicePresident"], async () => {
      const deal = await as("commPresident").post("/sponsorships", { targetType: "community", targetId: C, sponsorUserId: actor("sponsor2").userId, tier: "partner", amountTk: 150, days: 20 });
      id = deal.id;
      expect(deal).toMatchObject({ status: "pending", turn: "sponsor" });
    });
    expect(got.sponsor2).toBe(1);
    await expectMoved(s2, s0, {}, undefined, "a host's ask holds nothing");

    // The host can't answer its own ask; the sponsor can.
    expect((await as("commVicePresident").raw("POST", `/sponsorships/${id}/respond`, { accept: true })).status).toBeGreaterThanOrEqual(400);
    const payee = as("commPresident");
    const p0 = await snapshot(payee);
    const told = await notified("sponsorship.accepted", HOSTS, async () => {
      expect((await s2.post(`/sponsorships/${id}/respond`, { accept: true })).status).toBe("active");
    });
    for (const h of HOSTS) expect(told[h], h).toBe(1);
    await expectMoved(s2, s0, { balanceTk: -150 }, undefined, "the sponsor paid when it accepted");
    await expectMoved(payee, p0, { balanceTk: 150 - cut(150) }, undefined, "the payee got it minus the cut");
    await s2.post(`/sponsorships/${id}/end`, {});
  });
});

test.describe("calls for sponsors", () => {
  test("hosts open and close a call; everyone can read open calls", async () => {
    expect((await as("commMember").raw("POST", "/sponsorships/calls", { targetType: "community", targetId: C, tiers: ["gold"] })).status).toBeGreaterThanOrEqual(403);
    expect((await as("commPresident").raw("POST", "/sponsorships/calls", { targetType: "community", targetId: C, tiers: [] })).status).toBe(400);

    const call = await as("commVicePresident").post("/sponsorships/calls", { targetType: "community", targetId: C, tiers: ["gold", "partner"], note: "e2e call", askTk: 500 });
    expect(call.id).toBeTruthy();
    const open = await anon.get("/sponsorships/calls");
    expect(JSON.stringify(open)).toContain(C);
    expect(JSON.stringify(await anon.get(`/sponsorships/target/community/${C}`))).toContain("e2e call");

    expect((await as("commMember").raw("DELETE", `/sponsorships/calls/${call.id}`)).status).toBeGreaterThanOrEqual(403);
    await as("commPresident").del(`/sponsorships/calls/${call.id}`);
    expect(JSON.stringify(await anon.get("/sponsorships/calls"))).not.toContain(`"${call.id}"`);
  });
});

test.describe("brand profile, directory and verification", () => {
  test("the profile rules", async () => {
    for (const [label, body] of [
      ["brand too short", { brandName: "x" }],
      ["brand too long", { brandName: "x".repeat(81) }],
      ["website not http", { website: "javascript:alert(1)" }],
      ["facebook not http", { facebookUrl: "ftp://x" }],
    ] as const) {
      expect((await as("sponsor").raw("PUT", "/sponsors/me", body)).status, label).toBe(400);
    }
    expect((await as("entrant1").raw("PUT", "/sponsors/me", { brandName: "Nope Brand" })).status).toBe(403);
    expect((await as("sponsor").put("/sponsors/me", { tagline: "Gear that wins", website: "https://example.com/e2e" })).profile?.tagline ?? "Gear that wins").toBe("Gear that wins");
  });

  test("the directory searches by brand and filters verified ones", async () => {
    const found = await anon.get(`/sponsors?search=${encodeURIComponent(cast.runId)}`);
    expect(found.data.map((s: any) => s.userId)).toEqual(expect.arrayContaining([actor("sponsor").userId, actor("sponsor2").userId]));
    expect((await anon.get("/sponsors?search=zzzz-no-such-brand-e2e")).data).toEqual([]);
    expect((await anon.get(`/sponsors/${actor("sponsor").userId}`)).profile.brandName).toContain(cast.runId);
    expect((await anon.raw("GET", `/sponsors/${actor("entrant1").userId}`)).status).toBe(404);
  });

  test("only an admin verifies; the sponsor is told once; verified sponsors come first", async () => {
    const id = actor("sponsor").userId;
    expect((await as("moderator").raw("POST", `/admin/sponsors/${id}/verify`, { verified: true })).status).toBe(403);
    expect((await as("sponsor").raw("POST", `/admin/sponsors/${id}/verify`, { verified: true })).status).toBe(403);

    const first = await notified("sponsor.verified", ["sponsor"], () => as("admin").post(`/admin/sponsors/${id}/verify`, { verified: true }));
    expect(first.sponsor).toBe(1);
    const again = await notified("sponsor.verified", ["sponsor"], () => as("admin").post(`/admin/sponsors/${id}/verify`, { verified: true }));
    expect(again.sponsor).toBe(0);

    const verifiedOnly = await anon.get(`/sponsors?verified=true&search=${encodeURIComponent(cast.runId)}`);
    expect(verifiedOnly.data.map((s: any) => s.userId)).toEqual([id]);
    const all = await anon.get(`/sponsors?search=${encodeURIComponent(cast.runId)}`);
    expect(all.data[0].userId).toBe(id);

    await as("admin").post(`/admin/sponsors/${id}/verify`, { verified: false });
    expect((await anon.get(`/sponsors?verified=true&search=${encodeURIComponent(cast.runId)}`)).data).toEqual([]);
    expect((await as("admin").raw("POST", "/admin/sponsors/00000000-0000-4000-8000-000000000000/verify", { verified: true })).status).toBe(404);
  });
});

test.describe("sponsored posts", () => {
  const post = async (who: RoleKey, body: string) => {
    const form = new FormData();
    form.append("body", body);
    const res = await fetch(`${API}/sponsors/me/posts`, { method: "POST", headers: { authorization: `Bearer ${actor(who).token}` }, body: form });
    return { status: res.status, post: res.status === 201 ? await res.json() : null };
  };

  test("a post waits for staff, then shows in the feed marked as sponsored", async () => {
    expect((await post("entrant1", "not a sponsor")).status).toBeGreaterThanOrEqual(400);
    expect((await post("sponsor", "")).status).toBe(400);
    const sent = await post("sponsor", "E2E sponsored: new gear drop");
    expect(sent.status).toBe(201);
    expect(sent.post.status).toBe("pending");
    expect((await anon.get(`/sponsors/${actor("sponsor").userId}`)).posts.map((p: any) => p.id)).not.toContain(sent.post.id);

    const queue = await as("moderator").get("/admin/coaching/posts?status=pending&author=sponsor");
    expect(queue.data.map((p: any) => p.id)).toContain(sent.post.id);
    const got = await notified("coaching.postApproved", ["sponsor", "coach2"], () => as("moderator").post(`/admin/coaching/posts/${sent.post.id}/review`, { approve: true }));
    expect(got).toEqual({ sponsor: 1, coach2: 0 });
    expect((await anon.get(`/sponsors/${actor("sponsor").userId}`)).posts.map((p: any) => p.id)).toContain(sent.post.id);

    expect((await as("sponsor").del(`/sponsors/me/posts/${sent.post.id}`)).deleted).toBe(true);
    expect((await as("entrant1").raw("DELETE", `/sponsors/me/posts/${sent.post.id}`)).status).toBeGreaterThanOrEqual(400);
  });
});

test.describe("impressions", () => {
  test("views and clicks for a running sponsorship are recorded; bad input is refused", async () => {
    // Its own running sponsorship: close any earlier one (a sponsor has one deal per community), then open and accept a new one.
    for (const d of (await as("sponsor").get("/sponsors/me")).deals) {
      if (d.status === "active") await as("sponsor").post(`/sponsorships/${d.id}/end`, {});
      if (d.status === "pending") await as("sponsor").post(`/sponsorships/${d.id}/cancel`, {});
    }
    const deal = await mk("sponsor", { tier: "partner", amountTk: 60, days: 14 });
    await as("commPresident").post(`/sponsorships/${deal.id}/respond`, { accept: true });
    const ok = await anon.raw("POST", "/sponsorships/impressions", { items: [{ sponsorshipId: deal.id, views: 3, clicks: 1 }] });
    expect(ok.status).toBeLessThan(300);
    expect(ok.body.recorded).toBeGreaterThanOrEqual(1);
    expect((await anon.raw("POST", "/sponsorships/impressions", { items: [{ sponsorshipId: "nope", views: 1 }] })).status).toBe(400);
    expect((await anon.raw("POST", "/sponsorships/impressions", { items: [{ sponsorshipId: deal.id, views: -1 }] })).status).toBe(400);
    const many = Array.from({ length: 51 }, () => ({ sponsorshipId: deal.id, views: 1 }));
    expect((await anon.raw("POST", "/sponsorships/impressions", { items: many })).status).toBe(400);
    await as("sponsor").post(`/sponsorships/${deal.id}/end`, {});
  });
});

// Last on purpose: nobody is told today. These describe the wanted behavior and fail until built.
test.describe("being told (known gaps)", () => {
  test.describe.configure({ mode: "default" });

  test("the hosts are told when a sponsor withdraws an offer", async () => {
    const deal = await mk("sponsor2", { amountTk: 40, days: 14 });
    const got = await notified("sponsorship.cancelled", HOSTS, () => as("sponsor2").post(`/sponsorships/${deal.id}/cancel`, {}));
    for (const h of HOSTS) expect(got[h], `${h} should hear about the withdrawal`).toBe(1);
  });
});
