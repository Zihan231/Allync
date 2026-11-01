// Dev helper: screenshots a coach's public page as a demo coach. npx tsx scripts/shot-coach.ts <coachUserId> [outFile]
import { chromium } from "@playwright/test";
import { anon } from "../lib/api";
import { APP_URL } from "../lib/env";

const [coachId, out = "coach-page.png"] = process.argv.slice(2);
const login = await anon.post("/auth/login", { email: "demo.coach.6@allync.demo", password: "123456" });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "en-US" });
const url = new URL(APP_URL);
await ctx.addCookies([{ name: "allync_token", value: login.accessToken, domain: url.hostname, path: "/", httpOnly: true, secure: false, sameSite: "Lax" }]);
await ctx.addInitScript(() => {
  localStorage.setItem("ALLYNQ_HAS_SESSION", "1");
  localStorage.setItem("ALLYNQ-locale", "en");
});
const page = await ctx.newPage();
await page.goto(`${APP_URL}/dashboard/efootball/coaches/${coachId}`);
await page.waitForLoadState("networkidle").catch(() => undefined);
await page.waitForTimeout(2000);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log("saved", out);
