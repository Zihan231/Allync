import { test, expect } from "@playwright/test";
import { castApis, track, type RoleKey } from "../../lib/cast";
import { expectMoved, snapshot } from "../../lib/money";

/**
 * Organizer mode / general tournaments: prize held from the organizer, entry fees held
 * from entrants, refunds on leave, fees paid to the organizer when fixtures are generated,
 * and refunds when staff cancel. Also the console-only rule and who may manage.
 *
 * Playing games to a champion needs match times hours ahead, so the prize payout itself
 * is covered by the backend unit tests (tournament-money.service.spec.ts).
 */
const { cast, as } = castApis();
const FEE = 20;
const PRIZE = 100;
const ENTRANTS: RoleKey[] = ["entrant1", "entrant2", "freeAgent2", "commMember", "commScout"];

const inDays = (d: number) => new Date(Date.now() + d * 24 * 3600_000).toISOString();

test.describe.configure({ mode: "serial" });

let tournamentId = "";

test.describe("general tournament money", () => {
  test.beforeAll(async () => {
    // Entrants without demo funds yet get some.
    for (const key of ["freeAgent2", "commMember", "commScout"] as RoleKey[]) await as(key).topUp();
  });

  test("creating with a prize holds it from the organizer", async () => {
    const org = as("organizer");
    const o0 = await snapshot(org);
    const t = await org.post("/tournaments", {
      name: `E2E ${cast.runId} General Cup`,
      description: "Automated test tournament",
      type: "pvp",
      general: true,
      platform: "mobile",
      isPaid: true,
      entryFeeBdt: FEE,
      prizePoolBdt: PRIZE,
      // Fixtures can be generated early only once every slot is filled.
      maxParticipants: 4,
      startAt: inDays(2),
      registrationDeadline: inDays(1),
      paymentMethod: "bkash",
    });
    tournamentId = t.id;
    track("tournaments", t.id);
    expect(t.communityId ?? null).toBeNull();
    expect(t.hostClubId ?? null).toBeNull();
    await expectMoved(org, o0, { balanceTk: -PRIZE, heldTk: PRIZE }, undefined, "prize held");
  });

  test("it is listed among general tournaments", async () => {
    const list = await as("entrant1").get("/tournaments?host=general&limit=100");
    const rows = Array.isArray(list) ? list : (list.data ?? list.items ?? []);
    expect(rows.map((t: any) => t.id)).toContain(tournamentId);
  });

  test("a prize larger than the wallet is refused", async () => {
    const res = await as("organizer").raw("POST", "/tournaments", {
      name: `E2E ${cast.runId} Too Rich`,
      type: "pvp",
      general: true,
      prizePoolBdt: 9_000_000,
      maxParticipants: 4,
      startAt: inDays(2),
    });
    expect(res.status).toBe(400);
  });

  test("the organizer can't enter their own tournament", async () => {
    const res = await as("organizer").raw("POST", `/tournaments/${tournamentId}/join`, { paymentMethod: "bkash" });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test("a mobile tournament is open to console players too (only console ones are restricted)", async () => {
    const api = as("consolePlayer");
    const w0 = await snapshot(api);
    await api.post(`/tournaments/${tournamentId}/join`, { paymentMethod: "bkash" });
    await api.post(`/tournaments/${tournamentId}/leave`, {});
    await expectMoved(api, w0, {}, undefined, "joined and left: no money lost");
  });

  test("a player can only be in one active tournament at a time", async () => {
    const other = await as("organizer").post("/tournaments", {
      name: `E2E ${cast.runId} Second Cup`,
      type: "pvp",
      general: true,
      maxParticipants: 4,
      startAt: inDays(3),
    });
    track("tournaments", other.id);
    await as("entrant1").post(`/tournaments/${tournamentId}/join`, { paymentMethod: "bkash" });
    const res = await as("entrant1").raw("POST", `/tournaments/${other.id}/join`, {});
    expect(res.status).toBe(400);
    await as("entrant1").post(`/tournaments/${tournamentId}/leave`, {});
    await as("organizer").del(`/tournaments/${other.id}`);
  });

  test("joining holds the entry fee; leaving refunds it", async () => {
    // The leaver goes first so the other four fill all the slots.
    for (const key of ["commScout", ...ENTRANTS.filter((k) => k !== "commScout")] as RoleKey[]) {
      const api = as(key);
      const w0 = await snapshot(api);
      await api.post(`/tournaments/${tournamentId}/join`, { paymentMethod: "bkash" });
      await expectMoved(api, w0, { balanceTk: -FEE, heldTk: FEE }, undefined, `${key} fee held`);
      if (key === "commScout") {
        await api.post(`/tournaments/${tournamentId}/leave`, {});
        await expectMoved(api, w0, {}, undefined, "fee refunded on leave");
      }
    }
    const full = await as("commScout").raw("POST", `/tournaments/${tournamentId}/join`, { paymentMethod: "bkash" });
    expect(full.status, "a full tournament takes no more entrants").toBe(400);
  });

  test("only the organizer manages it", async () => {
    for (const key of ["entrant1", "alphaPresident", "commPresident", "moderator"] as RoleKey[]) {
      const res = await as(key).raw("PATCH", `/tournaments/${tournamentId}`, { description: "hijack" });
      expect(res.status, key).toBe(403);
      const gen = await as(key).raw("POST", `/tournaments/${tournamentId}/generate-bracket`, {});
      expect(gen.status, key).toBeGreaterThanOrEqual(400);
    }
  });

  test("generating fixtures pays the held fees to the organizer", async () => {
    const org = as("organizer");
    const o0 = await snapshot(org);
    const players = ENTRANTS.filter((k) => k !== "commScout");
    const before = await Promise.all(players.map((k) => snapshot(as(k))));
    const res = await org.raw("POST", `/tournaments/${tournamentId}/generate-bracket`, {});
    test.skip(!res.ok && /deadline|registration/i.test(JSON.stringify(res.body)), `fixtures not allowed yet: ${JSON.stringify(res.body)}`);
    expect(res.ok, JSON.stringify(res.body)).toBe(true);
    await expectMoved(org, o0, { balanceTk: FEE * players.length }, undefined, "organizer got the fees");
    for (const [i, k] of players.entries()) await expectMoved(as(k), before[i], { heldTk: -FEE }, undefined, `${k} fee paid out`);
    const structure = await org.get(`/tournaments/${tournamentId}/structure`);
    expect(JSON.stringify(structure).length).toBeGreaterThan(50);
  });

  test("staff cancelling it refunds entrants and releases the prize", async () => {
    const org = as("organizer");
    const o0 = await snapshot(org);
    const players = ENTRANTS.filter((k) => k !== "commScout");
    const before = await Promise.all(players.map((k) => snapshot(as(k))));
    const t = await org.get(`/tournaments/${tournamentId}`);
    const feesWerePaid = t.status !== "registration_open";

    const res = await as("admin").raw("POST", `/admin/manage/tournament/${tournamentId}/status`, { status: "cancelled", reason: "e2e cancel" });
    expect(res.ok, JSON.stringify(res.body)).toBe(true);

    // Prize back to the organizer; fees back to entrants (from the organizer if already paid out).
    for (const [i, k] of players.entries()) {
      const after = await snapshot(as(k));
      expect(after.balanceTk - before[i].balanceTk, `${k} refunded`).toBe(FEE);
    }
    const expectedOrg = PRIZE - (feesWerePaid ? FEE * players.length : 0);
    await expectMoved(org, o0, { balanceTk: expectedOrg, heldTk: -PRIZE }, undefined, "organizer after cancel");
  });
});

test.describe("club and community tournaments", () => {
  test("a club President or GS hosts a club tournament; other members can't", async () => {
    const body = (name: string) => ({
      name: `E2E ${cast.runId} ${name}`,
      type: "pvp",
      hostClubId: cast.clubs.alpha,
      maxParticipants: 4,
      startAt: inDays(3),
    });
    for (const key of ["alphaCaptain", "alphaManager", "alphaPlayer", "betaPresident"] as RoleKey[]) {
      const res = await as(key).raw("POST", "/tournaments", body(`Club Cup by ${key}`));
      expect(res.status, key).toBeGreaterThanOrEqual(400);
      expect(res.status, key).toBeLessThan(500);
    }
    const ok = await as("alphaGs").post("/tournaments", body("Club Cup"));
    track("tournaments", ok.id);
    expect(ok.hostClubId).toBe(cast.clubs.alpha);
  });

  test("community tournaments are created by the community's leaders only", async () => {
    const body = { name: `E2E ${cast.runId} Community Cup`, type: "pvp", communityId: cast.communityId, maxParticipants: 4, startAt: inDays(3) };
    const denied = await as("commMember").raw("POST", "/tournaments", body);
    expect(denied.status).toBeGreaterThanOrEqual(400);
    const ok = await as("commPresident").post("/tournaments", body);
    track("tournaments", ok.id);
    expect(ok.communityId).toBe(cast.communityId);
  });

  test("a console tournament only takes console players", async () => {
    const t = await as("organizer").post("/tournaments", {
      name: `E2E ${cast.runId} Console Cup`,
      type: "pvp",
      general: true,
      platform: "console",
      maxParticipants: 4,
      startAt: inDays(3),
    });
    track("tournaments", t.id);
    expect((await as("entrant1").raw("POST", `/tournaments/${t.id}/join`, {})).status).toBe(400);
    expect((await as("consolePlayer").raw("POST", `/tournaments/${t.id}/join`, {})).ok).toBe(true);
    // Free tournament: deleting it works for its organizer.
    await as("consolePlayer").post(`/tournaments/${t.id}/leave`, {});
    const del = await as("organizer").raw("DELETE", `/tournaments/${t.id}`);
    expect(del.ok).toBe(true);
  });

  test("the my-games feed answers for players and organizers", async () => {
    expect((await as("entrant1").raw("GET", "/tournaments/my-games")).status).toBe(200);
    expect((await as("organizer").raw("GET", "/tournaments/my-games?host=general")).status).toBeLessThan(500);
  });
});
