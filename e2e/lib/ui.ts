import { test as base, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { API_URL, APP_URL, authFile } from "./env";
import { castApis, type RoleKey } from "./cast";

/** Uncaught page errors and failing (5xx) API calls seen by a page. */
export type Problems = { pageErrors: string[]; serverErrors: string[]; consoleErrors: string[] };

export function watch(page: Page): Problems {
  const problems: Problems = { pageErrors: [], serverErrors: [], consoleErrors: [] };
  page.on("pageerror", (err) => problems.pageErrors.push(err.message));
  page.on("response", (res) => {
    // The app calls the API directly or through its own /api proxy.
    const isApi = res.url().startsWith(API_URL) || res.url().startsWith(`${APP_URL}/api/`);
    if (isApi && res.status() >= 500) problems.serverErrors.push(`${res.status()} ${res.request().method()} ${res.url()}`);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.consoleErrors.push(msg.text().slice(0, 300));
  });
  return problems;
}

/** Fails on crashes and server errors; console noise is attached to the report, not failed on. */
export function expectHealthy(problems: Problems, label: string) {
  if (problems.consoleErrors.length) {
    base.info().annotations.push({ type: "console errors", description: `${label}: ${problems.consoleErrors.slice(0, 5).join(" | ")}` });
  }
  expect(problems.pageErrors, `${label}: uncaught errors`).toEqual([]);
  expect(problems.serverErrors, `${label}: API 5xx`).toEqual([]);
}

export async function contextAs(browser: Browser, role: RoleKey | "guest"): Promise<BrowserContext> {
  return browser.newContext(role === "guest" ? { locale: "en-US" } : { storageState: authFile(castApis().actor(role).key), locale: "en-US" });
}

/** A fresh signed-in page for a role (closed with its context after the test). */
export const test = base.extend<{ pageAs: (role: RoleKey | "guest") => Promise<Page> }>({
  pageAs: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];
    await use(async (role) => {
      const ctx = await contextAs(browser, role);
      contexts.push(ctx);
      return ctx.newPage();
    });
    for (const ctx of contexts) await ctx.close();
  },
});
export { expect };

/** Waits for the dashboard shell (signed in) or the login page (signed out). */
export async function settle(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => undefined);
}
