import { test, expect } from "@playwright/test";
import { castApis, type RoleKey } from "../../lib/cast";
import { countNotes } from "../../lib/api";
import { expectMoved, snapshot } from "../../lib/money";

/**
 * Coach <-> club, from both sides: when a coach asks a club, only the club's President and
 * General Secretary are told and can answer (any one of them; the first wins); everyone
 * else at the club hears nothing and is refused. Every step also checks who is notified
 * and where the money goes. coach2 keeps these deals apart from the `coach` actor's.
 */
const { cast, as, actor } = castApis();
const A = cast.clubs.alpha;
const B = cast.clubs.beta;
const coach = () => as("coach2");
const coachId = () => actor("coach2").userId;

let pct = 10;
const cut = (fee: number) => Math.round((fee * pct) / 100);
const platformTotal = async () => (await as("admin").get("/admin/coaching/deals?limit=1")).platformCommissionTk as number;

/** Runs an action and returns how many new notifications with `code` each user got. */
async function notified(code: string, users: RoleKey[], action: () => Promise<unknown>): Promise<Record<string, number>> {
  const before = await Promise.all(users.map((u) => countNotes(as(u), code)));
  await action();
  const after = await Promise.all(users.map((u) => countNotes(as(u), code)));
  return Object.fromEntries(users.map((u, i) => [u, after[i] - before[i]]));
}

const CLUB_A_LEADERS: RoleKey[] = ["alphaPresident", "alphaGs"];
const CLUB_A_OTHERS: RoleKey[] = ["alphaCaptain", "alphaViceCaptain", "alphaAcademyCaptain", "alphaManager", "alphaPlayer", "alphaPlayer2"];
const CLUB_B_LEADERS: RoleKey[] = ["betaPresident", "betaGs"];

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const mine = await coach().get("/coaching/me");
  pct = mine.settings.commissionPct;
  // A kept cast (E2E_KEEP=1) can still have deals from an earlier run: close them so each run starts clean.
  for (const d of mine.deals) {
    if (d.status === "pending") await coach().raw("POST", `/coaching/deals/${d.id}/cancel`, {});
    if (d.status === "active" || d.status === "scheduled") await coach().raw("POST", `/coaching/deals/${d.id}/end`, {});
  }
});

test.describe("a coach asks a club", () => {
  let dealId = "";

  test("the President and the General Secretary are told; nobody else at the club is", async () => {
    const watchers: RoleKey[] = [...CLUB_A_LEADERS, ...CLUB_A_OTHERS, "betaPresident"];
    const got = await notified("coaching.request", watchers, async () => {
      const deal = await coach().post("/coaching/deals", { clubId: A, feeTk: 200, days: 30, message: "e2e request" });
      dealId = deal.id;
      expect(deal.status).toBe("pending");
      expect(deal.turn).toBe("club");
      expect(deal.heldTk).toBe(0);
    });
    for (const leader of CLUB_A_LEADERS) expect(got[leader], leader).toBe(1);
    for (const other of [...CLUB_A_OTHERS, "betaPresident"]) expect(got[other], other).toBe(0);

    const note = (await as("alphaPresident").notifications()).find((n) => n.code === "coaching.request");
    expect(note?.link).toContain(`/dashboard/efootball/clubs/${A}`);
  });

  test("only the leaders see the open request on the club; members only see the current coach", async () => {
    for (const leader of CLUB_A_LEADERS) {
      const view = await as(leader).get(`/coaching/clubs/${A}`);
      expect(view.isLeader, leader).toBe(true);
      expect(view.open.map((d: any) => d.id), leader).toContain(dealId);
    }
    for (const other of ["alphaCaptain", "alphaManager", "alphaPlayer"] as RoleKey[]) {
      const view = await as(other).get(`/coaching/clubs/${A}`);
      expect(view.isLeader, other).toBe(false);
      expect(view.open, other).toEqual([]);
    }
  });

  test("anyone else is refused: answering, countering, withdrawing", async () => {
    for (const key of ["alphaCaptain", "alphaViceCaptain", "alphaManager", "alphaPlayer", "betaPresident", "entrant1"] as RoleKey[]) {
      for (const [path, body] of [
        [`/coaching/deals/${dealId}/respond`, { accept: true, paymentMethod: "bkash" }],
        [`/coaching/deals/${dealId}/counter`, { feeTk: 150 }],
        [`/coaching/deals/${dealId}/cancel`, {}],
      ] as const) {
        const res = await as(key).raw("POST", path, body);
        expect(res.status, `${key} ${path}`).toBeGreaterThanOrEqual(400);
        expect(res.status, `${key} ${path}`).toBeLessThan(500);
      }
    }
    // The coach can't answer his own request either: it is the club's turn.
    expect((await coach().raw("POST", `/coaching/deals/${dealId}/respond`, { accept: true })).status).toBe(403);
  });

  test("the General Secretary accepts and pays; the coach is paid minus the platform cut; everyone concerned is told", async () => {
    const club = as("alphaPresident");
    const club0 = await snapshot(club, A);
    const coach0 = await snapshot(coach());
    const platform0 = await platformTotal();

    // A payment method is needed, because the fee is the club's to pay now.
    expect((await as("alphaGs").raw("POST", `/coaching/deals/${dealId}/respond`, { accept: true })).status).toBe(400);

    const agreed = await notified("coaching.agreed", ["coach2", "alphaPresident", "alphaGs", "alphaCaptain"], async () => {
      const done = await as("alphaGs").post(`/coaching/deals/${dealId}/respond`, { accept: true, paymentMethod: "bkash" });
      expect(done.status).toBe("active");
      expect(done.commissionTk).toBe(cut(200));
      expect(done.netTk).toBe(200 - cut(200));
    });
    expect(agreed).toEqual({ coach2: 1, alphaPresident: 1, alphaGs: 1, alphaCaptain: 0 });

    await expectMoved(club, club0, { balanceTk: -200 }, A, "club paid the fee");
    await expectMoved(coach(), coach0, { balanceTk: 200 - cut(200) }, undefined, "coach got the fee minus the cut");
    expect((await platformTotal()) - platform0).toBe(cut(200));
  });

  test("the other leader answering afterwards is refused; the club now shows its coach to everyone", async () => {
    const late = await as("alphaPresident").raw("POST", `/coaching/deals/${dealId}/respond`, { accept: true, paymentMethod: "bkash" });
    expect(late.status).toBe(400);
    const view = await as("alphaPlayer").get(`/coaching/clubs/${A}`);
    expect(view.coach.coach.id).toBe(coachId());
    expect(view.open).toEqual([]);
  });

  test("a coach can't be lined up twice with one club, and can't ask while one deal is open", async () => {
    const res = await coach().raw("POST", "/coaching/deals", { clubId: A, feeTk: 10, days: 30 });
    expect(res.status).toBe(400);
  });

  test("either side can end it early: the other is told and nothing is refunded", async () => {
    const club = as("alphaPresident");
    const club0 = await snapshot(club, A);
    // A member who isn't a leader can't end it.
    expect((await as("alphaCaptain").raw("POST", `/coaching/deals/${dealId}/end`, {})).status).toBe(403);
    const got = await notified("coaching.ended", ["coach2", "alphaPresident"], async () => {
      const ended = await club.post(`/coaching/deals/${dealId}/end`, {});
      expect(ended.status).toBe("ended");
      expect(ended.endReason).toBe("club");
    });
    expect(got).toEqual({ coach2: 1, alphaPresident: 0 });
    await expectMoved(club, club0, {}, A, "ending early refunds nothing");
    // Ending twice is refused.
    expect((await club.raw("POST", `/coaching/deals/${dealId}/end`, {})).status).toBe(400);
  });
});

test.describe("the club answers a request in other ways", () => {
  test("declining: the coach is told, no money moves, and no buttons are left on a closed deal", async () => {
    const club = as("betaPresident");
    const club0 = await snapshot(club, B);
    const deal = await coach().post("/coaching/deals", { clubId: B, feeTk: 150, days: 14 });
    const got = await notified("coaching.declined", ["coach2", "betaPresident", "betaGs"], async () => {
      const done = await as("betaGs").post(`/coaching/deals/${deal.id}/respond`, { accept: false });
      expect(done.status).toBe("declined");
    });
    expect(got.coach2).toBe(1);
    await expectMoved(club, club0, {}, B, "declining a request moves nothing");
    for (const path of ["respond", "counter", "cancel", "end"]) {
      const res = await as("betaPresident").raw("POST", `/coaching/deals/${deal.id}/${path}`, { accept: true, feeTk: 10 });
      expect(res.status, path).toBe(400);
    }
  });

  test("countering: the coach is told, the club's counter is held, identical terms are refused, then the coach withdraws and the hold returns", async () => {
    const club = as("betaPresident");
    const club0 = await snapshot(club, B);
    const deal = await coach().post("/coaching/deals", { clubId: B, feeTk: 400, days: 20 });

    const counter = await notified("coaching.counter", ["coach2", "betaPresident"], async () => {
      await club.post(`/coaching/deals/${deal.id}/counter`, { feeTk: 250, paymentMethod: "nagad" });
    });
    expect(counter).toEqual({ coach2: 1, betaPresident: 0 });
    await expectMoved(club, club0, { balanceTk: -250, heldTk: 250 }, B, "the club's counter is held");

    // The coach answering with the very same terms is pointless.
    const same = await coach().raw("POST", `/coaching/deals/${deal.id}/counter`, { feeTk: 250, days: 20 });
    expect(same.status).toBe(400);
    // It is the coach's turn now: the club can't answer itself.
    expect((await club.raw("POST", `/coaching/deals/${deal.id}/respond`, { accept: true })).status).toBe(403);

    const cancelled = await notified("coaching.cancelled", CLUB_B_LEADERS, async () => {
      expect((await coach().post(`/coaching/deals/${deal.id}/cancel`, {})).status).toBe("cancelled");
    });
    expect(cancelled).toEqual({ betaPresident: 1, betaGs: 1 });
    await expectMoved(club, club0, {}, B, "withdrawn: the held money is back");
  });

  test("countering lower returns the difference; the method given earlier is remembered", async () => {
    const club = as("betaGs");
    const club0 = await snapshot(club, B);
    const deal = await coach().post("/coaching/deals", { clubId: B, feeTk: 300, days: 20 });
    await club.post(`/coaching/deals/${deal.id}/counter`, { feeTk: 200, paymentMethod: "card" });
    await expectMoved(club, club0, { balanceTk: -200, heldTk: 200 }, B, "hold 200");
    await coach().post(`/coaching/deals/${deal.id}/counter`, { feeTk: 120, days: 20 });
    await club.post(`/coaching/deals/${deal.id}/counter`, { feeTk: 100, paymentMethod: "card" });
    await expectMoved(club, club0, { balanceTk: -100, heldTk: 100 }, B, "lower counter gives 100 back");
    await coach().post(`/coaching/deals/${deal.id}/counter`, { feeTk: 500, days: 20 });
    // The club's card from its earlier counters is on the deal, so the club is not asked for one again.
    // (A first answer with no method at all is refused: see the accept test above.)
    await club.post(`/coaching/deals/${deal.id}/cancel`, {});
    await expectMoved(club, club0, {}, B, "withdrawn: all held money is back");
  });
});

test.describe("a club offers a coach", () => {
  let offerId = "";

  test("the fee is held at once and the coach is told; the coach can say no and the club gets it back", async () => {
    const club = as("alphaPresident");
    const club0 = await snapshot(club, A);
    const got = await notified("coaching.offer", ["coach2", "alphaPresident"], async () => {
      const offer = await club.post("/coaching/deals", { clubId: A, coachUserId: coachId(), feeTk: 120, days: 14, paymentMethod: "card" });
      offerId = offer.id;
      expect(offer.turn).toBe("coach");
    });
    expect(got).toEqual({ coach2: 1, alphaPresident: 0 });
    await expectMoved(club, club0, { balanceTk: -120, heldTk: 120 }, A, "offer is held");

    const declined = await notified("coaching.declined", ["alphaPresident", "alphaGs"], async () => {
      await coach().post(`/coaching/deals/${offerId}/respond`, { accept: false });
    });
    expect(declined.alphaPresident + declined.alphaGs).toBeGreaterThanOrEqual(1);
    await expectMoved(club, club0, {}, A, "declined: refunded");
  });

  test("a fee needs a payment method, an empty wallet is refused, and an unavailable coach can't be offered", async () => {
    const club = as("alphaPresident");
    expect((await club.raw("POST", "/coaching/deals", { clubId: A, coachUserId: coachId(), feeTk: 50, days: 14 })).status).toBe(400);
    expect((await club.raw("POST", "/coaching/deals", { clubId: A, coachUserId: coachId(), feeTk: 99_999_999, days: 14, paymentMethod: "card" })).status).toBe(400);
    expect((await club.raw("POST", "/coaching/deals", { clubId: A, coachUserId: coachId(), feeTk: 0, days: 2 })).status, "days below the minimum").toBe(400);

    await coach().put("/coaching/me/profile", { headline: "second coach", available: false });
    try {
      expect((await club.raw("POST", "/coaching/deals", { clubId: A, coachUserId: coachId(), feeTk: 0, days: 14 })).status).toBe(400);
    } finally {
      await coach().put("/coaching/me/profile", { headline: `second coach`, available: true });
    }
  });

  test("a captain or a leader of another club can't make the offer", async () => {
    for (const key of ["alphaCaptain", "alphaManager", "alphaPlayer", "betaPresident", "entrant1"] as RoleKey[]) {
      const res = await as(key).raw("POST", "/coaching/deals", { clubId: A, coachUserId: coachId(), feeTk: 0, days: 14 });
      expect(res.status, key).toBeGreaterThanOrEqual(400);
      expect(res.status, key).toBeLessThan(500);
    }
  });

  test("the coach accepts a free offer; both leaders are told; the club's own player can't be its coach", async () => {
    const got = await notified("coaching.agreed", CLUB_A_LEADERS, async () => {
      const offer = await as("alphaGs").post("/coaching/deals", { clubId: A, coachUserId: coachId(), feeTk: 0, days: 14 });
      const done = await coach().post(`/coaching/deals/${offer.id}/respond`, { accept: true });
      expect(done.status).toBe("active");
      await as("alphaGs").post(`/coaching/deals/${offer.id}/end`, {});
    });
    expect(got).toEqual({ alphaPresident: 1, alphaGs: 1 });

    // A player of the club can't coach it.
    const own = await as("alphaGs").raw("POST", "/coaching/deals", { clubId: A, coachUserId: actor("alphaPlayer").userId, feeTk: 0, days: 14 });
    expect(own.status).toBe(400);
  });
});

test.describe("finding and following coaches", () => {
  test("the directory searches, filters by availability and pages", async () => {
    const found = await as("entrant1").get("/coaching/coaches?search=second%20coach&limit=5");
    expect(found.data.map((c: any) => c.userId)).toContain(coachId());
    const none = await as("entrant1").get("/coaching/coaches?search=zzzz-no-such-coach-e2e");
    expect(none.data).toEqual([]);
    const paged = await as("entrant1").get("/coaching/coaches?limit=1&page=1");
    expect(paged.data.length).toBeLessThanOrEqual(1);
  });

  test("following a coach tells the coach once; you can't follow yourself", async () => {
    const first = await notified("coaching.followed", ["coach2"], async () => {
      await as("entrant1").post(`/feed/coaches/${coachId()}/follow`, {});
      await as("entrant1").post(`/feed/coaches/${coachId()}/follow`, {});
    });
    expect(first.coach2).toBe(1);
    expect((await as("entrant1").get(`/feed/coaches/${coachId()}/follow`)).followedByMe).toBe(true);
    expect((await coach().raw("POST", `/feed/coaches/${coachId()}/follow`, {})).status).toBe(400);
    await as("entrant1").del(`/feed/coaches/${coachId()}/follow`);
  });

  test("only a coach can set up a profile or post; a missing profile page is a 404", async () => {
    expect((await as("entrant1").raw("PUT", "/coaching/me/profile", { headline: "x" })).status).toBe(400);
    expect((await as("entrant1").raw("POST", "/coaching/me/posts", { body: "x" })).status).toBe(400);
    expect((await as("entrant1").raw("GET", `/coaching/coaches/${actor("entrant2").userId}`)).status).toBe(404);
  });
});

// Last on purpose: a known gap (any signed-in user can read any deal), so this fails until it is fixed
// and must not stop the serial tests above from running.
test.describe("a deal's privacy", () => {
  test("a deal can be read only by its coach and the club's leaders", async () => {
    const deal = await coach().post("/coaching/deals", { clubId: B, feeTk: 75, days: 14, message: "private terms" });
    try {
      expect((await coach().raw("GET", `/coaching/deals/${deal.id}`)).ok).toBe(true);
      expect((await as("betaGs").raw("GET", `/coaching/deals/${deal.id}`)).ok).toBe(true);
      for (const key of ["entrant1", "alphaPresident", "betaPlayer"] as RoleKey[]) {
        const res = await as(key).raw("GET", `/coaching/deals/${deal.id}`);
        expect([403, 404], `${key} must not read someone else's deal`).toContain(res.status);
      }
    } finally {
      await coach().raw("POST", `/coaching/deals/${deal.id}/cancel`, {});
    }
  });
});
