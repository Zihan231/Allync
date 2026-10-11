import { randomBytes } from "node:crypto";
import { castApis } from "../../lib/cast";
import { freshTotp } from "../../lib/totp";
import { expect, expectHealthy, settle, test, watch } from "../../lib/ui";

/** Sign up, log in, log out and staff 2FA through the real forms. */
const { cast, actor } = castApis();

test.describe("sign up", () => {
  test("a new player signs up through the form and lands in the dashboard", async ({ pageAs }) => {
    const page = await pageAs("guest");
    const problems = watch(page);
    await page.goto("/signup");
    const password = `E2e!${randomBytes(6).toString("hex")}`;
    await page.getByLabel("Full name").fill("E2E Signup Form");
    await page.getByLabel("Email").fill(`e2e+${cast.runId}-signupform@allynq.test`);
    await page.getByLabel("Phone number").fill("1712345670");
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Re-enter password").fill(password);
    const terms = page.getByRole("checkbox");
    if (await terms.count()) await terms.first().check();
    await page.getByRole("button", { name: /create|sign up/i }).last().click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    expectHealthy(problems, "signup");
  });

  test("mismatched passwords are caught before sending", async ({ pageAs }) => {
    const page = await pageAs("guest");
    await page.goto("/signup");
    await page.getByLabel("Full name").fill("E2E Mismatch");
    await page.getByLabel("Email").fill(`e2e+${cast.runId}-mismatch@allynq.test`);
    await page.getByLabel("Phone number").fill("1712345671");
    await page.getByLabel("Password", { exact: true }).fill("E2e!first-one");
    await page.getByLabel("Re-enter password").fill("E2e!second-one");
    const terms = page.getByRole("checkbox");
    if (await terms.count()) await terms.first().check();
    await page.getByRole("button", { name: /create|sign up/i }).last().click();
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByRole("alert").or(page.getByText(/match/i)).first()).toBeVisible();
  });
});

test.describe("log in and out", () => {
  test("wrong password shows an error, the right one signs in, log out signs out", async ({ pageAs }) => {
    const a = actor("entrant2");
    const page = await pageAs("guest");
    await page.goto("/login");
    await page.getByLabel("Email").fill(a.email);
    await page.getByLabel("Password", { exact: true }).fill("definitely-wrong");
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();

    await page.getByLabel("Password", { exact: true }).fill(a.password);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await settle(page);

    // Log out from the avatar menu in the top bar.
    await page.locator("header").getByRole("button").last().click();
    await page.getByRole("button", { name: /log ?out|sign ?out/i }).or(page.getByRole("menuitem", { name: /log ?out|sign ?out/i })).first().click();
    await expect(page).toHaveURL(/\/login|\/$/);
    await page.goto("/dashboard/efootball/wallet");
    await expect(page).toHaveURL(/\/login/);
  });

  test("staff sign in with an authenticator code and land in the admin area", async ({ pageAs }) => {
    const a = actor("admin");
    const page = await pageAs("guest");
    await page.goto("/login");
    await page.getByLabel("Email").fill(a.email);
    await page.getByLabel("Password", { exact: true }).fill(a.password);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    const codeBox = page.getByLabel("Authenticator code");
    await expect(codeBox).toBeVisible();
    // Use a window the API suites haven't used.
    const { code } = await freshTotp(a.totpSecret!, Math.floor(Date.now() / 30_000));
    await codeBox.fill(code);
    await page.getByRole("button", { name: /verify|continue|log in|sign in/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 30_000 });
  });
});
