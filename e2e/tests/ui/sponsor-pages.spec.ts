import { APP_URL } from "../../lib/env";
import { castApis, type RoleKey } from "../../lib/cast";
import { expect, expectHealthy, settle, test, watch } from "../../lib/ui";

/**
 * The sponsor's pages and the community leaders' side, button by button: the hub, the brand
 * form, opportunities and the offer dialog, the deals (every button each side sees), the
 * sponsors section on a community page (requests, call for sponsors, tiles), the directory
 * and "Ask to sponsor", the public brand page, sponsored posts and staff verification.
 */
const { cast, as, actor } = castApis();
const C = cast.communityId;
const COMMUNITY = `E2E ${cast.runId} Community`;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const BRAND = `E2E ${cast.runId} Alpha Gear`;
const BRAND2 = `E2E ${cast.runId} Beta Energy`;

/** Closes every open deal of both sponsors so each test starts clean (a kept cast can have old ones). */
async function clearDeals() {
  for (const key of ["sponsor", "sponsor2"] as RoleKey[]) {
    for (const d of (await as(key).get("/sponsors/me")).deals) {
      if (d.status === "pending") await as(key).raw("POST", `/sponsorships/${d.id}/cancel`, {});
      if (d.status === "active") await as(key).raw("POST", `/sponsorships/${d.id}/end`, {});
    }
  }
}
const sponsorCard = (within: import("@playwright/test").Page | import("@playwright/test").Locator) => within.getByTestId("sponsorship-card");

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  // The dev server compiles a page the first time anyone opens it: open them all once now.
  test.setTimeout(600_000);
  const routes = [
    "/dashboard/sponsor", "/dashboard/sponsor/deals", "/dashboard/sponsor/opportunities", "/dashboard/sponsor/posts", "/dashboard/sponsor/posts/new",
    "/dashboard/sponsor/profile", "/dashboard/efootball/sponsors", `/dashboard/efootball/sponsors/${actor("sponsor").userId}`,
    `/dashboard/efootball/community/${C}`, "/dashboard/admin/sponsors", "/dashboard/admin/coaching",
  ];
  for (let i = 0; i < routes.length; i += 3) await Promise.all(routes.slice(i, i + 3).map((p) => fetch(`${APP_URL}${p}`).catch(() => undefined)));
  await clearDeals();
});
test.afterAll(async () => {
  await clearDeals();
});

test.describe("someone who isn't a sponsor", () => {
  test("sees an invitation to add the Sponsor role, not the hub", async ({ pageAs }) => {
    const page = await pageAs("entrant1");
    const problems = watch(page);
    await page.goto("/dashboard/sponsor");
    await settle(page);
    await expect(page.getByRole("button", { name: /Add the Sponsor role/ })).toBeVisible();
    await expect(page.getByTestId("sponsor-spent")).toHaveCount(0);
    expectHealthy(problems, "non-sponsor at /dashboard/sponsor");
  });
});

test.describe("the hub and the menu", () => {
  test("the tiles, the link to the public page, and every menu item", async ({ pageAs }) => {
    const page = await pageAs("sponsor");
    const problems = watch(page);
    await page.goto("/dashboard/sponsor");
    await settle(page);
    await expect(page.getByRole("heading", { name: "Sponsor hub" })).toBeVisible();
    for (const label of ["Logo & banner views", "Clicks", "Post reach", "Spent"]) await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    await expect(page.getByTestId("sponsor-spent")).toBeVisible();
    await expect(page.getByRole("link", { name: "View my sponsor page" })).toHaveAttribute("href", new RegExp(`/dashboard/efootball/sponsors/${actor("sponsor").userId}`));

    for (const [name, url] of [
      ["My posts", /\/dashboard\/sponsor\/posts/],
      ["Sponsorships", /\/dashboard\/sponsor\/deals/],
      ["Opportunities", /\/dashboard\/sponsor\/opportunities/],
      ["Sponsors", /\/dashboard\/efootball\/sponsors/],
      ["Sponsor dashboard", /\/dashboard\/sponsor$/],
    ] as const) {
      await page.getByRole("link", { name, exact: true }).first().click();
      await expect(page, name).toHaveURL(url);
      await settle(page);
    }
    expectHealthy(problems, "sponsor hub");
  });
});

test.describe("the brand form", () => {
  test("a one-letter brand can't be saved; a good one saves, with a logo, and holds after a reload", async ({ pageAs }) => {
    const page = await pageAs("sponsor");
    const problems = watch(page);
    await page.goto("/dashboard/sponsor/profile");
    await settle(page);
    const form = page.getByTestId("sponsor-profile-form");
    await expect(form.getByRole("heading", { name: "Brand profile" })).toBeVisible();

    await form.getByTestId("sponsor-brand-name").fill("x");
    await form.getByRole("button", { name: "Save brand" }).click();
    await expect(page.getByText("Brand saved.")).toHaveCount(0);

    await form.getByTestId("sponsor-brand-name").fill(BRAND);
    await form.getByLabel("Industry").fill("Gaming gear");
    await form.getByLabel("Tagline").fill("Gear that wins");
    // ("About" also appears in the banner's hint text, so ask for the text box.)
    await form.getByRole("textbox", { name: "About", exact: true }).fill("Automated brand story.");
    await form.getByLabel("Website").fill("https://example.com/e2e");
    await form.getByLabel("Facebook page").fill("https://facebook.com/e2e");
    await form.getByTestId("sponsor-logo").setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: PNG });
    await form.getByTestId("sponsor-banner").setInputFiles({ name: "banner.png", mimeType: "image/png", buffer: PNG });
    await expect(page.locator("img[src^='blob:']").first()).toBeVisible();
    await form.getByRole("button", { name: "Save brand" }).click();
    await expect(page.getByText("Brand saved.")).toBeVisible();

    await page.reload();
    await settle(page);
    await expect(page.getByTestId("sponsor-brand-name")).toHaveValue(BRAND);
    await expect(page.getByLabel("Tagline")).toHaveValue("Gear that wins");
    await expect(page.getByLabel("Website")).toHaveValue("https://example.com/e2e");
    await expect(page.getByLabel("Industry")).toHaveValue("Gaming gear");
    expectHealthy(problems, "sponsor brand form");
  });
});

test.describe("opportunities and the offer dialog", () => {
  test("an open call is listed with what it wants; the dialog checks the length and sends the request", async ({ pageAs }) => {
    await clearDeals();
    await as("commPresident").post("/sponsorships/calls", { targetType: "community", targetId: C, tiers: ["gold", "partner"], note: "e2e ui call note", askTk: 500 });
    const page = await pageAs("sponsor");
    const problems = watch(page);
    await page.goto("/dashboard/sponsor/opportunities");
    await settle(page);
    await expect(page.getByRole("heading", { name: "Looking for sponsors" })).toBeVisible();
    const call = page.getByTestId("sponsor-call").filter({ hasText: COMMUNITY });
    await expect(call).toBeVisible();
    await expect(call.getByText(/Wants: Gold, Partner/)).toBeVisible();
    await expect(call.getByText(/Hoping for/)).toBeVisible();
    await expect(call.getByText("e2e ui call note")).toBeVisible();

    await call.getByRole("button", { name: "Offer to sponsor" }).click();
    const dialog = page.getByTestId("sponsorship-modal");
    await expect(dialog.getByRole("heading", { name: `Sponsor ${COMMUNITY}` })).toBeVisible();
    // Partner is the starting tier; the three tiers are pressed one at a time.
    await expect(dialog.getByRole("button", { name: /^Partner/ })).toHaveAttribute("aria-pressed", "true");
    await dialog.getByRole("button", { name: /^Gold/ }).click();
    await expect(dialog.getByRole("button", { name: /^Gold/ })).toHaveAttribute("aria-pressed", "true");
    await expect(dialog.getByRole("button", { name: /^Partner/ })).toHaveAttribute("aria-pressed", "false");
    await expect(dialog.getByText("Community sponsorships run 7–365 days.")).toBeVisible();
    await expect(dialog.getByText(/The amount is held from your wallet now/)).toBeVisible();

    // A length under the minimum is refused by the server and the dialog stays open.
    await dialog.getByLabel("Days").fill("3");
    await dialog.getByTestId("sponsorship-amount").fill("250");
    await dialog.getByTestId("sponsorship-send").click();
    await expect(page.getByText(/7 to 365 days/)).toBeVisible();
    await expect(dialog).toBeVisible();

    await dialog.getByLabel("Days").fill("30");
    await dialog.getByLabel("Message").fill("e2e ui sponsor offer");
    await dialog.getByTestId("sponsorship-send").click();
    await expect(page.getByText("Request sent.")).toBeVisible();
    await expect(page.getByTestId("sponsorship-modal")).toHaveCount(0);
    expectHealthy(problems, "sponsor opportunities");
  });

  test("the dialog closes with Close and by clicking outside", async ({ pageAs }) => {
    const page = await pageAs("sponsor2");
    await page.goto("/dashboard/sponsor/opportunities");
    await settle(page);
    const row = page.locator("div").filter({ hasText: COMMUNITY }).filter({ has: page.getByRole("button", { name: "Offer to sponsor" }) }).last();
    await row.getByRole("button", { name: "Offer to sponsor" }).first().click();
    await expect(page.getByTestId("sponsorship-modal")).toBeVisible();
    await page.getByTestId("sponsorship-modal").getByRole("button", { name: "Close" }).click();
    await expect(page.getByTestId("sponsorship-modal")).toHaveCount(0);
    await row.getByRole("button", { name: "Offer to sponsor" }).first().click();
    await page.mouse.click(5, 5);
    await expect(page.getByTestId("sponsorship-modal")).toHaveCount(0);
  });
});

test.describe("the deal, from both sides", () => {
  test("the sponsor sees a waiting request: held money, Withdraw only", async ({ pageAs }) => {
    const page = await pageAs("sponsor");
    await page.goto("/dashboard/sponsor/deals");
    await settle(page);
    for (const tab of ["Open", "Active", "Past"]) await expect(page.getByRole("button", { name: new RegExp(`^${tab} ·`) })).toBeVisible();
    const card = sponsorCard(page).filter({ hasText: COMMUNITY });
    await expect(card).toBeVisible();
    await expect(card.getByText("Waiting for them", { exact: false })).toBeVisible();
    await expect(card.getByText(/held from your wallet/)).toBeVisible();
    await expect(card.getByRole("button", { name: "Withdraw" })).toBeVisible();
    for (const name of ["Counter", "Decline"]) await expect(card.getByRole("button", { name })).toHaveCount(0);
    await expect(card.getByText(/Offers \(1\)/)).toBeVisible();
  });

  test("the community President sees it on the community page and counters", async ({ pageAs }) => {
    const page = await pageAs("commPresident");
    const problems = watch(page);
    await page.goto(`/dashboard/efootball/community/${C}`);
    await settle(page);
    const section = page.getByTestId("sponsors-section");
    await expect(section.getByRole("heading", { name: "Sponsors", exact: true })).toBeVisible();
    await expect(section.getByRole("heading", { name: "Sponsorship requests" })).toBeVisible();
    await expect(section.getByTestId("find-sponsors")).toBeVisible();
    const card = sponsorCard(section).filter({ hasText: BRAND });
    await expect(card).toBeVisible();
    for (const name of ["Accept", "Counter", "Decline"]) await expect(card.getByRole("button", { name, exact: true })).toBeVisible();

    await card.getByRole("button", { name: "Counter", exact: true }).click();
    const dialog = page.getByTestId("sponsorship-modal");
    await expect(dialog.getByRole("heading", { name: "Counter-offer" })).toBeVisible();
    await expect(dialog.getByText(/Nothing is paid now/)).toBeVisible();
    await dialog.getByTestId("sponsorship-amount").fill("300");
    await dialog.getByTestId("sponsorship-send").click();
    await expect(page.getByText("Counter-offer sent.")).toBeVisible();
    await expect(sponsorCard(section).filter({ hasText: BRAND }).getByRole("button", { name: "Withdraw" })).toBeVisible();
    expectHealthy(problems, "community sponsors section (host)");
  });

  test("an ordinary member sees the sponsors but none of the host controls", async ({ pageAs }) => {
    const page = await pageAs("commMember");
    await page.goto(`/dashboard/efootball/community/${C}`);
    await settle(page);
    await expect(page.getByTestId("find-sponsors")).toHaveCount(0);
    await expect(page.getByTestId("sponsor-call-button")).toHaveCount(0);
    await expect(page.getByText("Sponsorship requests")).toHaveCount(0);
  });

  test("the sponsor accepts the counter and pays; the sponsor shows on the community page; ending asks first", async ({ pageAs }) => {
    const page = await pageAs("sponsor");
    const problems = watch(page);
    await page.goto("/dashboard/sponsor/deals");
    await settle(page);
    const card = sponsorCard(page).filter({ hasText: COMMUNITY });
    // It is the sponsor's turn: the three answers are offered, and Withdraw is not.
    for (const name of [/^Accept & pay/, /^Counter/, /^Decline/]) await expect(card.getByRole("button", { name })).toBeVisible();
    await expect(card.getByRole("button", { name: "Withdraw" })).toHaveCount(0);
    await card.getByTestId("sponsorship-accept").click();
    await expect(page.getByText("Sponsorship is active.")).toBeVisible();
    await page.getByRole("button", { name: /^Active ·/ }).click();
    const active = sponsorCard(page).filter({ hasText: COMMUNITY });
    await expect(active.getByText(/Until/)).toBeVisible();

    // The community page now lists the sponsor under its tier.
    const host = await pageAs("commPresident");
    await host.goto(`/dashboard/efootball/community/${C}`);
    await settle(host);
    await expect(host.getByTestId("sponsor-tile").filter({ hasText: BRAND })).toBeVisible();

    // Ending asks first, and says the money isn't refunded.
    let asked = "";
    page.once("dialog", (d) => {
      asked = d.message();
      void d.dismiss();
    });
    await active.getByRole("button", { name: "End sponsorship" }).click();
    expect(asked).toContain("isn't refunded");
    await expect(active.getByRole("button", { name: "End sponsorship" })).toBeVisible();
    page.once("dialog", (d) => void d.accept());
    await active.getByRole("button", { name: "End sponsorship" }).click();
    await expect(page.getByText("Sponsorship ended.")).toBeVisible();
    await page.getByRole("button", { name: /^Past ·/ }).click();
    await expect(sponsorCard(page).filter({ hasText: COMMUNITY })).toBeVisible();
    expectHealthy(problems, "sponsor deals");
  });

  test("a host can decline a request, and the sponsor sees it as declined", async ({ pageAs }) => {
    await clearDeals();
    await as("sponsor").post("/sponsorships", { targetType: "community", targetId: C, tier: "partner", amountTk: 120, days: 14, message: "e2e ui decline me" });
    const host = await pageAs("commVicePresident");
    await host.goto(`/dashboard/efootball/community/${C}`);
    await settle(host);
    const card = sponsorCard(host).filter({ hasText: "e2e ui decline me" });
    await card.getByRole("button", { name: "Decline", exact: true }).click();
    await expect(host.getByText("Declined.")).toBeVisible();

    const page = await pageAs("sponsor");
    await page.goto("/dashboard/sponsor/deals");
    await settle(page);
    await page.getByRole("button", { name: /^Past ·/ }).click();
    await expect(sponsorCard(page).filter({ hasText: "e2e ui decline me" }).getByText("Declined")).toBeVisible();
  });
});

test.describe("the call for sponsors", () => {
  test("a leader edits and closes the call; a call needs at least one tier", async ({ pageAs }) => {
    await clearDeals();
    const page = await pageAs("commPresident");
    await page.goto(`/dashboard/efootball/community/${C}`);
    await settle(page);
    const section = page.getByTestId("sponsors-section");
    await expect(section.getByText(/Looking for sponsors/).first()).toBeVisible();
    await section.getByTestId("sponsor-call-button").click();
    // With no tier ticked the call can't be saved.
    for (const tier of ["Title", "Gold", "Partner"]) {
      const box = section.getByLabel(tier, { exact: true });
      if (await box.isChecked()) await box.uncheck();
    }
    await expect(section.getByRole("button", { name: "Ask for sponsors" })).toBeDisabled();
    await section.getByLabel("Title", { exact: true }).check();
    await section.getByLabel("What you offer sponsors").fill("e2e ui edited call");
    await section.getByRole("button", { name: "Ask for sponsors" }).click();
    await expect(page.getByText("Call for sponsors is open.")).toBeVisible();

    await section.getByRole("button", { name: "Close call" }).click();
    await expect(page.getByText("Call closed.")).toBeVisible();
    await expect(section.getByRole("button", { name: "Close call" })).toHaveCount(0);
    await expect(section.getByTestId("sponsor-call-button")).toHaveText("Ask for sponsors");
  });
});

test.describe("the sponsors directory", () => {
  test("search, the empty state and Verified only", async ({ pageAs }) => {
    const page = await pageAs("sponsor");
    const problems = watch(page);
    await page.goto("/dashboard/efootball/sponsors");
    await settle(page);
    await expect(page.getByRole("heading", { name: "Sponsors", exact: true }).first()).toBeVisible();
    await page.getByPlaceholder("Search brands").fill(cast.runId);
    await expect(page.getByTestId("sponsor-card").filter({ hasText: BRAND })).toBeVisible();
    await expect(page.getByTestId("sponsor-card").filter({ hasText: BRAND2 })).toBeVisible();
    await page.getByPlaceholder("Search brands").fill("zzzz-no-such-brand");
    await expect(page.getByText("No sponsors found.")).toBeVisible();
    await page.getByPlaceholder("Search brands").fill(cast.runId);
    await page.getByLabel("Verified only").check();
    await expect(page.getByText("No sponsors found.")).toBeVisible();
    expectHealthy(problems, "sponsor directory");
  });

  test("a community leader asks a sponsor to sponsor; the sponsor sees the request and can decline it", async ({ pageAs }) => {
    await clearDeals();
    const host = await pageAs("commPresident");
    await host.goto(`/dashboard/efootball/sponsors?for=community:${C}`);
    await settle(host);
    await expect(host.getByText(`Asking sponsors for: ${COMMUNITY}`)).toBeVisible();
    await host.getByPlaceholder("Search brands").fill(BRAND2);
    const card = host.getByTestId("sponsor-card").filter({ hasText: BRAND2 });
    await card.getByTestId("ask-sponsor").click();
    const dialog = host.getByTestId("sponsorship-modal");
    await expect(dialog.getByRole("heading", { name: `Ask ${BRAND2} to sponsor` })).toBeVisible();
    await expect(dialog.getByText(/Nothing is paid now/)).toBeVisible();
    await dialog.getByTestId("sponsorship-amount").fill("200");
    await dialog.getByLabel("Message").fill("e2e ui ask");
    await dialog.getByTestId("sponsorship-send").click();
    await expect(host.getByText("Request sent.")).toBeVisible();

    const page = await pageAs("sponsor2");
    await page.goto("/dashboard/sponsor/deals");
    await settle(page);
    const asked = sponsorCard(page).filter({ hasText: "e2e ui ask" });
    await expect(asked.getByRole("button", { name: "Decline" })).toBeVisible();
    await asked.getByRole("button", { name: "Decline" }).click();
    await expect(page.getByText("Declined.")).toBeVisible();

    // Someone who doesn't run anything has no one to ask for.
    const other = await pageAs("entrant1");
    await other.goto("/dashboard/efootball/sponsors");
    await settle(other);
    await expect(other.getByTestId("ask-sponsor")).toHaveCount(0);
  });
});

test.describe("the public brand page", () => {
  test("shows the brand; a visitor can follow; the brand can't follow itself; an unknown brand is not found", async ({ pageAs }) => {
    const visitor = await pageAs("entrant1");
    const problems = watch(visitor);
    await visitor.goto(`/dashboard/efootball/sponsors/${actor("sponsor").userId}`);
    await settle(visitor);
    await expect(visitor.getByRole("heading", { name: BRAND })).toBeVisible();
    await expect(visitor.getByText("Gear that wins")).toBeVisible();
    await expect(visitor.getByRole("link", { name: "Website" })).toHaveAttribute("href", "https://example.com/e2e");
    await visitor.getByRole("button", { name: /Follow/ }).click();
    await expect(visitor.getByRole("button", { name: /Following/ })).toBeVisible();
    await visitor.getByRole("button", { name: /Following/ }).click();
    await expect(visitor.getByRole("button", { name: /\+ Follow/ })).toBeVisible();

    const own = await pageAs("sponsor");
    await own.goto(`/dashboard/efootball/sponsors/${actor("sponsor").userId}`);
    await settle(own);
    await expect(own.getByRole("button", { name: /Follow/ })).toHaveCount(0);

    await visitor.goto("/dashboard/efootball/sponsors/00000000-0000-4000-8000-000000000000");
    await settle(visitor);
    await expect(visitor.getByText("Sponsor not found.")).toBeVisible();
    expectHealthy(problems, "public sponsor page");
  });
});

test.describe("sponsored posts", () => {
  test("an empty post is refused; a post waits for staff, shows its status, and can be deleted", async ({ pageAs }) => {
    const page = await pageAs("sponsor");
    const problems = watch(page);
    await page.goto("/dashboard/sponsor/posts");
    await settle(page);
    await page.getByRole("link", { name: "New sponsored post" }).click();
    await expect(page).toHaveURL(/\/dashboard\/sponsor\/posts\/new/);
    await page.getByRole("button", { name: "Submit for review" }).click();
    await expect(page.locator('p[role="alert"]')).toHaveText("What's this tutorial about?");

    // (The composer is the coach one, so its text box is labelled "New post".)
    await page.getByLabel("New post", { exact: true }).fill("E2E UI sponsored: new gear drop");
    await page.getByRole("button", { name: "Submit for review" }).click();
    await expect(page).toHaveURL(/\/dashboard\/sponsor\/posts/);
    const post = page.getByTestId("coach-post").filter({ hasText: "new gear drop" });
    await expect(post).toBeVisible();
    await expect(post.getByText("Only you can see this until it's approved")).toBeVisible();

    page.once("dialog", (d) => void d.dismiss());
    await post.getByRole("button", { name: "Delete" }).click();
    await expect(post).toBeVisible();
    page.once("dialog", (d) => void d.accept());
    await post.getByRole("button", { name: "Delete" }).click();
    await expect(post).toHaveCount(0);
    expectHealthy(problems, "sponsored posts");
  });

  test("staff approve a sponsored post in the posts review: it is marked Sponsored", async ({ pageAs }) => {
    const sent = new FormData();
    sent.append("body", "E2E UI sponsored: approve me");
    const res = await fetch(`${process.env.E2E_API_URL ?? "http://localhost:3001"}/sponsors/me/posts`, { method: "POST", headers: { authorization: `Bearer ${actor("sponsor").token}` }, body: sent });
    expect(res.status).toBe(201);

    const page = await pageAs("moderator");
    await page.goto("/dashboard/admin/coaching");
    await settle(page);
    await page.getByTestId("post-author-filter").getByRole("button", { name: "Sponsor" }).click();
    const post = page.getByTestId("coach-post").filter({ hasText: "approve me" });
    await expect(post).toBeVisible();
    await expect(page.getByText("Sponsored").first()).toBeVisible();
    await page.getByRole("button", { name: "Approve" }).first().click();
    await expect(page.getByText("Approved").first()).toBeVisible();

    const mine = await pageAs("sponsor");
    await mine.goto("/dashboard/sponsor/posts");
    await settle(mine);
    await expect(mine.getByTestId("coach-post").filter({ hasText: "approve me" }).getByText("Public")).toBeVisible();
  });
});

test.describe("staff: the sponsors list and verification", () => {
  test("a moderator sees the brands and their deals but can't verify", async ({ pageAs }) => {
    const page = await pageAs("moderator");
    const problems = watch(page);
    await page.goto("/dashboard/admin/sponsors");
    await settle(page);
    await page.getByRole("textbox").first().fill(cast.runId);
    const card = page.getByTestId("admin-sponsor").filter({ hasText: BRAND });
    await expect(card).toBeVisible();
    await expect(card.getByText("Recent deals")).toBeVisible();
    await expect(card.getByRole("button", { name: "Verify" })).toHaveCount(0);
    await expect(card.getByRole("link", { name: BRAND })).toBeVisible();
    expectHealthy(problems, "admin sponsors (moderator)");
  });

  test("an admin verifies a brand and removes the badge; the directory lists verified brands first", async ({ pageAs }) => {
    const page = await pageAs("admin");
    await page.goto("/dashboard/admin/sponsors");
    await settle(page);
    await page.getByRole("textbox").first().fill(cast.runId);
    const card = page.getByTestId("admin-sponsor").filter({ hasText: BRAND2 });
    await card.getByRole("button", { name: "Verify" }).click();
    await expect(page.getByText("Sponsor verified.")).toBeVisible();

    const dir = await pageAs("entrant1");
    await dir.goto("/dashboard/efootball/sponsors");
    await settle(dir);
    await dir.getByPlaceholder("Search brands").fill(cast.runId);
    await expect(dir.getByTestId("sponsor-card").first()).toContainText(BRAND2);
    await dir.getByLabel("Verified only").check();
    await expect(dir.getByTestId("sponsor-card")).toHaveCount(1);

    await page.getByTestId("admin-sponsor").filter({ hasText: BRAND2 }).getByRole("button", { name: "Remove badge" }).click();
    await expect(page.getByText("Badge removed.")).toBeVisible();
  });
});
