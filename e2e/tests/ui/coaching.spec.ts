import { randomBytes } from "node:crypto";
import { anon, Api } from "../../lib/api";
import { COMPLETE_PROFILE, writeStorageState } from "../../lib/actors";
import { authFile } from "../../lib/env";
import { castApis } from "../../lib/cast";
import { expect, expectHealthy, settle, test, watch } from "../../lib/ui";

/** Role picker, the coach area, staff approval of posts, and a club hiring a coach in the browser. */
const { cast, as, actor } = castApis();
// 1×1 PNG for the post upload.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

test.describe.configure({ mode: "serial" });

test.describe("what suits you best", () => {
  test("a user who never picked sees the picker once; the first pick is the default", async ({ browser }) => {
    // A fresh account that hasn't answered yet.
    const email = `e2e+${cast.runId}-picker@allynq.test`;
    const res = await anon.post("/auth/register", { email, password: `E2e!${randomBytes(6).toString("hex")}`, name: "E2E Picker", phoneNumber: "+8801711112222" });
    await new Api(res.accessToken).patch("/users/me", COMPLETE_PROFILE);
    writeStorageState({ key: "picker", email, password: "", name: "E2E Picker", userId: res.user.id, profileId: "", token: res.accessToken });
    const ctx = await browser.newContext({ storageState: authFile("picker"), locale: "en-US" });
    const page = await ctx.newPage();
    const problems = watch(page);

    await page.goto("/dashboard/efootball");
    await expect(page).toHaveURL(/\/welcome/);
    await page.getByRole("checkbox", { name: "Coach" }).click();
    await page.getByRole("checkbox", { name: "Player" }).click();
    // Coach was picked first: it's the default.
    await expect(page.getByText("Default").first()).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/dashboard\/coach/);

    const me = await new Api(res.accessToken).me();
    expect(me.roles).toEqual(["coach", "player"]);
    expect(me.primaryRole).toBe("coach");

    // Never again.
    await page.goto("/dashboard/efootball");
    await settle(page);
    await expect(page).toHaveURL(/\/dashboard\/efootball/);
    expectHealthy(problems, "role picker");
    await ctx.close();
  });

  test("roles are changed on the central profile; the coach switches to his coach profile", async ({ pageAs }) => {
    const page = await pageAs("coach");
    await page.goto("/dashboard/profile");
    await settle(page);
    await expect(page.getByTestId("my-roles")).toBeVisible();
    // The profile switch offers his Coach profile.
    await page.getByTestId("profile-mode-bar").getByRole("button", { name: "Coach" }).click();
    await expect(page).toHaveURL(/\/dashboard\/coach\/profile/);
  });

  test("the other new roles open a coming-soon page", async ({ pageAs }) => {
    const page = await pageAs("entrant1");
    await page.goto("/dashboard/roles/sponsor");
    await expect(page.getByRole("heading", { name: "Sponsor: coming soon" })).toBeVisible();
  });
});

test.describe("coach posts need approval", () => {
  const body = `E2E ${cast.runId} first touch drills`;

  test("the coach posts a tutorial with a photo; it waits for review", async ({ pageAs }) => {
    const page = await pageAs("coach");
    const problems = watch(page);
    await page.goto("/dashboard/coach/posts");
    await settle(page);
    await page.getByRole("link", { name: "New post" }).click();
    await expect(page).toHaveURL(/\/dashboard\/coach\/posts\/new/);
    await page.getByRole("textbox", { name: "New post" }).fill(body);
    await page.getByPlaceholder("One link per line").fill("https://youtu.be/dQw4w9WgXcQ");
    await page.getByTestId("coach-post-files").setInputFiles({ name: "drill.png", mimeType: "image/png", buffer: PNG });
    await page.getByRole("button", { name: "Submit for review" }).click();
    // Back on the list.
    await expect(page).toHaveURL(/\/dashboard\/coach\/posts\?sent=1/);
    const post = page.getByTestId("coach-post").filter({ hasText: body });
    await expect(post).toBeVisible();
    await expect(post.getByText("In review")).toBeVisible();
    await expect(post.locator("img")).toHaveCount(1);
    expectHealthy(problems, "coach post");

    // Not public yet.
    const other = await pageAs("entrant2");
    await other.goto(`/dashboard/efootball/coaches/${actor("coach").userId}`);
    await settle(other);
    await expect(other.getByText(body)).toHaveCount(0);
  });

  test("a moderator approves it and it goes public", async ({ pageAs }) => {
    const staff = await pageAs("moderator");
    await staff.goto("/dashboard/admin/coaching");
    await settle(staff);
    const row = staff.locator("div.grid").filter({ has: staff.getByText(body) }).first();
    await row.getByRole("button", { name: "Approve" }).click();
    await expect(staff.getByText(body)).toHaveCount(0);

    const viewer = await pageAs("entrant2");
    await viewer.goto(`/dashboard/efootball/coaches/${actor("coach").userId}`);
    await settle(viewer);
    await expect(viewer.getByText(body)).toBeVisible();
    await expect(viewer.locator('iframe[src*="youtube-nocookie.com/embed/dQw4w9WgXcQ"]')).toHaveCount(1);
  });
});

test.describe("a club hires the coach", () => {
  test("the club leader offers a deal through checkout; the coach accepts", async ({ pageAs }) => {
    const leader = await pageAs("alphaPresident");
    const problems = watch(leader);
    await leader.goto(`/dashboard/efootball/coaches/${actor("coach").userId}`);
    await settle(leader);
    await leader.getByRole("button", { name: "Offer a deal" }).click();
    const dialog = leader.getByRole("dialog");
    await dialog.getByLabel("Fee (৳)").fill("100");
    await dialog.getByLabel("Days").fill("14");
    await dialog.getByRole("button", { name: /Continue to payment/ }).click();
    await leader.getByRole("button", { name: "Pay 100 tk" }).click();
    await expect(leader.getByText("Payment successful")).toBeVisible();
    await leader.getByRole("button", { name: "Done" }).click();
    expectHealthy(problems, "offer a coach");

    const coach = await pageAs("coach");
    await coach.goto("/dashboard/coach/deals");
    await settle(coach);
    const deal = coach.getByTestId("coaching-deal").filter({ hasText: "E2E " + cast.runId + " Alpha" }).filter({ hasText: "Negotiating" }).first();
    await expect(deal).toBeVisible();
    await expect(deal.getByText(/You get ৳90 after the 10% platform cut/)).toBeVisible();
    await deal.getByRole("button", { name: "Accept" }).click();
    await expect(
      coach.getByTestId("coaching-deal").filter({ hasText: "E2E " + cast.runId + " Alpha" }).filter({ hasText: /Active|Starts later/ }).first(),
    ).toBeVisible();

    const clubDeals = await as("alphaPresident").get(`/coaching/clubs/${cast.clubs.alpha}`);
    expect([clubDeals.coach?.coach.id, ...clubDeals.open.map((d: any) => d.coach.id)]).toContain(actor("coach").userId);
  });

  test("the club page shows its coach panel", async ({ pageAs }) => {
    const page = await pageAs("alphaPlayer");
    await page.goto(`/dashboard/efootball/clubs/${cast.clubs.alpha}`);
    await settle(page);
    await expect(page.getByTestId("club-coaching")).toBeVisible();
  });
});
