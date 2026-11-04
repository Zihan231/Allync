import { randomBytes } from "node:crypto";
import type { Browser } from "@playwright/test";
import { anon, Api } from "../../lib/api";
import { COMPLETE_PROFILE, writeStorageState } from "../../lib/actors";
import { authFile } from "../../lib/env";
import { castApis } from "../../lib/cast";
import { expect, expectHealthy, settle, test, watch } from "../../lib/ui";

/**
 * The welcome page ("What suits you best?") and where each choice lands: four cards
 * (Player, Organizer, Sponsor, Esports professional); Esports professional opens
 * Creative artist, Social media expert and Coach; the rules, the default role, the pages
 * the roles open, the profile's role switch, and Bangla.
 */
const { cast } = castApis();

/** A brand-new account that hasn't answered the picker yet, in its own browser context. */
async function fresh(browser: Browser, label: string, opts: { bangla?: boolean } = {}) {
  // A random part keeps reruns against the same cast from colliding (cleanup still matches the run id).
  const email = `e2e+${cast.runId}-${label}-${randomBytes(3).toString("hex")}@allynq.test`;
  const phone = `+88017${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;
  const res = await anon.post("/auth/register", { email, password: `E2e!${randomBytes(6).toString("hex")}`, name: `E2E ${label}`, phoneNumber: phone });
  const api = new Api(res.accessToken);
  await api.patch("/users/me", COMPLETE_PROFILE);
  writeStorageState({ key: label, email, password: "", name: `E2E ${label}`, userId: res.user.id, profileId: "", token: res.accessToken });
  const ctx = await browser.newContext({ storageState: authFile(label), locale: "en-US" });
  if (opts.bangla) await ctx.addInitScript(() => localStorage.setItem("ALLYNQ-locale", "bn"));
  const page = await ctx.newPage();
  const problems = watch(page);
  await page.goto("/welcome");
  await settle(page);
  return { ctx, page, api, problems };
}

const card = (page: import("@playwright/test").Page, name: string) => page.getByRole("checkbox", { name, exact: true });

test.describe("the welcome page", () => {
  test("four cards; Esports professional opens its three roles; unticking it takes them away", async ({ browser }) => {
    const { ctx, page, problems } = await fresh(browser, "welcome-cards");
    for (const name of ["Player", "Organizer", "Sponsor", "Esports professional"]) await expect(card(page, name)).toBeVisible();
    // The three professional roles are not offered until the parent is picked.
    await expect(page.getByTestId("esports-pro-roles")).toHaveCount(0);
    for (const name of ["Creative artist", "Social media expert", "Coach"]) await expect(card(page, name)).toHaveCount(0);

    await card(page, "Esports professional").click();
    const sub = page.getByTestId("esports-pro-roles");
    await expect(sub).toBeVisible();
    for (const name of ["Creative artist", "Social media expert", "Coach"]) await expect(sub.getByRole("checkbox", { name, exact: true })).toBeVisible();

    await sub.getByRole("checkbox", { name: "Coach", exact: true }).click();
    await expect(sub.getByRole("checkbox", { name: "Coach", exact: true })).toHaveAttribute("aria-checked", "true");
    // Unticking the parent removes the group and forgets its roles.
    await card(page, "Esports professional").click();
    await expect(page.getByTestId("esports-pro-roles")).toHaveCount(0);
    await card(page, "Esports professional").click();
    await expect(page.getByTestId("esports-pro-roles").getByRole("checkbox", { name: "Coach", exact: true })).toHaveAttribute("aria-checked", "false");
    expectHealthy(problems, "welcome cards");
    await ctx.close();
  });

  test("Continue needs a choice, and Esports professional needs one of its roles", async ({ browser }) => {
    const { ctx, page, api } = await fresh(browser, "welcome-rules");
    // (Next.js has its own hidden role="alert" route announcer, so look at the page's message only.)
    const message = page.locator('p[role="alert"]');
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(message).toHaveText("Pick at least one.");

    await card(page, "Esports professional").click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(message).toContainText(/Pick at least one esports professional role/);
    // Nothing was saved, and the page is still the picker.
    await expect(page).toHaveURL(/\/welcome/);
    expect((await api.me()).rolesChosenAt).toBeNull();
    await ctx.close();
  });

  test("the first pick is the default; Esports professional itself can't be, and any other card can be made the default", async ({ browser }) => {
    const { ctx, page, api } = await fresh(browser, "welcome-default");
    await card(page, "Esports professional").click();
    await page.getByTestId("esports-pro-roles").getByRole("checkbox", { name: "Creative artist", exact: true }).click();
    await card(page, "Player").click();

    // Creative artist was the first real pick: it is the default; the parent card offers neither badge nor button.
    await expect(page.getByText("Default", { exact: true })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Make default" })).toHaveCount(1);
    await page.getByRole("button", { name: "Make default" }).click();
    await expect(page.getByText("Default", { exact: true })).toHaveCount(1);

    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/dashboard\/efootball/);
    const me = await api.me();
    expect(me.primaryRole).toBe("player");
    expect(me.roles).toEqual(["player", "esports_professional", "creative"]);
    await ctx.close();
  });

  test("each choice opens its own area", async ({ browser }) => {
    const cases: Array<{ label: string; pick: (page: import("@playwright/test").Page) => Promise<void>; url: RegExp; roles: string[]; primary: string }> = [
      {
        label: "welcome-creative",
        pick: async (page) => {
          await card(page, "Esports professional").click();
          await page.getByTestId("esports-pro-roles").getByRole("checkbox", { name: "Creative artist", exact: true }).click();
        },
        url: /\/dashboard\/creator/,
        roles: ["esports_professional", "creative"],
        primary: "creative",
      },
      {
        label: "welcome-coach",
        pick: async (page) => {
          await card(page, "Esports professional").click();
          await page.getByTestId("esports-pro-roles").getByRole("checkbox", { name: "Coach", exact: true }).click();
        },
        url: /\/dashboard\/coach/,
        roles: ["esports_professional", "coach"],
        primary: "coach",
      },
      {
        label: "welcome-sponsor",
        pick: async (page) => {
          await card(page, "Sponsor").click();
        },
        url: /\/dashboard\/sponsor/,
        roles: ["sponsor"],
        primary: "sponsor",
      },
      {
        label: "welcome-organizer",
        pick: async (page) => {
          await card(page, "Organizer").click();
        },
        url: /\/dashboard\/organizer/,
        roles: ["organizer"],
        primary: "organizer",
      },
    ];
    for (const c of cases) {
      const { ctx, page, api, problems } = await fresh(browser, c.label);
      await c.pick(page);
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page, c.label).toHaveURL(c.url);
      const me = await api.me();
      expect(me.roles, c.label).toEqual(c.roles);
      expect(me.primaryRole, c.label).toBe(c.primary);
      await settle(page);
      expectHealthy(problems, c.label);
      await ctx.close();
    }
  });

  test("a social media expert lands on the coming-soon page", async ({ browser }) => {
    const { ctx, page, api } = await fresh(browser, "welcome-social");
    await card(page, "Esports professional").click();
    await page.getByTestId("esports-pro-roles").getByRole("checkbox", { name: "Social media expert", exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/dashboard\/roles\/social/);
    await expect(page.getByRole("heading", { name: "Social media expert: coming soon" })).toBeVisible();
    expect((await api.me()).roles).toEqual(["esports_professional", "social"]);
    await ctx.close();
  });

  test("the add-a-role buttons add the group too", async ({ browser }) => {
    const { ctx, page, api } = await fresh(browser, "welcome-addrole");
    await card(page, "Player").click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/dashboard\/efootball/);

    await page.goto("/dashboard/coach");
    await settle(page);
    await page.getByRole("button", { name: "+ Coach" }).click();
    await expect(page.getByRole("link", { name: "View my public page" }).or(page.getByText("Set up your coach profile"))).toBeVisible();
    expect((await api.me()).roles).toEqual(["player", "esports_professional", "coach"]);

    await page.goto("/dashboard/creator");
    await settle(page);
    await page.getByRole("button", { name: /Add the Creative artist role|\+ Creative artist/ }).click();
    await expect.poll(async () => (await api.me()).roles).toEqual(["player", "esports_professional", "coach", "creative"]);

    await page.goto("/dashboard/sponsor");
    await settle(page);
    await page.getByRole("button", { name: /Sponsor/ }).first().click();
    await expect.poll(async () => (await api.me()).roles).toContain("sponsor");
    await ctx.close();
  });

  test("in Bangla the cards and the three roles are translated", async ({ browser }) => {
    const { ctx, page } = await fresh(browser, "welcome-bn", { bangla: true });
    await expect(page.getByRole("checkbox", { name: "এস্পোর্টস প্রফেশনাল", exact: true })).toBeVisible();
    await page.getByRole("checkbox", { name: "এস্পোর্টস প্রফেশনাল", exact: true }).click();
    const sub = page.getByTestId("esports-pro-roles");
    for (const name of ["ক্রিয়েটিভ আর্টিস্ট", "সোশ্যাল মিডিয়া এক্সপার্ট", "কোচ"]) await expect(sub.getByRole("checkbox", { name, exact: true })).toBeVisible();
    await page.getByRole("button", { name: "এগিয়ে যান" }).click();
    await expect(page.locator('p[role="alert"]')).toContainText("এস্পোর্টস প্রফেশনালের অন্তত একটি রোল");
    await ctx.close();
  });
});

test.describe("roles on the profile", () => {
  test("the profile switch has no page for the group itself; a role without an area yet is a link to its coming-soon page", async ({ pageAs }) => {
    const coach = await pageAs("coach2");
    await coach.goto("/dashboard/profile");
    await settle(coach);
    const bar = coach.getByTestId("profile-mode-bar");
    await expect(bar.getByText("Esports professional", { exact: true })).toBeVisible();
    await expect(bar.getByRole("link", { name: "Esports professional" })).toHaveCount(0);
    await expect(bar.getByRole("button", { name: "Coach" })).toBeVisible();

    const social = await pageAs("social");
    await social.goto("/dashboard/profile");
    await settle(social);
    await expect(social.getByTestId("profile-mode-bar").getByRole("link", { name: "Social media expert" })).toHaveAttribute("href", "/dashboard/roles/social");
  });

  test("My roles shows the group with the person's roles ticked, and refuses a group with nothing under it", async ({ pageAs }) => {
    const page = await pageAs("coach2");
    await page.goto("/dashboard/profile");
    await settle(page);
    const mine = page.getByTestId("my-roles");
    await expect(mine.getByRole("checkbox", { name: "Esports professional", exact: true })).toHaveAttribute("aria-checked", "true");
    await expect(mine.getByRole("checkbox", { name: "Coach", exact: true })).toHaveAttribute("aria-checked", "true");
    await expect(mine.getByRole("button", { name: "Save roles" })).toBeDisabled();

    // Taking the last role out of the group is refused on save, so nothing changes.
    await mine.getByRole("checkbox", { name: "Coach", exact: true }).click();
    await mine.getByRole("button", { name: "Save roles" }).click();
    await expect(mine.getByRole("alert")).toContainText(/Pick at least one esports professional role/);
  });

  test("the group's own address goes to a real page", async ({ pageAs }) => {
    const creator = await pageAs("creator");
    await creator.goto("/dashboard/roles/esports_professional");
    await expect(creator).toHaveURL(/\/dashboard\/creator/);

    const sponsor = await pageAs("sponsor");
    await sponsor.goto("/dashboard/roles/sponsor");
    await expect(sponsor).toHaveURL(/\/dashboard\/sponsor/);
  });
});
