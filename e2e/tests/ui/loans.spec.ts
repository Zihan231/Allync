import { castApis } from "../../lib/cast";
import { expect, expectHealthy, settle, test, watch } from "../../lib/ui";

/**
 * Loans in the browser: the request-loan button and its info on a public profile, the
 * borrow form, and the Squad tab's Borrowed / Lent out quick filters with the clubs strip.
 */
const { cast, as, actor } = castApis();
const A = cast.clubs.alpha;
const B = cast.clubs.beta;
let alphaName = "";
let betaName = "";

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  alphaName = (await as("alphaPresident").get(`/clubs/${A}`)).name;
  betaName = (await as("betaPresident").get(`/clubs/${B}`)).name;
  // Beta lends Beta Player Two to Alpha (free), Alpha agrees: a running loan for the squad views.
  const status = await as("alphaPresident").get(`/transfers/players/${actor("betaPlayer2").userId}`);
  if (status.loan) return;
  const loan = await as("betaPresident").post("/transfers/loans", {
    clubId: B,
    playerUserId: actor("betaPlayer2").userId,
    otherClubId: A,
    feeTk: 0,
    matches: 3,
    maxDays: 30,
  });
  await as("alphaPresident").post(`/transfers/loans/${loan.id}/respond`, { accept: true });
});

test.describe("public profile", () => {
  test("a club leader opens the borrow form with both clubs shown", async ({ pageAs }) => {
    const page = await pageAs("alphaPresident");
    const problems = watch(page);
    await page.goto(`/dashboard/efootball/players/${actor("betaPlayer").userId}`);
    await settle(page);
    const button = page.getByRole("button", { name: "Request loan" });
    await expect(button).toBeEnabled();
    await button.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: `Borrow ${actor("betaPlayer").name}` })).toBeVisible();
    await expect(dialog.getByText("His club", { exact: true })).toBeVisible();
    await expect(dialog.getByText(betaName).first()).toBeVisible();
    await expect(dialog.getByText(alphaName).first()).toBeVisible();
    await expect(dialog.getByRole("button", { name: /send loan proposal|continue/i })).toBeVisible();
    expectHealthy(problems, "borrow form");
  });

  test("the info icon explains how loans work", async ({ pageAs }) => {
    const page = await pageAs("alphaPresident");
    await page.goto(`/dashboard/efootball/players/${actor("betaPlayer").userId}`);
    await settle(page);
    await page.getByRole("button", { name: "How loans work" }).click();
    await expect(page.getByRole("dialog").getByText("How loans work").first()).toBeVisible();
  });

  test("a captain is told only leaders can request a loan", async ({ pageAs }) => {
    const page = await pageAs("alphaCaptain");
    await page.goto(`/dashboard/efootball/players/${actor("betaPlayer").userId}`);
    await settle(page);
    const button = page.getByRole("button", { name: "Request loan" });
    await expect(button).toHaveAttribute("aria-disabled", "true");
    // Still clickable on purpose: it opens the explanation (Playwright treats aria-disabled as disabled).
    await button.click({ force: true });
    await expect(page.getByText("Only a club's President or General Secretary can request a loan.").first()).toBeVisible();
  });

  test("a free agent has no club to borrow from", async ({ pageAs }) => {
    const page = await pageAs("alphaPresident");
    await page.goto(`/dashboard/efootball/players/${actor("entrant1").userId}`);
    await settle(page);
    await expect(page.getByRole("button", { name: "Request loan" })).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByRole("button", { name: "Request loan" })).toHaveAttribute("title", /isn't in a club/);
  });
});

test.describe("squad quick filters", () => {
  test("Borrowed shows the loaned player with his club inside the card", async ({ pageAs }) => {
    const page = await pageAs("alphaPlayer");
    const problems = watch(page);
    await page.goto(`/dashboard/efootball/clubs/${A}?tab=squad`);
    await settle(page);
    const chip = page.getByRole("button", { name: /^Borrowed \(\d+\)$/ });
    await expect(chip).toHaveText(/Borrowed \(1\)/);
    await chip.click();
    await expect(page.getByText(/Showing 1[–-]1 of 1/)).toBeVisible();
    const name = page.getByRole("link", { name: actor("betaPlayer2").name });
    await expect(name).toBeVisible();
    await expect(page.getByText(betaName).first()).toBeVisible();
    await expect(page.getByText("0/3").first()).toBeVisible();
    // Other members are filtered out.
    await expect(page.getByRole("link", { name: actor("alphaCaptain").name })).toHaveCount(0);
    expectHealthy(problems, "borrowed filter");
  });

  test("Lent out shows the parent club's players away on loan", async ({ pageAs }) => {
    const page = await pageAs("betaPlayer");
    await page.goto(`/dashboard/efootball/clubs/${B}?tab=squad`);
    await settle(page);
    const chip = page.getByRole("button", { name: /^Lent out \(\d+\)$/ });
    await expect(chip).toHaveText(/Lent out \(1\)/);
    await chip.click();
    const card = page.locator(`a[href="/dashboard/efootball/players/${actor("betaPlayer2").userId}"]`);
    await expect(card).toBeVisible();
    await expect(card.getByText(alphaName).first()).toBeVisible();
    await expect(card.getByText(betaName).first()).toBeVisible();
    await expect(card.getByText("0/3")).toBeVisible();
  });

  test("All players brings the full squad back", async ({ pageAs }) => {
    const page = await pageAs("alphaPlayer");
    await page.goto(`/dashboard/efootball/clubs/${A}?tab=squad`);
    await settle(page);
    await page.getByRole("button", { name: /^Borrowed/ }).click();
    await page.getByRole("button", { name: /^All players/ }).click();
    await expect(page.getByRole("link", { name: actor("alphaCaptain").name })).toBeVisible();
    await expect(page.getByRole("link", { name: actor("betaPlayer2").name })).toBeVisible();
  });
});
