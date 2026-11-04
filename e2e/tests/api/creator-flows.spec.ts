import { test, expect } from "@playwright/test";
import { anon, countNotes } from "../../lib/api";
import { castApis, track, type RoleKey } from "../../lib/cast";
import { expectMoved, snapshot } from "../../lib/money";

/**
 * A creative artist's design from submission to buyers: staff review (the creator is told
 * either way), the store listing, a purchase with the exact split between creator and
 * platform, changes to a live design, the validation rules and who may do what.
 */
const { cast, as, actor } = castApis();
const API = process.env.E2E_API_URL ?? "http://localhost:3001";
const creatorId = () => actor("creator").userId;

/** A 1x1 PNG: the smallest real image. */
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

type Files = Record<string, Array<{ data?: Buffer; type?: string; name?: string }>>;

/** Sends a design as multipart (the endpoints take files, which the JSON client can't send). */
async function send(method: "POST" | "PATCH", path: string, who: RoleKey, fields: Record<string, string | number | boolean>, files: Files = {}) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, String(v));
  for (const [field, list] of Object.entries(files)) {
    list.forEach((f, i) => form.append(field, new Blob([new Uint8Array(f.data ?? PNG)], { type: f.type ?? "image/png" }), f.name ?? `${field}${i}.png`));
  }
  const res = await fetch(`${API}${path}`, { method, headers: { authorization: `Bearer ${actor(who).token}` }, body: form });
  const text = await res.text();
  let body: any = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* plain text */
  }
  return { status: res.status, body };
}

const create = (fields: Record<string, string | number | boolean>, files: Files = { image: [{}] }, who: RoleKey = "creator") =>
  send("POST", "/creators/designs", who, fields, files);
const name = (label: string) => `E2E ${cast.runId} ${label}`;

const inCatalog = async (sku: string) => JSON.stringify(await anon.get("/store/catalog")).includes(sku);
const mine = async (id: string) => (await as("creator").get("/creators/me")).designs.find((d: any) => d.id === id);

async function notified(code: string, users: RoleKey[], action: () => Promise<unknown>): Promise<Record<string, number>> {
  const before = await Promise.all(users.map((u) => countNotes(as(u), code)));
  await action();
  const after = await Promise.all(users.map((u) => countNotes(as(u), code)));
  return Object.fromEntries(users.map((u, i) => [u, after[i] - before[i]]));
}

let pct = 30;
const cut = (price: number) => Math.round((price * pct) / 100);

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  pct = (await as("creator").get("/creators/me")).commissionPct;
});

let badge: { id: string; sku: string } = { id: "", sku: "" };
let second: { id: string; sku: string } = { id: "", sku: "" };

test.describe("who can submit and what they must give", () => {
  test("only a creative artist can submit; a non-creator sees an empty studio", async () => {
    for (const key of ["entrant1", "coach2", "sponsor", "social"] as RoleKey[]) {
      const res = await create({ category: "badge", name: name("nope"), priceTk: 10 }, { image: [{}] }, key);
      expect(res.status, key).toBe(403);
    }
    const studio = await as("entrant1").raw("GET", "/creators/me");
    expect(studio.ok).toBe(true);
    expect(studio.body.designs).toEqual([]);
  });

  test("the rules: category, name, price, artwork and colours", async () => {
    const bad = async (label: string, fields: Record<string, string | number>, files?: Files) => {
      const res = await create({ category: "badge", name: name("rule"), priceTk: 10, ...fields }, files ?? { image: [{}] });
      expect(res.status, label).toBe(400);
    };
    await bad("no category", { category: "" });
    await bad("unknown category", { category: "hat" });
    await bad("name too short", { name: "x" });
    await bad("name too long", { name: "x".repeat(61) });
    await bad("reserved word", { name: "Champion Badge" });
    await bad("reserved word, any case", { name: "the OFFICIAL one" });
    await bad("negative price", { priceTk: -5 });
    await bad("price too high", { priceTk: 100_001 });
    await bad("no artwork", {}, {});
    await bad("not an image", {}, { image: [{ type: "text/plain", name: "a.txt" }] });
    await bad("a gif", {}, { image: [{ type: "image/gif", name: "a.gif" }] });
    await bad("badge over 1 MB", {}, { image: [{ data: Buffer.alloc(1024 * 1024 + 10, 1) }] });
    await bad("badge with a banner file", {}, { banner: [{}] });
    await bad("themed without colours", { category: "theme" }, { banner: [{}] });
    await bad("themed with a bad colour", { category: "theme", primaryColor: "red", secondaryColor: "#0ea5e9" }, { banner: [{}] });
    await bad("frame that is not a png", { category: "frame" }, { frame: [{ type: "image/jpeg", name: "f.jpg" }] });
    await bad("sticker pack with 3 stickers", { category: "sticker_pack" }, { stickers: [{}, {}, {}] });
    await bad("sticker pack with 13 stickers", { category: "sticker_pack" }, { stickers: Array.from({ length: 13 }, () => ({})) });
    // A reserved word inside a longer word is fine.
    const ok = await create({ category: "badge", name: `Kingfisher ${cast.runId}`, priceTk: 10 });
    expect(ok.status).toBe(201);
    await as("creator").del(`/creators/designs/${ok.body.id}`);
  });
});

test.describe("staff review: the creator hears either way", () => {
  test("a new design waits: not for sale, not public, in the staff queue", async () => {
    const res = await create({ category: "badge", name: name("Neon Badge"), description: "e2e", priceTk: 100, rarity: "rare" });
    expect(res.status).toBe(201);
    badge = { id: res.body.id, sku: res.body.sku };
    track("storeItems", badge.id);
    expect(res.body).toMatchObject({ reviewStatus: "pending", active: false, priceTk: 100, creatorUserId: creatorId() });

    expect(await inCatalog(badge.sku)).toBe(false);
    expect((await anon.get(`/creators/${creatorId()}`)).designs.map((d: any) => d.id)).not.toContain(badge.id);
    expect((await as("creator").get("/creators/me")).stats.inReview).toBeGreaterThanOrEqual(1);

    const queue = await as("moderator").get("/admin/creators/designs?status=pending");
    expect(queue.data.map((d: any) => d.id)).toContain(badge.id);
    expect(queue.counts.pending).toBeGreaterThanOrEqual(1);
  });

  test("only staff review; rejecting needs a reason; a moderator can't change the price", async () => {
    for (const key of ["creator", "alphaPresident", "entrant1"] as RoleKey[]) {
      expect((await as(key).raw("GET", "/admin/creators/designs")).status, key).toBe(403);
      expect((await as(key).raw("POST", `/admin/creators/designs/${badge.id}/review`, { approve: true })).status, key).toBe(403);
    }
    expect((await as("moderator").raw("POST", `/admin/creators/designs/${badge.id}/review`, { approve: false })).status).toBe(400);
    expect((await as("moderator").raw("POST", `/admin/creators/designs/${badge.id}/review`, { approve: false, reason: "  " })).status).toBe(400);
    expect((await as("moderator").raw("POST", `/admin/creators/designs/${badge.id}/review`, { approve: true, priceTk: 5 })).status).toBe(403);
    expect((await as("moderator").raw("POST", `/admin/creators/designs/${badge.id}/review`, { approve: true, rarity: "mythic" })).status).toBe(403);
    expect((await as("moderator").raw("POST", "/admin/creators/designs/00000000-0000-4000-8000-000000000000/review", { approve: true })).status).toBe(404);
  });

  test("rejecting tells the creator why and the design stays hidden", async () => {
    const got = await notified("creator.designRejected", ["creator", "entrant1"], () =>
      as("moderator").post(`/admin/creators/designs/${badge.id}/review`, { approve: false, reason: "The artwork is blurry" }),
    );
    expect(got).toEqual({ creator: 1, entrant1: 0 });
    const note = (await as("creator").notifications()).find((n) => n.code === "creator.designRejected");
    expect(note?.message).toContain("The artwork is blurry");
    expect(await mine(badge.id)).toMatchObject({ reviewStatus: "rejected", rejectReason: "The artwork is blurry", active: false });
    expect(await inCatalog(badge.sku)).toBe(false);
  });

  test("the creator sends a new image and it goes back to review with the reason cleared", async () => {
    // A price-only edit changes nothing about its status.
    expect((await send("PATCH", `/creators/designs/${badge.id}`, "creator", { priceTk: 100 })).body.reviewStatus).toBe("rejected");
    const res = await send("PATCH", `/creators/designs/${badge.id}`, "creator", {}, { image: [{}] });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ reviewStatus: "pending", rejectReason: null });
    // Only the owner may edit it.
    for (const key of ["entrant1", "sponsor"] as RoleKey[]) {
      expect((await send("PATCH", `/creators/designs/${badge.id}`, key, { priceTk: 1 })).status, key).toBeGreaterThanOrEqual(403);
    }
    // Creators can't pause a design.
    expect((await send("PATCH", `/creators/designs/${badge.id}`, "creator", { active: false })).status).toBe(400);
  });

  test("approving tells the creator and puts the design on sale and on the public page", async () => {
    const got = await notified("creator.designApproved", ["creator", "entrant1"], () =>
      as("moderator").post(`/admin/creators/designs/${badge.id}/review`, { approve: true }),
    );
    expect(got).toEqual({ creator: 1, entrant1: 0 });
    expect(await mine(badge.id)).toMatchObject({ reviewStatus: "approved", active: true, priceTk: 100 });
    expect(await inCatalog(badge.sku)).toBe(true);
    expect((await anon.get(`/creators/${creatorId()}`)).designs.map((d: any) => d.id)).toContain(badge.id);
    // Nothing left to review.
    expect((await as("moderator").raw("POST", `/admin/creators/designs/${badge.id}/review`, { approve: true })).status).toBe(400);
  });

  test("an admin can adjust the price and rarity while approving", async () => {
    const res = await create({ category: "badge", name: name("Price Tuned"), priceTk: 500, rarity: "common" });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    second = { id: res.body.id, sku: res.body.sku };
    track("storeItems", second.id);
    await as("admin").post(`/admin/creators/designs/${second.id}/review`, { approve: true, priceTk: 77, rarity: "epic" });
    const d = await mine(second.id);
    expect(d.priceTk).toBe(77);
    expect(d.metadata.rarity).toBe("epic");
    expect(d.reviewStatus).toBe("approved");
  });
});

test.describe("buying a design", () => {
  test("the buyer pays the price; the creator gets it minus the platform cut", async () => {
    const buyer = as("entrant1");
    const artist = as("creator");
    const buyer0 = await snapshot(buyer);
    const artist0 = await snapshot(artist);

    const bought = await buyer.raw("POST", "/store/purchase", { sku: badge.sku });
    expect(bought.ok, JSON.stringify(bought.body)).toBe(true);
    await expectMoved(buyer, buyer0, { balanceTk: -100 }, undefined, "buyer paid the price");
    await expectMoved(artist, artist0, { balanceTk: 100 - cut(100) }, undefined, "creator got the price minus the cut");

    const d = await mine(badge.id);
    expect(d.salesCount).toBe(1);
    // Revenue is gross sales; the creator's own earnings (after the cut) are the wallet and the studio's "Earned".
    expect(d.revenueTk).toBe(100);
    expect((await as("creator").get("/creators/me")).stats.sales).toBeGreaterThanOrEqual(1);
  });

  test("you can't buy twice, can't buy your own, can't buy an unapproved one", async () => {
    expect((await as("entrant1").raw("POST", "/store/purchase", { sku: badge.sku })).status).toBe(400);
    expect((await as("creator").raw("POST", "/store/purchase", { sku: second.sku })).status).toBe(400);
    const pending = await create({ category: "badge", name: name("Still Waiting"), priceTk: 10 });
    track("storeItems", pending.body.id);
    // Not on sale: refused (a 404 is fine, it simply isn't in the store).
    expect([400, 404]).toContain((await as("entrant2").raw("POST", "/store/purchase", { sku: pending.body.sku })).status);
    await as("creator").del(`/creators/designs/${pending.body.id}`);
  });

  test("a design that has sold can't be removed; one that hasn't can", async () => {
    expect((await as("creator").raw("DELETE", `/creators/designs/${badge.id}`)).status).toBe(400);
    expect((await as("entrant1").raw("DELETE", `/creators/designs/${second.id}`)).status).toBeGreaterThanOrEqual(403);
    expect((await as("creator").del(`/creators/designs/${second.id}`)).deleted).toBe(true);
    expect(await inCatalog(second.sku)).toBe(false);
  });
});

test.describe("changing a live design", () => {
  test("a new look goes to review while the old one keeps selling; approving tells the owners", async () => {
    const res = await send("PATCH", `/creators/designs/${badge.id}`, "creator", {}, { image: [{ data: Buffer.concat([PNG, Buffer.from("v2")]) }] });
    expect(res.status).toBe(200);
    expect(res.body.reviewStatus).toBe("approved");
    expect(res.body.active).toBe(true);
    expect(res.body.pendingAssets).toBeTruthy();
    expect(await inCatalog(badge.sku)).toBe(true);

    const queue = await as("moderator").get("/admin/creators/designs?status=pending");
    expect(queue.data.map((d: any) => d.id)).toContain(badge.id);

    const got = await notified("store.designUpdated", ["entrant1", "entrant2", "creator"], () =>
      as("moderator").post(`/admin/creators/designs/${badge.id}/review`, { approve: true }),
    );
    expect(got).toEqual({ entrant1: 1, entrant2: 0, creator: 0 });
    const d = await mine(badge.id);
    expect(d.version).toBe(2);
    expect(d.pendingAssets).toBeNull();
  });

  test("rejecting a change keeps the live design on sale and tells the creator", async () => {
    await send("PATCH", `/creators/designs/${badge.id}`, "creator", {}, { image: [{ data: Buffer.concat([PNG, Buffer.from("v3")]) }] });
    const got = await notified("creator.designRejected", ["creator"], () =>
      as("moderator").post(`/admin/creators/designs/${badge.id}/review`, { approve: false, reason: "Not the same style" }),
    );
    expect(got.creator).toBe(1);
    const d = await mine(badge.id);
    expect(d).toMatchObject({ reviewStatus: "approved", active: true, version: 2 });
    expect(d.pendingAssets).toBeNull();
    expect(await inCatalog(badge.sku)).toBe(true);
  });
});

test.describe("every kind of design", () => {
  const made: string[] = [];
  const cases: Array<[string, Record<string, string | number>, Files]> = [
    ["frame", { category: "frame" }, { frame: [{}] }],
    ["theme", { category: "theme", primaryColor: "#e11d48", secondaryColor: "#0ea5e9" }, { banner: [{}] }],
    ["club_theme", { category: "club_theme", primaryColor: "#22c55e", secondaryColor: "#0f172a" }, { banner: [{}] }],
    ["tournament_banner", { category: "tournament_banner" }, { banner: [{}] }],
    ["sticker_pack", { category: "sticker_pack" }, { stickers: [{}, {}, {}, {}] }],
  ];
  for (const [label, fields, files] of cases) {
    test(`a ${label} can be submitted and reviewed`, async () => {
      const res = await create({ name: name(`Kind ${label}`), priceTk: 20, ...fields }, files);
      expect(res.status, JSON.stringify(res.body)).toBe(201);
      made.push(res.body.id);
      track("storeItems", res.body.id);
      expect(res.body.reviewStatus).toBe("pending");
      await as("moderator").post(`/admin/creators/designs/${res.body.id}/review`, { approve: true });
      expect((await mine(res.body.id)).reviewStatus).toBe("approved");
    });
  }

  test("the public creator page lists only approved designs, without private fields", async () => {
    const page = await anon.get(`/creators/${creatorId()}`);
    expect(page.designs.length).toBeGreaterThan(0);
    for (const d of page.designs) {
      expect(d.reviewStatus).toBe("approved");
      expect(d.pendingAssets).toBeUndefined();
      expect(d.rejectReason).toBeUndefined();
      expect(d.revenueTk).toBeUndefined();
    }
    expect((await anon.raw("GET", "/creators/00000000-0000-4000-8000-000000000000")).status).toBe(404);
  });
});

// Last on purpose: gaps where nobody is told. These describe the wanted behavior and fail until built.
test.describe("being told (known gaps)", () => {
  // Independent of each other: one gap failing must not hide the other.
  test.describe.configure({ mode: "default" });

  test("a creator is told when a design sells", async () => {
    const before = (await as("creator").notifications()).length;
    await as("entrant2").post("/store/purchase", { sku: badge.sku });
    expect((await as("creator").notifications()).length, "the sale should notify the creator").toBeGreaterThan(before);
  });

  test("staff are told when a design is waiting for review", async () => {
    const before = (await as("moderator").notifications()).length;
    const res = await create({ category: "badge", name: name("Ping Review"), priceTk: 10 });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    track("storeItems", res.body.id);
    expect((await as("moderator").notifications()).length, "a new design should notify staff").toBeGreaterThan(before);
    await as("creator").del(`/creators/designs/${res.body.id}`);
  });
});
