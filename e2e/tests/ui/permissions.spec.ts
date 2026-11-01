import { castApis, type RoleKey } from "../../lib/cast";
import { expect, settle, test } from "../../lib/ui";

/** What each role sees: club settings for leaders, the staff menu by tier, and the profile switch. */
const { cast } = castApis();
const A = cast.clubs.alpha;
const C = cast.communityId;

test.describe("club controls", () => {
  const settingsLink = `a[href="/dashboard/efootball/clubs/${A}/settings"]`;
  const cases: Array<[RoleKey, boolean]> = [
    ["alphaPresident", true],
    ["alphaGs", true],
    ["alphaCaptain", false],
    ["alphaViceCaptain", false],
    ["alphaAcademyCaptain", false],
    ["alphaManager", false],
    ["alphaPlayer", false],
    ["betaPresident", false],
    ["entrant1", false],
  ];
  for (const [role, sees] of cases) {
    test(`${role} ${sees ? "sees" : "doesn't see"} club Settings`, async ({ pageAs }) => {
      const page = await pageAs(role);
      await page.goto(`/dashboard/efootball/clubs/${A}`);
      await settle(page);
      await expect(page.locator(settingsLink)).toHaveCount(sees ? 1 : 0);
    });
  }
});

test.describe("community controls", () => {
  const cases: Array<[RoleKey, boolean]> = [
    ["commPresident", true],
    ["commMember", false],
    ["entrant1", false],
  ];
  for (const [role, sees] of cases) {
    test(`${role} ${sees ? "sees" : "doesn't see"} community Settings`, async ({ pageAs }) => {
      const page = await pageAs(role);
      await page.goto(`/dashboard/efootball/community/${C}`);
      await settle(page);
      await expect(page.locator(`a[href="/dashboard/efootball/community/${C}/settings"]`)).toHaveCount(sees ? 1 : 0);
    });
  }
});

test.describe("staff menu by tier", () => {
  const ADMIN_ONLY = ["/dashboard/admin/store", "/dashboard/admin/transfers", "/dashboard/admin/bin"];
  const SUPER_ONLY = ["/dashboard/admin/settings", "/dashboard/admin/audit"];
  const cases: Array<[RoleKey, { admin: boolean; superAdmin: boolean }]> = [
    ["moderator", { admin: false, superAdmin: false }],
    ["admin", { admin: true, superAdmin: false }],
    ["superAdmin", { admin: true, superAdmin: true }],
  ];
  for (const [role, sees] of cases) {
    test(`${role} sees the right staff pages`, async ({ pageAs }) => {
      const page = await pageAs(role);
      await page.goto("/dashboard/admin");
      await settle(page);
      const nav = page.locator("aside, nav").first();
      await expect(page.locator('a[href="/dashboard/admin/users"]').first()).toBeVisible();
      for (const href of ADMIN_ONLY) await expect(nav.locator(`a[href="${href}"]`)).toHaveCount(sees.admin ? 1 : 0);
      for (const href of SUPER_ONLY) await expect(nav.locator(`a[href="${href}"]`)).toHaveCount(sees.superAdmin ? 1 : 0);
    });
  }

  for (const role of ["alphaPlayer", "organizer", "alphaPresident"] as RoleKey[]) {
    test(`${role} gets "Staff only" in the admin area`, async ({ pageAs }) => {
      const page = await pageAs(role);
      await page.goto("/dashboard/admin/users");
      await expect(page.getByRole("heading", { name: "Staff only" })).toBeVisible();
    });
  }
});

test.describe("profiles and modes", () => {
  test("an organizer switches profiles from his profile; Profile follows the mode", async ({ pageAs }) => {
    const page = await pageAs("organizer");
    await page.goto("/dashboard/efootball/profile");
    await settle(page);
    const bar = page.getByTestId("profile-mode-bar");
    await bar.getByRole("button", { name: "Organizer" }).click();
    await expect(page).toHaveURL(/\/dashboard\/organizer\/profile/);
    await expect(page.getByRole("heading", { name: "Organizer profile" })).toBeVisible();
    // The sidebar is the organizer menu now, with its own Profile.
    await expect(page.locator('aside a[href="/dashboard/organizer/create"]')).toBeVisible();
    // The top-bar menu opens the organizer profile too.
    await page.locator("header").getByRole("button").last().click();
    await expect(page.locator('header a[href="/dashboard/organizer/profile"]')).toBeVisible();

    await page.getByTestId("profile-mode-bar").getByRole("button", { name: "Player" }).click();
    await expect(page).toHaveURL(/\/dashboard\/efootball\/profile/);
  });

  test("the switch only offers the user's own profiles; Admin only for staff", async ({ pageAs }) => {
    const player = await pageAs("entrant1");
    await player.goto("/dashboard/profile");
    await settle(player);
    const bar = player.getByTestId("profile-mode-bar");
    await expect(bar.getByRole("button", { name: "Player" })).toBeVisible();
    await expect(bar.getByRole("button", { name: "Organizer" })).toHaveCount(0);
    await expect(bar.getByRole("button", { name: "Admin" })).toHaveCount(0);

    const staff = await pageAs("moderator");
    await staff.goto("/dashboard/profile");
    await settle(staff);
    await expect(staff.getByTestId("profile-mode-bar").getByRole("button", { name: "Admin" })).toBeVisible();
  });

  test("the sidebar has no mode switch any more", async ({ pageAs }) => {
    const page = await pageAs("organizer");
    await page.goto("/dashboard/efootball");
    await settle(page);
    await expect(page.locator("aside").getByRole("button", { name: "Organizer", exact: true })).toHaveCount(0);
  });
});
