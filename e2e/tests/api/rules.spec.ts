import { test, expect } from "@playwright/test";
import { Api } from "../../lib/api";
import { signUp } from "../../lib/actors";
import { castApis, track, type Actor } from "../../lib/cast";
import { expectMoved, snapshot } from "../../lib/money";

/**
 * Business rules, on two fresh clubs (Gamma, Delta) and their own players, so the
 * other suites' clubs are untouched:
 * one club per player, contracts and their fee, leaders can't move, leaving rules,
 * offer expiry, buyout rules, moves held up by a tournament, cup-tied loans, roster size.
 */
const { cast, as, actor } = castApis();
const day = 24 * 3600_000;
const inDays = (d: number) => new Date(Date.now() + d * day).toISOString();

test.describe.configure({ mode: "serial" });

type World = {
  gamma: string;
  delta: string;
  p: Record<string, Actor>;
};
let w: World;
const api = (key: string) => new Api(w.p[key].token);

/** The player (or, on his turn, the club) accepts until the deal is done or scheduled. */
async function acceptAll(offerId: string, player: Api, club: Api, payer?: Api) {
  for (let i = 0; i < 4; i++) {
    const view = await club.get(`/transfers/offers/${offerId}/bids`).catch(() => null);
    void view;
    const res = await player.raw("POST", `/transfers/offers/${offerId}/respond`, { accept: true });
    if (res.ok && ["completed", "accepted", "scheduled"].includes((res.body as any).status)) return res.body;
    const res2 = await (payer ?? club).raw("POST", `/transfers/offers/${offerId}/respond`, { accept: true, paymentMethod: "bkash" });
    if (res2.ok && ["completed", "accepted", "scheduled"].includes((res2.body as any).status)) return res2.body;
  }
  throw new Error(`offer ${offerId} never completed`);
}

const squadIds = async (clubId: string) =>
  ((await as("freeAgent2").get(`/transfers/clubs/${clubId}`)).squad as Array<{ userId: string }>).map((m) => m.userId);

/** A free agent signed with 0 tk: he joins the club. */
async function sign(leader: string, clubId: string, player: string) {
  const offer = await api(leader).post("/transfers/offers", { clubId, playerUserId: w.p[player].userId, amountTk: 0 });
  await api(player).post(`/transfers/offers/${offer.id}/respond`, { accept: true });
}

test.beforeAll(async () => {
  test.setTimeout(5 * 60_000);
  const keys = ["gP", "g1", "g2", "g3", "g4", "g5", "dP", "d1", "d2", "fa", "fb"];
  const p: Record<string, Actor> = {};
  for (const k of keys) p[k] = await signUp(cast.runId, `r${k.toLowerCase()}`, `Rules ${k}`);
  w = { gamma: "", delta: "", p };
  const club = async (leader: string, label: string, maxRoster: number) =>
    (
      await api(leader).post("/clubs", {
        name: `E2E ${cast.runId} ${label}`,
        color: "#a855f7",
        initials: label.slice(0, 2).toUpperCase(),
        joinPolicy: "approval",
        minRoster: 1,
        maxRoster,
      })
    ).id as string;
  w.gamma = await club("gP", "Gamma", 30);
  // Delta is kept small to check the roster limit.
  w.delta = await club("dP", "Delta", 6);
  for (const [leader, clubId] of [["gP", w.gamma], ["dP", w.delta]] as const) {
    await api(leader).topUp(clubId);
    await api(leader).topUp(clubId);
  }
  for (const k of ["g1", "g2", "g3", "g4", "g5"]) await sign("gP", w.gamma, k);
  for (const k of ["d1", "d2"]) await sign("dP", w.delta, k);
});

// ------------------------------------------------------------------ one club

test.describe("a player belongs to one club only", () => {
  test("a free agent with two offers joins one club; the other offer is cancelled and refunded", async () => {
    const d0 = await snapshot(api("dP"), w.delta);
    const fromGamma = await api("gP").post("/transfers/offers", { clubId: w.gamma, playerUserId: w.p.fa.userId, amountTk: 10, paymentMethod: "bkash" });
    const fromDelta = await api("dP").post("/transfers/offers", { clubId: w.delta, playerUserId: w.p.fa.userId, amountTk: 15, paymentMethod: "bkash" });
    await expectMoved(api("dP"), d0, { balanceTk: -15, heldTk: 15 }, w.delta, "Delta's offer held");

    await api("fa").post(`/transfers/offers/${fromGamma.id}/respond`, { accept: true });

    const second = await api("fa").raw("POST", `/transfers/offers/${fromDelta.id}/respond`, { accept: true });
    expect(second.status, "the second club's offer can't be accepted").toBe(400);
    const deltaOffer = (await api("dP").get(`/transfers/clubs/${w.delta}`)).outgoing?.find((o: any) => o.id === fromDelta.id);
    expect(deltaOffer?.status ?? "cancelled").toBe("cancelled");
    await expectMoved(api("dP"), d0, {}, w.delta, "Delta refunded");

    expect(await squadIds(w.gamma)).toContain(w.p.fa.userId);
    expect(await squadIds(w.delta)).not.toContain(w.p.fa.userId);
    const status = await as("freeAgent2").get(`/transfers/players/${w.p.fa.userId}`);
    expect(status.clubId).toBe(w.gamma);
  });

  test("a contracted player can't propose himself to another club", async () => {
    const res = await api("g4").raw("POST", "/transfers/offers", { clubId: w.delta, amountTk: 0 });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/under contract/i);
  });

  test("another club can only buy him out, at his current fee, whatever amount it offers", async () => {
    const status = await as("freeAgent2").get(`/transfers/players/${w.p.g3.userId}`);
    const offer = await api("dP").post("/transfers/offers", { clubId: w.delta, playerUserId: w.p.g3.userId, amountTk: 1, paymentMethod: "bkash" });
    expect(offer.kind).toBe("buyout");
    expect(offer.amountTk).toBe(status.contract.feeTk);
    // A buyout's price is fixed.
    const counter = await api("g3").raw("POST", `/transfers/offers/${offer.id}/counter`, { amountTk: offer.amountTk + 50 });
    expect(counter.status).toBe(400);
    expect(JSON.stringify(counter.body)).toMatch(/can't be countered/i);
    await api("dP").post(`/transfers/offers/${offer.id}/cancel`, {});
  });

  test("after a buyout he is in the new squad only, with a new contract", async () => {
    const gamma0 = await snapshot(api("gP"), w.gamma);
    const offer = await api("dP").post("/transfers/offers", { clubId: w.delta, playerUserId: w.p.g3.userId, amountTk: 0, paymentMethod: "bkash" });
    await acceptAll(offer.id, api("g3"), api("gP"), api("dP"));
    expect(await squadIds(w.delta)).toContain(w.p.g3.userId);
    expect(await squadIds(w.gamma)).not.toContain(w.p.g3.userId);
    const status = await as("freeAgent2").get(`/transfers/players/${w.p.g3.userId}`);
    expect(status.clubId).toBe(w.delta);
    expect(status.contract.clubId).toBe(w.delta);
    expect(status.contract.locked).toBe(true);
    await expectMoved(api("gP"), gamma0, { balanceTk: offer.amountTk }, w.gamma, "the old club is paid");
  });

  test("an offer can't be countered with the amount already on the table", async () => {
    const offer = await api("gP").post("/transfers/offers", { clubId: w.gamma, playerUserId: actor("freeAgent2").userId, amountTk: 5, paymentMethod: "bkash" });
    const res = await as("freeAgent2").raw("POST", `/transfers/offers/${offer.id}/counter`, { amountTk: 5 });
    expect(res.status).toBe(400);
    await api("gP").post(`/transfers/offers/${offer.id}/cancel`, {});
  });

  test("his own club's offer to a member is a renewal", async () => {
    const offer = await api("gP").post("/transfers/offers", { clubId: w.gamma, playerUserId: w.p.g5.userId, amountTk: 0 });
    expect(offer.kind).toBe("renewal");
    await api("gP").post(`/transfers/offers/${offer.id}/cancel`, {});
  });
});

// ------------------------------------------------------------------ contracts

test.describe("contracts", () => {
  test("the lock and the fee follow the transfer settings", async () => {
    const { settings } = await as("freeAgent2").get("/transfers/me");
    const { contract } = await as("freeAgent2").get(`/transfers/players/${w.p.g4.userId}`);
    const start = new Date(contract.startAt).getTime();
    const end = new Date(contract.lockEndsAt).getTime();
    expect(Math.round((end - start) / day)).toBe(contract.lockDays);
    expect(contract.lockDays).toBe(settings.lockDays);
    // fee = frozen part + fixed part scaled by the days left on the lock (counted up).
    const daysLeft = Math.max(0, Math.ceil((end - Date.now()) / day));
    expect(contract.daysLeft).toBe(daysLeft);
    expect(contract.feeTk).toBe(contract.frozenTk + Math.round((contract.baseTk * Math.min(contract.lockDays, daysLeft)) / contract.lockDays));
    expect(contract.locked).toBe(true);
  });

  test("an offer expires after the configured number of days", async () => {
    const { settings } = await as("freeAgent2").get("/transfers/me");
    const before = Date.now();
    const offer = await api("gP").post("/transfers/offers", { clubId: w.gamma, playerUserId: actor("freeAgent2").userId, amountTk: 0 });
    const expires = new Date(offer.expiresAt).getTime();
    expect(Math.abs(expires - (before + settings.offerExpiryDays * day))).toBeLessThan(60_000);
    await api("gP").post(`/transfers/offers/${offer.id}/cancel`, {});
  });
});

// -------------------------------------------------------------------- leaders

test.describe("leaders and leaving", () => {
  test("a club President can't be transferred", async () => {
    const res = await api("dP").raw("POST", "/transfers/offers", { clubId: w.delta, playerUserId: w.p.gP.userId, amountTk: 0 });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/Hand over the role/i);
  });

  test("a community President or Vice President can't join a club", async () => {
    for (const key of ["commPresident", "commVicePresident"] as const) {
      const res = await api("gP").raw("POST", "/transfers/offers", { clubId: w.gamma, playerUserId: actor(key).userId, amountTk: 0 });
      expect(res.status, key).toBe(400);
      expect(JSON.stringify(res.body), key).toMatch(/can't join clubs/i);
    }
  });

  test("the President can't leave the club without handing over", async () => {
    const res = await api("gP").raw("POST", `/clubs/${w.gamma}/leave`, {});
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/cannot leave the club/i);
  });

  test("a player can't leave while his contract is locked", async () => {
    const res = await api("g5").raw("POST", `/clubs/${w.gamma}/leave`, {});
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/under contract/i);
    expect(await squadIds(w.gamma)).toContain(w.p.g5.userId);
  });
});

// ------------------------------------------------------- tournament commitment

test.describe("a move waits for the club's tournament", () => {
  let tournamentId = "";

  test("a deal agreed while he plays a tournament for his club is scheduled, not done", async () => {
    // Gamma hosts a club tournament starting within the commitment window; g2 enters it.
    const t = await api("gP").post("/tournaments", { name: `E2E ${cast.runId} Gamma Club Cup`, type: "pvp", hostClubId: w.gamma, maxParticipants: 4, startAt: inDays(1) });
    tournamentId = t.id;
    track("tournaments", t.id);
    await api("g2").post(`/tournaments/${t.id}/join`, {});

    const offer = await api("dP").post("/transfers/offers", { clubId: w.delta, playerUserId: w.p.g2.userId, amountTk: 0, paymentMethod: "bkash" });
    const done = await acceptAll(offer.id, api("g2"), api("gP"), api("dP"));
    expect((done as any).status).toBe("scheduled");
    expect(await squadIds(w.gamma)).toContain(w.p.g2.userId);
    expect(await squadIds(w.delta)).not.toContain(w.p.g2.userId);

    // Nothing else can be agreed for him meanwhile.
    const other = await api("gP").raw("POST", "/transfers/loans", { clubId: w.gamma, playerUserId: w.p.g2.userId, otherClubId: w.delta, feeTk: 0, matches: 1, maxDays: 7 });
    expect(other.status).toBe(400);
  });

  test("when the tournament is gone, the scheduled move completes by itself", async () => {
    test.setTimeout(3 * 60_000);
    await api("gP").del(`/tournaments/${tournamentId}`);
    // The transfer job runs every minute.
    await expect
      .poll(async () => (await squadIds(w.delta)).includes(w.p.g2.userId), { timeout: 150_000, intervals: [5_000] })
      .toBe(true);
    expect(await squadIds(w.gamma)).not.toContain(w.p.g2.userId);
  });
});

// ------------------------------------------------------------------ cup-tied

test.describe("cup-tied loans", () => {
  test("a loaned player can't play for the borrower in a tournament he entered for his own club", async () => {
    // A CvC general tournament (4 starters) starting after the commitment window, so the loan can start.
    const t = await as("organizer").post("/tournaments", {
      name: `E2E ${cast.runId} Cup-Tied CvC`,
      type: "cvc",
      general: true,
      preset: "custom",
      startersCount: 4,
      subsCount: 0,
      maxParticipants: 4,
      startAt: inDays(6),
    });
    track("tournaments", t.id);
    const lineup = (keys: string[]) => ({
      starters: keys.map((k) => ({ profileId: w.p[k].profileId, name: w.p[k].name })),
      substitutes: [],
    });
    await api("gP").post(`/tournaments/${t.id}/join`, { clubId: w.gamma, lineup: lineup(["gP", "g1", "g4", "g5"]) });

    const loan = await api("dP").post("/transfers/loans", { clubId: w.delta, playerUserId: w.p.g1.userId, feeTk: 0, matches: 2, maxDays: 30 });
    const started = await api("gP").post(`/transfers/loans/${loan.id}/respond`, { accept: true });
    expect(started.status).toBe("active");

    const res = await api("dP").raw("POST", `/tournaments/${t.id}/join`, { clubId: w.delta, lineup: lineup(["dP", "d1", "d2", "g1"]) });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/On loan and already entered/i);

    // He moved to the borrower for the loan, so he's out of his club's lineup there too:
    // he sits that cup out and plays his loan matches in other tournaments.
    const tv = await api("gP").get(`/tournaments/${t.id}`);
    const gammaEntry = tv.participants.find((x: any) => x.clubId === w.gamma);
    expect(gammaEntry.lineup.starters.map((s: any) => s.profileId)).not.toContain(w.p.g1.profileId);
  });
});

// ------------------------------------------------------------------ roster

test.describe("roster limit", () => {
  test("a club at its maximum roster can't sign or borrow anyone", async () => {
    // Fill Delta (max 6) up to its limit with fresh free agents.
    let size = (await squadIds(w.delta)).length;
    let n = 0;
    while (size < 6) {
      const extra = await signUp(cast.runId, `rfill${n++}`, `Rules Filler ${n}`);
      w.p[extra.key] = extra;
      await sign("dP", w.delta, extra.key);
      size = (await squadIds(w.delta)).length;
    }
    expect(size).toBe(6);

    const offer = await api("dP").raw("POST", "/transfers/offers", { clubId: w.delta, playerUserId: w.p.fb.userId, amountTk: 0 });
    expect(offer.status, "signing into a full club").toBe(400);
    expect(JSON.stringify(offer.body)).toMatch(/is full \(6 of 6 players\)/);

    const loan = await api("dP").raw("POST", "/transfers/loans", { clubId: w.delta, playerUserId: w.p.g5.userId, feeTk: 0, matches: 1, maxDays: 7 });
    expect(loan.status, "borrowing into a full club").toBe(400);
    expect(JSON.stringify(loan.body)).toMatch(/is full/);

    // A free agent proposing himself to a full club is refused too.
    const proposal = await api("fb").raw("POST", "/transfers/offers", { clubId: w.delta, amountTk: 0 });
    expect(proposal.status).toBe(400);
  });

  test("an offer made while there was room is refused at signing once the club is full", async () => {
    // Gamma (max 30) has room: make the offer, then shrink the limit to the current squad.
    const offer = await api("gP").post("/transfers/offers", { clubId: w.gamma, playerUserId: w.p.fb.userId, amountTk: 0 });
    const size = (await squadIds(w.gamma)).length;
    await api("gP").patch(`/clubs/${w.gamma}`, { maxRoster: size });
    const res = await api("fb").raw("POST", `/transfers/offers/${offer.id}/respond`, { accept: true });
    expect(res.status).toBe(400);
    expect(await squadIds(w.gamma)).not.toContain(w.p.fb.userId);
    await api("gP").patch(`/clubs/${w.gamma}`, { maxRoster: 30 });
  });
});
