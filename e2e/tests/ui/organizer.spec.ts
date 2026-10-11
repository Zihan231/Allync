import { castApis, track } from "../../lib/cast";
import { expect, expectHealthy, settle, test, watch } from "../../lib/ui";

/** Organizer mode in the browser: create a general tournament with a prize (paid into a hold), see it listed. */
const { cast, as } = castApis();
const NAME = `E2E ${cast.runId} UI Organizer Cup`;
const PRIZE = 50;

const localInput = (days: number) => {
  const d = new Date(Date.now() + days * 24 * 3600_000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
};

test.describe.configure({ mode: "serial" });

test("an organizer creates a general tournament and pays the prize into a hold", async ({ pageAs }) => {
  const before = await as("organizer").myWallet();
  const page = await pageAs("organizer");
  const problems = watch(page);
  await page.goto("/dashboard/organizer/create");
  await settle(page);

  await page.getByLabel("Tournament Title").fill(NAME);
  await page.getByLabel("Tournament Starting Time *").fill(localInput(4));
  // Paid entry shows the fee field.
  await page.getByRole("button", { name: "Paid Entry", exact: true }).click();
  await page.getByLabel("Entry Fee (BDT ৳)").fill("10");
  await page.getByLabel("Prize Pool (BDT ৳ - 0 for Friendly)").fill(String(PRIZE));
  await page.getByRole("button", { name: "Publish Tournament" }).click();

  const pay = page.getByRole("button", { name: `Pay ${PRIZE} tk` });
  await expect(pay).toBeVisible();
  await pay.click();
  // After the checkout the new tournament opens.
  await expect(page).toHaveURL(/\/tournaments\/[0-9a-f-]{36}/, { timeout: 30_000 });
  // Regression: a paid tournament used to show "Free Entry" (the API has no isPaid flag).
  await expect(page.getByText("Free to enter")).toHaveCount(0);
  await expect(page.getByText(/10/).filter({ hasText: /entry/i }).first()).toBeVisible();
  await expect(page.getByText("You organize this tournament, so you can't take part in it.")).toBeVisible();
  const id = page.url().match(/tournaments\/([0-9a-f-]{36})/)![1];
  track("tournaments", id);

  const t = await as("organizer").get(`/tournaments/${id}`);
  expect(t.name).toBe(NAME);
  expect(t.communityId ?? null).toBeNull();
  expect(t.hostClubId ?? null).toBeNull();
  const after = await as("organizer").myWallet();
  expect(after.heldTk - before.heldTk).toBe(PRIZE);
  expectHealthy(problems, "organizer create");
});

test("the new tournament shows on General tournaments and the organizer dashboard", async ({ pageAs }) => {
  const player = await pageAs("entrant2");
  await player.goto("/dashboard/efootball/tournaments/general");
  await settle(player);
  await expect(player.getByText(NAME).first()).toBeVisible();

  const organizer = await pageAs("organizer");
  await organizer.goto("/dashboard/organizer");
  await settle(organizer);
  await expect(organizer.getByText(NAME).first()).toBeVisible();
});
