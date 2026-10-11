import { castApis, track } from "../../lib/cast";
import { expect, expectHealthy, settle, test, watch } from "../../lib/ui";

/** Store in the browser: filters, Try on your own profile, Back to store, buy through checkout. */
const { cast, as } = castApis();
const SKU = `e2e-${cast.runId}-ui-title`;
const NAME = `E2E Title ${cast.runId}`;
const PRICE = 15;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const existing = await as("admin").get("/admin/store/items");
  const rows = Array.isArray(existing) ? existing : (existing.items ?? existing.data ?? []);
  if (rows.some((i: any) => i.sku === SKU)) return;
  const item = await as("admin").post("/admin/store/items", {
    sku: SKU,
    name: NAME,
    description: "Automated test item",
    category: "title",
    priceTk: PRICE,
    active: true,
    metadata: { rarity: "epic" },
  });
  track("storeItems", item.id);
});

const card = (page: import("@playwright/test").Page) =>
  page
    .locator("div")
    .filter({ has: page.getByText(NAME, { exact: true }) })
    .filter({ has: page.getByRole("button", { name: "Try" }) })
    .last();

/** Opens the store on the Titles tab, where the test item is listed. */
async function openTitles(page: import("@playwright/test").Page) {
  await page.goto("/dashboard/efootball/store");
  await settle(page);
  await page.getByRole("button", { name: "Titles", exact: true }).click();
}

test("the Owned filter is kept in the URL", async ({ pageAs }) => {
  const page = await pageAs("entrant1");
  await page.goto("/dashboard/efootball/store");
  await settle(page);
  await page.getByRole("button", { name: "Owned", exact: true }).first().click();
  await expect(page).toHaveURL(/owned=1|owned=true/);
  await page.reload();
  await settle(page);
  await expect(page).toHaveURL(/owned=/);
});

test("Try previews the item on your own profile and Back to store returns", async ({ pageAs }) => {
  const page = await pageAs("entrant1");
  const problems = watch(page);
  await openTitles(page);
  await card(page).scrollIntoViewIfNeeded();
  await card(page).getByRole("button", { name: "Try" }).click();
  await expect(page).toHaveURL(new RegExp(`/players/${cast.actors.entrant1.userId}.*try=${SKU}`));
  await expect(page.getByText(`Preview: ${NAME}`).first()).toBeVisible();
  await page.getByRole("button", { name: "Back to store" }).or(page.getByRole("link", { name: "Back to store" })).first().click();
  await expect(page).toHaveURL(/\/dashboard\/efootball\/store/);
  await expect(card(page)).toBeInViewport();
  expectHealthy(problems, "try on");
});

test("buying through checkout charges the wallet and marks it owned", async ({ pageAs }) => {
  const before = (await as("entrant1").myWallet()).balanceTk;
  const page = await pageAs("entrant1");
  const problems = watch(page);
  await openTitles(page);
  await card(page).getByRole("button", { name: `Buy · ৳${PRICE}` }).click();
  const pay = page.getByRole("button", { name: `Pay ${PRICE} tk` });
  await expect(pay).toBeVisible();
  await pay.click();
  await expect(page.getByText("Payment successful")).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(card(page).getByText("Owned")).toBeVisible();
  expect((await as("entrant1").myWallet()).balanceTk).toBe(before - PRICE);
  expect((await as("entrant1").get("/store/me")).owned).toContain(SKU);
  expectHealthy(problems, "buy");
});

test("checkout refuses when the wallet is short", async ({ pageAs }) => {
  // The Head of Discipline never got demo funds.
  const page = await pageAs("commHeadOfDiscipline");
  await openTitles(page);
  await card(page).getByRole("button", { name: `Buy · ৳${PRICE}` }).click();
  await expect(page.getByRole("button", { name: `Pay ${PRICE} tk` })).toBeDisabled();
});
