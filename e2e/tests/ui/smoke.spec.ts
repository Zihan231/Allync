import { castApis, type RoleKey } from "../../lib/cast";
import { expect, expectHealthy, settle, test, watch } from "../../lib/ui";

/**
 * Every page renders for the roles that use it: no crash, no API 5xx, not bounced to
 * login. Runs on desktop (`ui`) and on a phone viewport (`ui-mobile`).
 */
// Routes use :club / :community / :player and are filled in when the test runs, so test titles
// stay the same between test listing and running (the cast is made by setup in between).
const A = ":club";
const C = ":community";
const fill = (path: string) => {
  const { cast } = castApis();
  return path
    .replace(":club", cast.clubs.alpha)
    .replace(":community", cast.communityId)
    .replace(":player", cast.actors.alphaPlayer.userId);
};

const PLAYER_PAGES = [
  "/dashboard/efootball",
  "/dashboard/efootball/clubs",
  `/dashboard/efootball/clubs/${A}`,
  `/dashboard/efootball/clubs/${A}?tab=squad`,
  "/dashboard/efootball/community",
  `/dashboard/efootball/community/${C}`,
  "/dashboard/efootball/tournaments",
  "/dashboard/efootball/tournaments/general",
  "/dashboard/efootball/matches",
  "/dashboard/efootball/transfers",
  "/dashboard/efootball/wallet",
  "/dashboard/efootball/rankings",
  "/dashboard/efootball/store",
  "/dashboard/efootball/profile",
  "/dashboard/efootball/reports",
  "/dashboard/efootball/players/:player",
  "/dashboard/notifications",
];
const LEADER_PAGES = [`/dashboard/efootball/clubs/${A}/settings`, `/dashboard/efootball/clubs/${A}/requests`, `/dashboard/efootball/clubs/${A}/edit`];
const COMMUNITY_LEADER_PAGES = [`/dashboard/efootball/community/${C}/settings`, `/dashboard/efootball/community/${C}/requests`];
const ORGANIZER_PAGES = ["/dashboard/organizer", "/dashboard/efootball/tournaments/create?general=1"];
const ADMIN_PAGES = [
  "/dashboard/admin",
  "/dashboard/admin/users",
  "/dashboard/admin/reports",
  "/dashboard/admin/disputes",
  "/dashboard/admin/verification",
  "/dashboard/admin/transfers",
  "/dashboard/admin/store",
  "/dashboard/admin/announcements",
  "/dashboard/admin/health",
  "/dashboard/admin/activity",
  "/dashboard/admin/content",
  "/dashboard/admin/bin",
  "/dashboard/admin/settings",
  "/dashboard/admin/audit",
];

const visits: Array<{ role: RoleKey; pages: string[] }> = [
  { role: "alphaPlayer", pages: PLAYER_PAGES },
  { role: "alphaPresident", pages: LEADER_PAGES },
  { role: "commPresident", pages: COMMUNITY_LEADER_PAGES },
  { role: "organizer", pages: ORGANIZER_PAGES },
  { role: "superAdmin", pages: ADMIN_PAGES },
];

for (const { role, pages } of visits) {
  test.describe(`pages for ${role}`, () => {
    for (const path of pages) {
      test(`${path}`, async ({ pageAs }) => {
        const page = await pageAs(role);
        const problems = watch(page);
        await page.goto(fill(path));
        await settle(page);
        await expect(page).not.toHaveURL(/\/login/);
        await expect(page.locator("main")).toBeVisible();
        await expect(page.locator("main")).not.toBeEmpty();
        expectHealthy(problems, path);
      });
    }
  });
}

test.describe("guests", () => {
  for (const path of ["/dashboard", "/dashboard/efootball/wallet", "/dashboard/admin"]) {
    test(`${path} sends a guest to log in`, async ({ pageAs }) => {
      const page = await pageAs("guest");
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test("the landing, login and signup pages load", async ({ pageAs }) => {
    const page = await pageAs("guest");
    const problems = watch(page);
    for (const path of ["/", "/login", "/signup"]) {
      await page.goto(path);
      await settle(page);
      await expect(page.locator("body")).not.toBeEmpty();
    }
    expectHealthy(problems, "public pages");
  });
});
