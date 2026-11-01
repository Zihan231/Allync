// Dev helper: screenshots an app page signed in as a demo coach (or SHOT_AS=<demo email>). npx tsx scripts/shot.ts <path> <outFile> [mobile]
import { chromium, devices } from "@playwright/test";
import { anon } from "../lib/api";
import { APP_URL } from "../lib/env";

const [path, out, mobile] = process.argv.slice(2);
const login = await anon.post("/auth/login", { email: process.env.SHOT_AS ?? "demo.coach.3@allync.demo", password: "123456" });
const browser = await chromium.launch();
const ctx = await browser.newContext(mobile ? { ...devices["Pixel 7"], locale: "en-US" } : { viewport: { width: 1440, height: 900 }, locale: "en-US" });
const url = new URL(APP_URL);
await ctx.addCookies([{ name: "allync_token", value: login.accessToken, domain: url.hostname, path: "/", httpOnly: true, secure: false, sameSite: "Lax" }]);
await ctx.addInitScript(() => {
  localStorage.setItem("ALLYNQ_HAS_SESSION", "1");
  localStorage.setItem("ALLYNQ-locale", "en");
});
const page = await ctx.newPage();
await page.goto(`${APP_URL}${path}`);
await page.waitForLoadState("networkidle").catch(() => undefined);
await page.waitForTimeout(2500);
await page.screenshot({ path: out, fullPage: !mobile });
await browser.close();
console.log("saved", out);
