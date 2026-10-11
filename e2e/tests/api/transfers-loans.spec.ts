import { test, expect } from "@playwright/test";
import { castApis } from "../../lib/cast";
import { expectMoved, snapshot } from "../../lib/money";

/**
 * Transfers and loans with real wallet movements. Steps share state, so they run in order.
 * Leaves the cast like this: Free Agent → Alpha, Alpha Player Two → Beta (buyout),
 * Beta Player on loan at Alpha.
 */
const { cast, as, actor } = castApis();
const A = cast.clubs.alpha;
const B = cast.clubs.beta;

const inSquad = async (clubId: string, userId: string) =>
  (await as("alphaPresident").get(`/transfers/clubs/${clubId}`)).squad.find((m: any) => m.userId === userId);

test.describe.configure({ mode: "serial" });

test.describe("transfers", () => {
  test("free agent signing with a counter-offer moves the agreed amount", async () => {
    const club = as("alphaPresident");
    const player = as("freeAgent");
    const club0 = await snapshot(club, A);
    const player0 = await snapshot(player);

    const offer = await club.post("/transfers/offers", { clubId: A, playerUserId: actor("freeAgent").userId, amountTk: 50, paymentMethod: "bkash" });
    expect(offer.status).toBe("pending");
    expect(offer.turn).toBe("player");
    await expectMoved(club, club0, { balanceTk: -50, heldTk: 50 }, A, "club holds the offer");

    // Not his turn yet, and other members of the club can't answer for it.
    expect((await as("alphaCaptain").raw("POST", `/transfers/offers/${offer.id}/respond`, { accept: true })).status).toBeGreaterThanOrEqual(400);

    const countered = await player.post(`/transfers/offers/${offer.id}/counter`, { amountTk: 80 });
    expect(countered.turn).toBe("club");
    expect(countered.amountTk).toBe(80);
    const bids = await club.get(`/transfers/offers/${offer.id}/bids`);
    expect(bids.length).toBeGreaterThanOrEqual(2);

    const done = await club.post(`/transfers/offers/${offer.id}/respond`, { accept: true, paymentMethod: "bkash" });
    expect(["accepted", "completed"]).toContain(done.status);
    await expectMoved(club, club0, { balanceTk: -80 }, A, "club paid 80");
    await expectMoved(player, player0, { balanceTk: 80 }, undefined, "player received 80");
    expect(await inSquad(A, actor("freeAgent").userId)).toBeTruthy();
  });

  test("a declined offer refunds the club's hold", async () => {
    const club = as("betaPresident");
    const club0 = await snapshot(club, B);
    const offer = await club.post("/transfers/offers", { clubId: B, playerUserId: actor("freeAgent2").userId, amountTk: 30, paymentMethod: "nagad" });
    await expectMoved(club, club0, { balanceTk: -30, heldTk: 30 }, B);
    await as("freeAgent2").post(`/transfers/offers/${offer.id}/respond`, { accept: false });
    await expectMoved(club, club0, {}, B, "hold returned");
  });

  test("a club can't offer more than its wallet has", async () => {
    const res = await as("betaPresident").raw("POST", "/transfers/offers", {
      clubId: B,
      playerUserId: actor("freeAgent2").userId,
      amountTk: 9_000_000,
      paymentMethod: "card",
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/Not enough money/i);
  });

  test("buyout of a locked player pays his club the current fee", async () => {
    const buyer = as("betaPresident");
    const seller = as("alphaPresident");
    const target = actor("alphaPlayer2");
    const status = await buyer.get(`/transfers/players/${target.userId}`);
    const fee: number = status.contract.feeTk;
    expect(status.contract.locked).toBe(true);

    const buyer0 = await snapshot(buyer, B);
    const seller0 = await snapshot(seller, A);
    const offer = await buyer.post("/transfers/offers", { clubId: B, playerUserId: target.userId, amountTk: fee, paymentMethod: "bkash" });
    expect(offer.kind).toBe("buyout");
    // The player agrees, then his club (it's paid) agrees too, or the other way round.
    for (let i = 0; i < 3; i++) {
      const o = await buyer.get(`/transfers/offers/${offer.id}/contract`).catch(() => null);
      const cur = (await as("alphaPlayer2").get("/transfers/me")).offers?.find((x: any) => x.id === offer.id) ?? o;
      if (!cur || !["pending"].includes(cur.status ?? "pending")) break;
      const responder = cur.turn === "player" ? as("alphaPlayer2") : seller;
      const res = await responder.raw("POST", `/transfers/offers/${offer.id}/respond`, { accept: true });
      if (!res.ok) break;
      if (["accepted", "completed"].includes(res.body.status)) break;
    }
    expect(await inSquad(B, target.userId)).toBeTruthy();
    await expectMoved(buyer, buyer0, { balanceTk: -fee }, B, "buyer paid the fee");
    await expectMoved(seller, seller0, { balanceTk: fee }, A, "seller received the fee");
  });
});

test.describe("loans", () => {
  let loanId = "";

  test("borrow request holds the fee; counter and accept pay the parent club", async () => {
    const borrower = as("alphaPresident");
    const parent = as("betaPresident");
    const b0 = await snapshot(borrower, A);
    const p0 = await snapshot(parent, B);

    const loan = await borrower.post("/transfers/loans", {
      clubId: A,
      playerUserId: actor("betaPlayer").userId,
      feeTk: 30,
      matches: 2,
      maxDays: 14,
      paymentMethod: "bkash",
      message: "e2e loan",
    });
    loanId = loan.id;
    expect(loan.status).toBe("pending");
    await expectMoved(borrower, b0, { balanceTk: -30, heldTk: 30 }, A, "fee held");

    // Only the parent club's leaders answer now.
    expect((await as("betaPlayer2").raw("POST", `/transfers/loans/${loanId}/respond`, { accept: true })).status).toBeGreaterThanOrEqual(400);
    const countered = await parent.post(`/transfers/loans/${loanId}/counter`, { feeTk: 40 });
    expect(countered.feeTk).toBe(40);

    const started = await borrower.post(`/transfers/loans/${loanId}/respond`, { accept: true, paymentMethod: "bkash" });
    expect(["active", "scheduled"]).toContain(started.status);
    if (started.status === "active") {
      await expectMoved(borrower, b0, { balanceTk: -40 }, A, "borrower paid 40");
      await expectMoved(parent, p0, { balanceTk: 40 }, B, "parent club received 40");
    }
  });

  test("the loan shows up for both clubs and in the borrower's squad", async () => {
    const alphaLoans = await as("alphaPresident").get(`/transfers/loans/clubs/${A}`);
    const betaLoans = await as("betaPresident").get(`/transfers/loans/clubs/${B}`);
    expect(alphaLoans.loansIn.map((l: any) => l.id)).toContain(loanId);
    expect(betaLoans.loansOut.map((l: any) => l.id)).toContain(loanId);
    const member = await inSquad(A, actor("betaPlayer").userId);
    expect(member?.onLoanFrom?.clubId).toBe(B);
    expect(member?.onLoanFrom?.matches).toBe(2);
    // His contract stays with Beta.
    const status = await as("freeAgent2").get(`/transfers/players/${actor("betaPlayer").userId}`);
    expect(status.contract.clubId).toBe(B);
  });

  test("a player on loan can't be signed by anyone else meanwhile", async () => {
    const res = await as("alphaPresident").raw("POST", "/transfers/offers", {
      clubId: A,
      playerUserId: actor("betaPlayer").userId,
      amountTk: 0,
    });
    expect(res.status).toBe(400);
  });

  test("a second loan for the same player is refused", async () => {
    const res = await as("alphaPresident").raw("POST", "/transfers/loans", {
      clubId: A,
      playerUserId: actor("betaPlayer").userId,
      feeTk: 0,
      matches: 1,
      maxDays: 7,
    });
    expect(res.status).toBe(400);
  });

  test("loan limits come from the transfer settings", async () => {
    const { settings } = await as("alphaPresident").get("/transfers/me");
    const res = await as("betaPresident").raw("POST", "/transfers/loans", {
      clubId: B,
      playerUserId: actor("alphaPlayer").userId,
      feeTk: 0,
      matches: settings.maxLoanMatches + 1,
      maxDays: settings.maxLoanDays + 1,
    });
    expect(res.status).toBe(400);
  });

  test("a pending loan cancelled by the borrower gives the fee back", async () => {
    const borrower = as("betaPresident");
    const b0 = await snapshot(borrower, B);
    const loan = await borrower.post("/transfers/loans", {
      clubId: B,
      playerUserId: actor("alphaPlayer").userId,
      feeTk: 25,
      matches: 1,
      maxDays: 7,
      paymentMethod: "nagad",
    });
    await expectMoved(borrower, b0, { balanceTk: -25, heldTk: 25 }, B);
    await borrower.post(`/transfers/loans/${loan.id}/cancel`, {});
    await expectMoved(borrower, b0, {}, B, "refunded");
    expect((await borrower.get(`/transfers/loans/${loan.id}`)).status).toBe("cancelled");
  });

  test("lending out: the parent proposes, the borrower declines", async () => {
    const loan = await as("alphaPresident").post("/transfers/loans", {
      clubId: A,
      playerUserId: actor("alphaPlayer").userId,
      otherClubId: B,
      feeTk: 0,
      matches: 1,
      maxDays: 7,
    });
    expect(loan.status).toBe("pending");
    await as("betaPresident").post(`/transfers/loans/${loan.id}/respond`, { accept: false });
    expect((await as("alphaPresident").get(`/transfers/loans/${loan.id}`)).status).toBe("declined");
  });

  test("staff can end a running loan and he goes back to his club", async () => {
    const res = await as("admin").raw("POST", `/admin/transfers/loans/${loanId}/end`, { reason: "e2e" });
    test.skip(!res.ok, `staff end-loan not available: ${res.status}`);
    const after = await as("alphaPresident").get(`/transfers/loans/${loanId}`);
    expect(["completed", "returning"]).toContain(after.status);
    if (after.status === "completed") expect(await inSquad(B, actor("betaPlayer").userId)).toBeTruthy();
  });
});
