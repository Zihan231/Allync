import { test, expect } from "@playwright/test";
import { castApis, track } from "../../lib/cast";
import { expectMoved, snapshot } from "../../lib/money";

/** Store items managed by staff, bought with the wallet, equipped only when owned; gift/revoke. */
const { cast, as, actor } = castApis();
const SKU = `e2e-${cast.runId}-badge`;
const PRICE = 30;
let itemId = "";

test.describe.configure({ mode: "serial" });

test.describe("store management (staff)", () => {
  test("a moderator can't create store items; an admin can", async () => {
    const body = { sku: SKU, name: `E2E Badge ${cast.runId}`, category: "badge", priceTk: PRICE, active: true, metadata: { rarity: "rare" } };
    expect((await as("moderator").raw("POST", "/admin/store/items", body)).status).toBe(403);
    const item = await as("admin").post("/admin/store/items", body);
    itemId = item.id;
    track("storeItems", item.id);
    expect(item.sku).toBe(SKU);
  });

  test("a duplicate SKU is refused", async () => {
    const res = await as("admin").raw("POST", "/admin/store/items", { sku: SKU, name: "Dup", category: "badge", priceTk: 1 });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  test("the new item is on sale in the public catalog", async () => {
    const catalog = await as("entrant2").get("/store/catalog");
    const rows = Array.isArray(catalog) ? catalog : (catalog.items ?? catalog.data ?? []);
    const item = rows.find((i: any) => i.sku === SKU);
    expect(item?.priceTk).toBe(PRICE);
  });
});

test.describe("buying and equipping", () => {
  test("a user can't give himself cosmetics by editing his profile", async () => {
    await as("entrant2").raw("PATCH", "/users/me", { ownedCosmeticIds: [SKU], equippedBadgeId: SKU });
    const mine = await as("entrant2").get("/store/me");
    expect(mine.owned).not.toContain(SKU);
  });

  test("equipping an item you don't own is refused", async () => {
    const res = await as("entrant2").raw("POST", "/store/equip", { category: "badge", sku: SKU });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test("buying without enough money is refused", async () => {
    // The Head of Discipline never got demo funds.
    const res = await as("commHeadOfDiscipline").raw("POST", "/store/purchase", { sku: SKU });
    expect(res.status).toBe(400);
  });

  test("buying charges the wallet, records a purchase, owns and equips it", async () => {
    const buyer = as("entrant2");
    const w0 = await snapshot(buyer);
    const result = await buyer.post("/store/purchase", { sku: SKU, equip: true });
    await expectMoved(buyer, w0, { balanceTk: -PRICE }, undefined, "charged");
    const mine = await buyer.get("/store/me");
    expect(mine.owned).toContain(SKU);
    expect(mine.equipped.badge).toBe(SKU);
    const { wallet } = await buyer.get("/transfers/me");
    const purchase = wallet.transactions.find((t: any) => t.kind === "purchase");
    expect(purchase?.amountTk).toBe(-PRICE);
    expect(purchase?.storeItemId).toBe(itemId);
    void result;
  });

  test("an owned item can't be bought twice; it can be taken off and put back on", async () => {
    const buyer = as("entrant2");
    expect((await buyer.raw("POST", "/store/purchase", { sku: SKU })).status).toBe(400);
    await buyer.post("/store/equip", { category: "badge", sku: null });
    expect((await buyer.get("/store/me")).equipped.badge ?? null).toBeNull();
    await buyer.post("/store/equip", { category: "badge", sku: SKU });
    expect((await buyer.get("/store/me")).equipped.badge).toBe(SKU);
  });

  test("the equipped badge shows on the public profile", async () => {
    const user = await as("entrant1").get(`/users/${actor("entrant2").userId}`);
    expect(user.equippedBadgeId).toBe(SKU);
  });
});

test.describe("price changes, deactivation, gift and revoke", () => {
  test("a price change shows in the catalog", async () => {
    await as("admin").patch(`/admin/store/items/${itemId}`, { priceTk: PRICE + 5 });
    const catalog = await as("entrant1").get("/store/catalog");
    const rows = Array.isArray(catalog) ? catalog : (catalog.items ?? catalog.data ?? []);
    expect(rows.find((i: any) => i.sku === SKU)?.priceTk).toBe(PRICE + 5);
  });

  test("the admin catalog counts owners and revenue", async () => {
    const list = await as("admin").get("/admin/store/items");
    const rows = Array.isArray(list) ? list : (list.items ?? list.data ?? []);
    const row = rows.find((i: any) => i.sku === SKU);
    expect(row).toBeTruthy();
    expect(JSON.stringify(row)).toMatch(/owner|sales|revenue/i);
  });

  test("a deactivated item can't be bought", async () => {
    await as("admin").patch(`/admin/store/items/${itemId}`, { active: false });
    const res = await as("entrant1").raw("POST", "/store/purchase", { sku: SKU });
    expect(res.status).toBeGreaterThanOrEqual(400);
    await as("admin").patch(`/admin/store/items/${itemId}`, { active: true });
  });

  test("staff gift an item, then revoke it (it's taken off too)", async () => {
    const target = actor("entrant1").userId;
    await as("admin").post(`/admin/users/${target}/store-items`, { itemId, reason: "e2e gift" });
    expect((await as("entrant1").get("/store/me")).owned).toContain(SKU);
    await as("entrant1").post("/store/equip", { category: "badge", sku: SKU });

    const detail = await as("admin").get(`/admin/users/${target}`);
    expect(JSON.stringify(detail)).toContain(SKU);

    expect((await as("moderator").raw("DELETE", `/admin/users/${target}/store-items/${itemId}`, { reason: "x" })).status).toBe(403);
    await as("admin").call("DELETE", `/admin/users/${target}/store-items/${itemId}`, { reason: "e2e revoke" });
    const mine = await as("entrant1").get("/store/me");
    expect(mine.owned).not.toContain(SKU);
    expect(mine.equipped.badge ?? null).not.toBe(SKU);
  });
});
