import { randomBytes } from "node:crypto";
import { APP_URL } from "../../lib/env";
import { castApis } from "../../lib/cast";
import { expect, expectHealthy, settle, test, watch } from "../../lib/ui";

/**
 * The creative artist's pages, button by button: the studio, the three-step submit wizard
 * (type, artwork, details) with its limits, "My designs" (filters, price, change, remove),
 * the staff review screen (reject with a reason, admin price/rarity, approve), and what the
 * public sees. The first design is made in the browser; the second through the API.
 */
const { cast, as, actor } = castApis();
const API = process.env.E2E_API_URL ?? "http://localhost:3001";
const creatorId = () => actor("creator").userId;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const art = (name = "art.png", type = "image/png", buffer: Buffer = PNG) => ({ name, mimeType: type, buffer });

// Unique per run of this file, so a rerun against the same test users never finds the last run's designs.
const RUN = randomBytes(2).toString("hex");
const FIRST = `E2E ${cast.runId} UI Neon ${RUN}`;
const SECOND = `E2E ${cast.runId} UI Ember ${RUN}`;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  // The dev server compiles a page the first time anyone opens it: open them all once now.
  test.setTimeout(600_000);
  const routes = [
    "/dashboard/creator", "/dashboard/creator/designs", "/dashboard/creator/new", "/dashboard/creator/profile",
    "/dashboard/admin/creators", `/dashboard/efootball/creators/${creatorId()}`, "/dashboard/efootball/store",
  ];
  for (let i = 0; i < routes.length; i += 3) await Promise.all(routes.slice(i, i + 3).map((p) => fetch(`${APP_URL}${p}`).catch(() => undefined)));
});

test.describe("someone who isn't a creator", () => {
  test("sees an invitation to add the Creative artist role, not the studio", async ({ pageAs }) => {
    const page = await pageAs("entrant1");
    const problems = watch(page);
    await page.goto("/dashboard/creator");
    await settle(page);
    await expect(page.getByRole("button", { name: /Add the Creative artist role/ })).toBeVisible();
    await expect(page.getByTestId("creator-earned")).toHaveCount(0);
    expectHealthy(problems, "non-creator at /dashboard/creator");
  });
});

test.describe("the studio", () => {
  test("shows the four tiles, the link to the public page, and the menu works", async ({ pageAs }) => {
    const page = await pageAs("creator");
    const problems = watch(page);
    await page.goto("/dashboard/creator");
    await settle(page);
    await expect(page.getByRole("heading", { name: "Creator studio" })).toBeVisible();
    for (const label of ["Earned", "Sales", "Live designs", "In review"]) await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    await expect(page.getByTestId("creator-earned")).toBeVisible();
    await expect(page.getByRole("link", { name: "View my creator page" })).toHaveAttribute("href", new RegExp(`/dashboard/efootball/creators/${creatorId()}`));

    for (const [name, url] of [
      ["My designs", /\/dashboard\/creator\/designs/],
      ["Submit design", /\/dashboard\/creator\/new/],
      ["Creator dashboard", /\/dashboard\/creator$/],
    ] as const) {
      await page.getByRole("link", { name, exact: true }).first().click();
      await expect(page, name).toHaveURL(url);
      await settle(page);
    }
    expectHealthy(problems, "creator studio");
  });
});

test.describe("the submit wizard", () => {
  test("step 1: every kind of design; sticker packs are marked coming soon", async ({ pageAs }) => {
    const page = await pageAs("creator");
    await page.goto("/dashboard/creator/new");
    await settle(page);
    await expect(page.getByRole("heading", { name: "What are you designing?" })).toBeVisible();
    await expect(page.getByText("1. Type")).toBeVisible();
    for (const c of ["badge", "frame", "theme", "club_theme", "tournament_banner"]) await expect(page.getByTestId(`design-type-${c}`)).toBeEnabled();
    await expect(page.getByTestId("design-type-sticker_pack")).toBeDisabled();
    await expect(page.getByTestId("design-type-sticker_pack")).toContainText("Coming soon");
  });

  test("step 2: the artwork limits, per kind of design", async ({ pageAs }) => {
    const page = await pageAs("creator");
    await page.goto("/dashboard/creator/new");
    await settle(page);
    await page.getByTestId("design-type-badge").click();
    await expect(page.getByText("2. Artwork")).toBeVisible();
    await expect(page.getByTestId("design-next")).toBeDisabled();

    // Over 1 MB: refused with the rule, and still can't go on.
    await page.getByTestId("design-file").setInputFiles(art("big.png", "image/png", Buffer.alloc(1024 * 1024 + 10, 1)));
    await expect(page.getByText("Square PNG or WebP, up to 1 MB.").last()).toBeVisible();
    await expect(page.getByTestId("design-next")).toBeDisabled();
    // A good image: the file is named, the button says Replace, Next opens.
    await page.getByTestId("design-file").setInputFiles(art("badge.png"));
    await expect(page.getByText("badge.png")).toBeVisible();
    await expect(page.getByText("Replace")).toBeVisible();
    await expect(page.getByTestId("design-next")).toBeEnabled();
    // Back goes to the type step (the wizard's Back is the last one: the page has its own Back button too).
    await page.getByRole("button", { name: "Back", exact: true }).last().click();
    await expect(page.getByRole("heading", { name: "What are you designing?" })).toBeVisible();

    // A frame must be a PNG.
    await page.getByTestId("design-type-frame").click();
    await page.getByTestId("design-file").setInputFiles(art("frame.jpg", "image/jpeg"));
    await expect(page.getByText(/Transparent PNG/).last()).toBeVisible();
    await expect(page.getByTestId("design-next")).toBeDisabled();
    await page.getByRole("button", { name: "Back", exact: true }).last().click();

    // A theme also takes two colours.
    await page.getByTestId("design-type-theme").click();
    await expect(page.getByText("Main colour")).toBeVisible();
    await expect(page.getByText("Second colour")).toBeVisible();
  });

  test("step 3: the name rule, the price and what the creator earns, then submit", async ({ pageAs }) => {
    const page = await pageAs("creator");
    const problems = watch(page);
    const pct = (await as("creator").get("/creators/me")).commissionPct as number;
    await page.goto("/dashboard/creator/new");
    await settle(page);
    await page.getByTestId("design-type-badge").click();
    await page.getByTestId("design-file").setInputFiles(art("neon.png"));
    await page.getByTestId("design-next").click();
    await expect(page.getByText("3. Details")).toBeVisible();
    await expect(page.getByTestId("design-submit")).toBeDisabled();

    // A name that claims a rank is refused as you type; one character is too short.
    await page.getByTestId("design-name").fill("Champion Badge");
    await expect(page.getByText(/"champion" can't be in a design's name/i)).toBeVisible();
    await expect(page.getByTestId("design-submit")).toBeDisabled();
    await page.getByTestId("design-name").fill("x");
    await expect(page.getByTestId("design-submit")).toBeDisabled();
    expect((await page.getByTestId("design-name").inputValue()).length).toBe(1);
    await page.getByTestId("design-name").fill("y".repeat(70));
    expect((await page.getByTestId("design-name").inputValue()).length).toBe(60);

    await page.getByTestId("design-name").fill(FIRST);
    await expect(page.getByText(/"champion" can't be/i)).toHaveCount(0);
    await expect(page.getByTestId("design-submit")).toBeEnabled();

    // The earnings hint follows the price.
    const net = (price: number) => price - Math.round((price * pct) / 100);
    await page.getByTestId("design-price").fill("100");
    await expect(page.getByText(/after the platform's/)).toContainText(String(net(100)));
    await page.getByTestId("design-price").fill("200");
    await expect(page.getByText(/after the platform's/)).toContainText(String(net(200)));
    await page.getByTestId("design-price").fill("100");
    await page.getByLabel("Description").fill("Automated design");
    await page.getByLabel("Rarity").selectOption("rare");

    await page.getByTestId("design-submit").click();
    // (The success message is on the wizard page, which the app leaves at once: the list is the proof.)
    await expect(page).toHaveURL(/\/dashboard\/creator\/designs/);
    await expect(page.getByTestId("design-row").filter({ hasText: FIRST }).getByText("In review")).toBeVisible();
    expectHealthy(problems, "design wizard");
  });
});

test.describe("my designs", () => {
  test("the new design is in review; filters, price, change and remove", async ({ pageAs }) => {
    // A second design through the API, so the page has more than one row.
    const form = new FormData();
    for (const [k, v] of Object.entries({ category: "badge", name: SECOND, priceTk: "50", rarity: "common" })) form.append(k, v);
    form.append("image", new Blob([new Uint8Array(PNG)], { type: "image/png" }), "ember.png");
    const made = await fetch(`${API}/creators/designs`, { method: "POST", headers: { authorization: `Bearer ${actor("creator").token}` }, body: form });
    expect(made.status).toBe(201);

    const page = await pageAs("creator");
    const problems = watch(page);
    await page.goto("/dashboard/creator/designs");
    await settle(page);
    const first = page.getByTestId("design-row").filter({ hasText: FIRST });
    await expect(first).toBeVisible();
    await expect(first.getByText("In review")).toBeVisible();
    await expect(first.getByText(/Sold: 0/)).toBeVisible();

    // Filters: All and In review are pressed in turn.
    await expect(page.getByRole("button", { name: /^All · / })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: /^In review · / }).click();
    await expect(page.getByRole("button", { name: /^In review · / })).toHaveAttribute("aria-pressed", "true");
    await expect(first).toBeVisible();
    await page.getByRole("button", { name: /^All · / }).click();

    // Price: Save is off until it changes, then saves with a toast and holds after a reload.
    const price = first.locator('input[type="number"]');
    const save = first.getByRole("button", { name: "Save" });
    await expect(save).toBeDisabled();
    await price.fill("120");
    await expect(save).toBeEnabled();
    await save.click();
    await expect(page.getByText("Price updated.")).toBeVisible();
    await page.reload();
    await settle(page);
    await expect(page.getByTestId("design-row").filter({ hasText: FIRST }).locator('input[type="number"]')).toHaveValue("120");
    await page.getByTestId("design-row").filter({ hasText: FIRST }).locator('input[type="number"]').fill("100");
    await page.getByTestId("design-row").filter({ hasText: FIRST }).getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Price updated.")).toBeVisible();

    // Change look: opens the editor with its own hint; nothing can be sent without a new file.
    const second = page.getByTestId("design-row").filter({ hasText: SECOND });
    await second.getByRole("link", { name: "Change look" }).click();
    await expect(page).toHaveURL(/\/dashboard\/creator\/new\?edit=/);
    await expect(page.getByText(/The new look goes to review/)).toBeVisible();
    await expect(page.getByTestId("design-submit")).toBeDisabled();
    await expect(page.getByText("1. Type")).toHaveCount(0);
    await page.goBack();
    await settle(page);

    // Remove asks first: refusing keeps it, accepting removes it.
    const row = page.getByTestId("design-row").filter({ hasText: SECOND });
    page.once("dialog", (d) => void d.dismiss());
    await row.getByRole("button", { name: "Remove" }).click();
    await expect(row).toBeVisible();
    page.once("dialog", (d) => void d.accept());
    await row.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByText("Design removed.")).toBeVisible();
    await expect(page.getByTestId("design-row").filter({ hasText: SECOND })).toHaveCount(0);
    expectHealthy(problems, "my designs");
  });
});

test.describe("staff review", () => {
  test("a moderator sees the design, can't change price or rarity, and must give a reason to reject", async ({ pageAs }) => {
    const page = await pageAs("moderator");
    const problems = watch(page);
    await page.goto("/dashboard/admin/creators");
    await settle(page);
    for (const tab of ["To review", "Approved", "Rejected"]) await expect(page.getByRole("tab", { name: new RegExp(tab) })).toBeVisible();
    await expect(page.getByRole("tab", { name: /To review/ })).toHaveAttribute("aria-selected", "true");

    const card = page.getByTestId("admin-design").filter({ hasText: FIRST });
    await expect(card).toBeVisible();
    await expect(card.getByText("New design")).toBeVisible();
    await expect(card.getByRole("link", { name: actor("creator").name })).toBeVisible();
    await expect(card.getByText(/Admins only/)).toBeVisible();
    // (Playwright doesn't count the disabled fieldset itself, so look at the boxes inside it.)
    await expect(card.locator('fieldset input[type="number"]')).toBeDisabled();
    await expect(card.locator("fieldset select")).toBeDisabled();

    await card.getByRole("button", { name: "Reject" }).click();
    const dialog = page.getByRole("dialog");
    const confirm = dialog.getByRole("button", { name: "Reject" });
    await expect(confirm).toBeDisabled();
    await dialog.getByRole("textbox").fill("no");
    await expect(confirm).toBeDisabled();
    // Cancel closes it without rejecting.
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(card).toBeVisible();

    await card.getByRole("button", { name: "Reject" }).click();
    await page.getByRole("dialog").getByRole("textbox").fill("The artwork is blurry");
    await page.getByRole("dialog").getByRole("button", { name: "Reject" }).click();
    await expect(page.getByText("Rejected.")).toBeVisible();
    await expect(page.getByTestId("admin-design").filter({ hasText: FIRST })).toHaveCount(0);
    await page.getByRole("tab", { name: /Rejected/ }).click();
    await expect(page.getByTestId("admin-design").filter({ hasText: FIRST })).toContainText("The artwork is blurry");
    expectHealthy(problems, "admin creators (moderator)");
  });

  test("the creator sees the reason and the design stays off sale", async ({ pageAs }) => {
    const page = await pageAs("creator");
    await page.goto("/dashboard/creator/designs");
    await settle(page);
    const row = page.getByTestId("design-row").filter({ hasText: FIRST });
    await expect(row.getByText("Rejected")).toBeVisible();
    await expect(row.getByText("Staff: The artwork is blurry")).toBeVisible();

    const visitor = await pageAs("entrant1");
    await visitor.goto(`/dashboard/efootball/creators/${creatorId()}`);
    await settle(visitor);
    await expect(visitor.getByText(FIRST)).toHaveCount(0);
  });

  test("the creator sends a new image; an admin sets the price and rarity and approves", async ({ pageAs }) => {
    const creator = await pageAs("creator");
    await creator.goto("/dashboard/creator/designs");
    await settle(creator);
    await creator.getByTestId("design-row").filter({ hasText: FIRST }).getByRole("link", { name: "Change look" }).click();
    await creator.getByTestId("design-file").setInputFiles(art("neon-2.png"));
    await creator.getByTestId("design-submit").click();
    // (The message is on the editor page, which the app leaves at once: the list shows it.)
    await expect(creator).toHaveURL(/\/dashboard\/creator\/designs/);
    await expect(creator.getByTestId("design-row").filter({ hasText: FIRST }).getByText("Change in review")).toBeVisible();

    const page = await pageAs("admin");
    const problems = watch(page);
    await page.goto("/dashboard/admin/creators");
    await settle(page);
    const card = page.getByTestId("admin-design").filter({ hasText: FIRST });
    await expect(card).toBeVisible();
    await expect(card.locator('fieldset input[type="number"]')).toBeEnabled();
    await card.locator('input[type="number"]').fill("77");
    await card.locator("select").selectOption("epic");
    await card.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText("Approved.")).toBeVisible();
    await page.getByRole("tab", { name: /Approved/ }).click();
    await expect(page.getByTestId("admin-design").filter({ hasText: FIRST })).toBeVisible();
    expectHealthy(problems, "admin creators (admin)");

    await creator.goto("/dashboard/creator/designs");
    await settle(creator);
    const row = creator.getByTestId("design-row").filter({ hasText: FIRST });
    await expect(row.getByText("Live")).toBeVisible();
    await expect(row.locator('input[type="number"]')).toHaveValue("77");
    await expect(row.getByText(/Epic/)).toBeVisible();
  });
});

test.describe("what the public sees", () => {
  test("the creator's page lists the live design; an unknown creator is not found", async ({ pageAs }) => {
    const page = await pageAs("entrant1");
    const problems = watch(page);
    await page.goto(`/dashboard/efootball/creators/${creatorId()}`);
    await settle(page);
    await expect(page.getByText("Designs on sale")).toBeVisible();
    await expect(page.getByText("Creative artist").first()).toBeVisible();
    const design = page.getByRole("link", { name: new RegExp(FIRST) });
    await expect(design).toBeVisible();
    await expect(design).toHaveAttribute("href", /\/dashboard\/efootball\/store\?.*creator=/);
    await expect(page.getByText(SECOND)).toHaveCount(0);

    await page.goto("/dashboard/efootball/creators/00000000-0000-4000-8000-000000000000");
    await settle(page);
    await expect(page.getByText("Creator not found.")).toBeVisible();
    expectHealthy(problems, "public creator page");
  });

  test("the store shows it with the creator's name, filtered to this creator", async ({ pageAs }) => {
    const page = await pageAs("entrant1");
    await page.goto(`/dashboard/efootball/store?cat=badge&creator=${creatorId()}`);
    await settle(page);
    await expect(page.getByTestId("store-creator-filter")).toBeVisible();
    await expect(page.getByText(FIRST).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(new RegExp(`by ${actor("creator").name}`)).first()).toBeVisible();

    // The creator sees their own design marked as theirs, not as something to buy.
    const own = await pageAs("creator");
    await own.goto(`/dashboard/efootball/store?cat=badge&creator=${creatorId()}`);
    await settle(own);
    await expect(own.getByText("Your design").first()).toBeVisible({ timeout: 20_000 });
  });

  test("the creator's own profile page shows the showcase", async ({ pageAs }) => {
    const page = await pageAs("creator");
    const problems = watch(page);
    await page.goto("/dashboard/creator/profile");
    await settle(page);
    await expect(page.getByText("Designs on sale")).toBeVisible();
    await expect(page.getByText(FIRST)).toBeVisible();
    expectHealthy(problems, "creator profile");
  });
});
