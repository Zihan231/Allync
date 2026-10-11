import { castApis, type RoleKey } from "../../lib/cast";
import { expect, settle, test } from "../../lib/ui";

/** What each role sees: club settings for leaders, the staff menu by tier, organizer mode for everyone. */
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

test.describe("organizer mode", () => {
  test("any player can switch to organizer mode and back", async ({ pageAs }) => {
    const page = await pageAs("entrant1");
    await page.goto("/dashboard/efootball");
    await settle(page);
    await page.getByRole("button", { name: "Organizer", exact: true }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/organizer/);
    await expect(page.locator('a[href="/dashboard/organizer/create"]').first()).toBeVisible();
    await page.getByRole("button", { name: "Player", exact: true }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/efootball/);
  });

  test("only staff get the Admin mode", async ({ pageAs }) => {
    const player = await pageAs("entrant1");
    await player.goto("/dashboard/efootball");
    await settle(player);
    await expect(player.getByRole("button", { name: "Admin", exact: true })).toHaveCount(0);
    const staff = await pageAs("moderator");
    await staff.goto("/dashboard/admin");
    await settle(staff);
    await expect(staff.getByRole("button", { name: "Admin", exact: true }).first()).toBeVisible();
  });
});
