import { APP_URL } from "../../lib/env";
import { castApis } from "../../lib/cast";
import { expect, expectHealthy, settle, test, watch } from "../../lib/ui";

/**
 * The coach's pages, button by button: the shell, overview, profile form, posts and the
 * composer, deals (every button a coach sees on a request, an offer, a running deal), the
 * coaches directory and the offer / checkout dialogs a club leader uses, the public coach
 * page and the feed. Deals are seeded through the API, so each test starts from a known state.
 */
const { cast, as, actor } = castApis();
const A = cast.clubs.alpha;
const coachId = () => actor("coach2").userId;
// A 1x1 PNG.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const image = (n: number) => ({ name: `shot${n}.png`, mimeType: "image/png", buffer: PNG });

/** Closes every open deal of the coach so each test starts clean (a kept cast can have old ones). */
async function clearDeals() {
  for (const d of (await as("coach2").get("/coaching/me")).deals) {
    if (d.status === "pending") await as("coach2").raw("POST", `/coaching/deals/${d.id}/cancel`, {});
    if (d.status === "active" || d.status === "scheduled") await as("coach2").raw("POST", `/coaching/deals/${d.id}/end`, {});
  }
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  // The dev server compiles a page the first time anyone opens it, which can outlast a test's wait: open them all once now.
  test.setTimeout(600_000);
  const routes = [
    "/dashboard/coach", "/dashboard/coach/profile", "/dashboard/coach/posts", "/dashboard/coach/posts/new", "/dashboard/coach/deals",
    "/dashboard/coach/clubs", "/dashboard/efootball/coaches", `/dashboard/efootball/coaches/${coachId()}`, "/dashboard/feed",
  ];
  for (let i = 0; i < routes.length; i += 3) await Promise.all(routes.slice(i, i + 3).map((p) => fetch(`${APP_URL}${p}`).catch(() => undefined)));
  await clearDeals();
});
test.afterAll(async () => {
  await clearDeals();
});

test.describe("someone who isn't a coach", () => {
  test("sees an invitation to become one, not the coach dashboard", async ({ pageAs }) => {
    const page = await pageAs("entrant1");
    const problems = watch(page);
    await page.goto("/dashboard/coach");
    await settle(page);
    await expect(page.getByRole("button", { name: /\+ Coach/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save profile" })).toHaveCount(0);
    expectHealthy(problems, "non-coach at /dashboard/coach");
  });
});

test.describe("overview and navigation", () => {
  test("the overview shows where the coach is, what was earned, and links to the deals", async ({ pageAs }) => {
    const page = await pageAs("coach2");
    const problems = watch(page);
    await page.goto("/dashboard/coach");
    await settle(page);
    await expect(page.getByRole("heading", { name: "Coach dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "View my public page" })).toHaveAttribute("href", new RegExp(`/dashboard/efootball/coaches/${coachId()}`));
    await expect(page.getByText("Coaching now")).toBeVisible();
    await expect(page.getByTestId("coach-earned")).toBeVisible();
    await page.getByRole("link", { name: /Open deals/ }).click();
    await expect(page).toHaveURL(/\/dashboard\/coach\/deals/);
    expectHealthy(problems, "coach overview");
  });

  test("every item in the coach menu opens its page", async ({ pageAs }) => {
    const page = await pageAs("coach2");
    const problems = watch(page);
    await page.goto("/dashboard/coach");
    await settle(page);
    for (const [name, url] of [
      ["My posts", /\/dashboard\/coach\/posts/],
      ["Deals", /\/dashboard\/coach\/deals/],
      ["Find clubs", /\/dashboard\/coach\/clubs/],
      ["Coach dashboard", /\/dashboard\/coach$/],
      ["Feed", /\/dashboard\/feed/],
    ] as const) {
      await page.getByRole("link", { name, exact: true }).first().click();
      await expect(page, name).toHaveURL(url);
      await settle(page);
    }
    expectHealthy(problems, "coach menu");
  });
});

test.describe("the profile form", () => {
  test("every field saves and is still there after a reload", async ({ pageAs }) => {
    const page = await pageAs("coach2");
    await page.goto("/dashboard/coach/profile");
    await settle(page);
    await page.getByLabel("Headline").fill("E2E UI tactics coach");
    await page.getByLabel("About you").fill("Automated bio for the coach page.");
    await page.getByLabel("YouTube channel").fill("https://youtube.com/@e2e-ui");
    // Only digits are kept in the fee.
    await page.getByLabel("Usual fee (৳)").fill("12ab");
    await expect(page.getByLabel("Usual fee (৳)")).toHaveValue("12");
    await page.getByLabel("Usual fee (৳)").fill("150");
    await page.getByLabel("Specialities").fill("Pressing, Set pieces");
    await page.getByLabel("Open to new clubs").check();
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Profile saved")).toBeVisible();

    await page.reload();
    await settle(page);
    await expect(page.getByLabel("Headline")).toHaveValue("E2E UI tactics coach");
    await expect(page.getByLabel("About you")).toHaveValue("Automated bio for the coach page.");
    await expect(page.getByLabel("YouTube channel")).toHaveValue("https://youtube.com/@e2e-ui");
    await expect(page.getByLabel("Usual fee (৳)")).toHaveValue("150");
    await expect(page.getByLabel("Specialities")).toHaveValue("Pressing, Set pieces");
    await expect(page.getByLabel("Open to new clubs")).toBeChecked();
  });

  test("limits and errors: the headline stops at 120 characters, a channel without https is refused", async ({ pageAs }) => {
    const page = await pageAs("coach2");
    await page.goto("/dashboard/coach/profile");
    await settle(page);
    await page.getByLabel("Headline").fill("x".repeat(130));
    expect((await page.getByLabel("Headline").inputValue()).length).toBe(120);
    await page.getByLabel("Headline").fill("E2E UI tactics coach");

    await page.getByLabel("YouTube channel").fill("youtube.com/no-protocol");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.locator('p[role="alert"]')).toBeVisible();
    await expect(page.getByText("Profile saved")).toHaveCount(0);
    await page.getByLabel("YouTube channel").fill("");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Profile saved")).toBeVisible();
  });

  test("switching off 'Open to new clubs' takes the coach out of the default directory", async ({ pageAs }) => {
    const page = await pageAs("coach2");
    await page.goto("/dashboard/coach/profile");
    await settle(page);
    await page.getByLabel("Open to new clubs").uncheck();
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Profile saved")).toBeVisible();

    const dir = await pageAs("entrant1");
    await dir.goto("/dashboard/efootball/coaches");
    await settle(dir);
    await dir.getByPlaceholder("Search coaches").fill("Coach Two");
    await expect(dir.getByText("No coaches found.")).toBeVisible();
    // Showing everyone brings the coach back.
    await dir.getByRole("button", { name: "Open to new clubs" }).click();
    await expect(dir.getByTestId("coach-card").filter({ hasText: "Coach Two" })).toBeVisible();

    await page.getByLabel("Open to new clubs").check();
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Profile saved")).toBeVisible();
  });
});

test.describe("posts and the composer", () => {
  test("the posts page shows the three counts and a New post button", async ({ pageAs }) => {
    const page = await pageAs("coach2");
    const problems = watch(page);
    await page.goto("/dashboard/coach/posts");
    await settle(page);
    await expect(page.getByRole("heading", { name: "Your posts" })).toBeVisible();
    for (const label of ["Public", "In review", "Not approved"]) await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tips for a good post" })).toBeVisible();
    await page.getByRole("link", { name: "New post" }).click();
    await expect(page).toHaveURL(/\/dashboard\/coach\/posts\/new/);
    expectHealthy(problems, "coach posts");
  });

  test("the composer: an empty post is refused, files can be added and removed, four at most, only images and videos", async ({ pageAs }) => {
    const page = await pageAs("coach2");
    await page.goto("/dashboard/coach/posts/new");
    await settle(page);
    await page.getByRole("button", { name: "Submit for review" }).click();
    await expect(page.locator('p[role="alert"]')).toHaveText("What's this tutorial about?");

    const files = page.getByTestId("coach-post-files");
    await files.setInputFiles([image(1), image(2)]);
    await expect(page.locator("img[src^='blob:']")).toHaveCount(2);
    // A file that is neither image nor video is ignored.
    await files.setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
    await expect(page.locator("img[src^='blob:']")).toHaveCount(2);
    // Removing one.
    await page.getByRole("button", { name: "Delete" }).first().click();
    await expect(page.locator("img[src^='blob:']")).toHaveCount(1);
    // Four at most: extra files are dropped and the button is disabled.
    await files.setInputFiles([image(3), image(4), image(5), image(6)]);
    await expect(page.locator("img[src^='blob:']")).toHaveCount(4);
    await expect(page.getByRole("button", { name: "Add photos / video" })).toBeDisabled();
  });

  test("a submitted post goes to review: the list says so, the counts follow, and it can be deleted", async ({ pageAs }) => {
    const page = await pageAs("coach2");
    await page.goto("/dashboard/coach/posts/new");
    await settle(page);
    await page.getByLabel("New post").fill("E2E UI tutorial: build-up under pressure");
    await page.getByLabel("Video links").fill("https://youtu.be/dQw4w9WgXcQ");
    await page.getByTestId("coach-post-files").setInputFiles(image(1));
    await page.getByRole("button", { name: "Submit for review" }).click();
    await expect(page).toHaveURL(/\/dashboard\/coach\/posts\?sent=1/);
    await expect(page.getByRole("status")).toContainText("Sent for review");
    const post = page.getByTestId("coach-post").filter({ hasText: "build-up under pressure" });
    await expect(post).toBeVisible();
    await expect(post.getByText("Only you can see this until it's approved")).toBeVisible();

    // Deleting asks first: refusing keeps the post, accepting removes it.
    page.once("dialog", (d) => void d.dismiss());
    await post.getByRole("button", { name: "Delete" }).click();
    await expect(post).toBeVisible();
    page.once("dialog", (d) => void d.accept());
    await post.getByRole("button", { name: "Delete" }).click();
    await expect(post).toHaveCount(0);
  });
});

test.describe("deals: what a coach can press", () => {
  test("his own request: only Withdraw is offered, and it closes the deal", async ({ pageAs }) => {
    await clearDeals();
    const deal = await as("coach2").post("/coaching/deals", { clubId: A, feeTk: 150, days: 14, message: "e2e ui request" });
    const page = await pageAs("coach2");
    await page.goto("/dashboard/coach/deals");
    await settle(page);
    const card = page.getByTestId("coaching-deal").filter({ hasText: "e2e ui request" });
    await expect(card.getByText("Request from the coach")).toBeVisible();
    await expect(card.getByText("Negotiating")).toBeVisible();
    await expect(card.getByText(/Waiting for the other side/)).toBeVisible();
    await expect(card.getByRole("button", { name: "Accept" })).toHaveCount(0);
    await expect(card.getByRole("button", { name: "Decline" })).toHaveCount(0);
    await card.getByRole("button", { name: "Withdraw" }).click();
    await expect(card.getByText("Withdrawn")).toBeVisible();
    await expect(card.getByRole("button", { name: "Withdraw" })).toHaveCount(0);
    expect((await as("coach2").get(`/coaching/deals/${deal.id}`)).status).toBe("cancelled");
  });

  test("a club's offer: Accept, Counter and Decline; countering needs the new terms and then waits for the club", async ({ pageAs }) => {
    await clearDeals();
    await as("alphaPresident").post("/coaching/deals", { clubId: A, coachUserId: coachId(), feeTk: 120, days: 14, paymentMethod: "card", message: "e2e ui offer" });
    const page = await pageAs("coach2");
    await page.goto("/dashboard/coach/deals");
    await settle(page);
    const card = page.getByTestId("coaching-deal").filter({ hasText: "e2e ui offer" });
    await expect(card.getByText("Offer from the club")).toBeVisible();
    await expect(card.getByText(/Your answer/)).toBeVisible();
    for (const name of ["Accept", "Counter", "Decline"]) await expect(card.getByRole("button", { name })).toBeVisible();
    await expect(card.getByRole("button", { name: "Withdraw" })).toHaveCount(0);

    // Counter: the inputs keep digits only; Close goes back; Send counter waits for the club.
    await card.getByRole("button", { name: "Counter" }).click();
    await card.getByLabel("Fee").fill("9x0");
    await expect(card.getByLabel("Fee")).toHaveValue("90");
    await card.getByRole("button", { name: "Close" }).click();
    await expect(card.getByRole("button", { name: "Counter" })).toBeVisible();
    await card.getByRole("button", { name: "Counter" }).click();
    await card.getByLabel("Fee").fill("90");
    await card.getByRole("button", { name: "Send counter" }).click();
    await expect(card.getByText(/Waiting for the other side/)).toBeVisible();
    await expect(card.getByRole("button", { name: "Withdraw" })).toBeVisible();
    await expect(card.getByText("৳90")).toBeVisible();
  });

  test("declining a new offer closes it", async ({ pageAs }) => {
    await clearDeals();
    await as("alphaPresident").post("/coaching/deals", { clubId: A, coachUserId: coachId(), feeTk: 80, days: 14, paymentMethod: "card", message: "e2e ui decline" });
    const page = await pageAs("coach2");
    await page.goto("/dashboard/coach/deals");
    await settle(page);
    const card = page.getByTestId("coaching-deal").filter({ hasText: "e2e ui decline" });
    await card.getByRole("button", { name: "Decline" }).click();
    await expect(card.getByText("Declined")).toBeVisible();
    for (const name of ["Accept", "Counter", "Decline", "Withdraw", "End deal"]) await expect(card.getByRole("button", { name })).toHaveCount(0);
  });

  test("accepting starts the deal; ending it asks first and says the fee isn't refunded", async ({ pageAs }) => {
    await clearDeals();
    await as("alphaPresident").post("/coaching/deals", { clubId: A, coachUserId: coachId(), feeTk: 0, days: 14, message: "e2e ui accept" });
    const page = await pageAs("coach2");
    await page.goto("/dashboard/coach/deals");
    await settle(page);
    const card = page.getByTestId("coaching-deal").filter({ hasText: "e2e ui accept" });
    await card.getByRole("button", { name: "Accept" }).click();
    await expect(card.getByText("Active")).toBeVisible();
    await expect(card.getByText(/Until/)).toBeVisible();

    let asked = "";
    page.once("dialog", (d) => {
      asked = d.message();
      void d.dismiss();
    });
    await card.getByRole("button", { name: "End deal" }).click();
    expect(asked).toContain("The fee isn't refunded");
    await expect(card.getByText("Active")).toBeVisible();
    page.once("dialog", (d) => void d.accept());
    await card.getByRole("button", { name: "End deal" }).click();
    await expect(card.getByText("Ended early")).toBeVisible();

    // The overview no longer shows him at the club.
    await page.goto("/dashboard/coach");
    await settle(page);
    await expect(page.getByText("Not coaching a club right now.")).toBeVisible();
  });
});

test.describe("the coaches directory and what a club leader can do", () => {
  test("search, the empty state and the card's buttons", async ({ pageAs }) => {
    const page = await pageAs("entrant1");
    const problems = watch(page);
    await page.goto("/dashboard/efootball/coaches");
    await settle(page);
    await expect(page.getByRole("heading", { name: "Coaches" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open to new clubs" })).toHaveAttribute("aria-pressed", "true");
    await page.getByPlaceholder("Search coaches").fill("Coach Two");
    const card = page.getByTestId("coach-card").filter({ hasText: "Coach Two" });
    await expect(card).toBeVisible();
    await expect(card.getByRole("link", { name: "View profile" })).toBeVisible();
    // Not a club leader: no way to offer a deal.
    await expect(card.getByRole("button", { name: "Offer a deal" })).toHaveCount(0);
    await page.getByPlaceholder("Search coaches").fill("zzzz-no-such-coach");
    await expect(page.getByText("No coaches found.")).toBeVisible();
    expectHealthy(problems, "coach directory");
  });

  test("a club leader's offer: digits only, the checkout, a clear error, then a sent offer the coach can see", async ({ pageAs }) => {
    await clearDeals();
    const page = await pageAs("alphaPresident");
    await page.goto("/dashboard/efootball/coaches");
    await settle(page);
    await page.getByPlaceholder("Search coaches").fill("Coach Two");
    const card = page.getByTestId("coach-card").filter({ hasText: "Coach Two" });
    await card.getByRole("button", { name: "Offer a deal" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Offer .*Coach Two.* a coaching deal/ })).toBeVisible();
    await dialog.getByLabel("Fee (৳)").fill("1a2");
    await expect(dialog.getByLabel("Fee (৳)")).toHaveValue("12");
    await dialog.getByLabel("Days").fill("5");
    await dialog.getByLabel("Message (optional)").fill("e2e ui club offer");
    // A fee goes through the checkout; a length under the minimum is refused with a clear message.
    await dialog.getByRole("button", { name: /Continue to payment/ }).click();
    const pay = page.getByRole("dialog").last();
    await pay.getByRole("button", { name: /Nagad/ }).click();
    await pay.getByRole("button", { name: /^Pay/ }).click();
    await expect(pay.locator('[role="alert"]')).toContainText(/days/i);
    // Closing the checkout keeps the offer dialog open.
    await pay.getByRole("button", { name: "Close" }).first().click();
    await expect(dialog.getByLabel("Days")).toBeVisible();

    await dialog.getByLabel("Days").fill("30");
    await dialog.getByRole("button", { name: /Continue to payment/ }).click();
    await page.getByRole("dialog").last().getByRole("button", { name: /^Pay/ }).click();
    await expect(page.getByText("Paid")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    const open = (await as("coach2").get("/coaching/me")).deals.filter((d: any) => d.status === "pending");
    expect(open.map((d: any) => d.message)).toContain("e2e ui club offer");
    await clearDeals();
  });

  test("the offer dialog closes with its Close button and by clicking outside", async ({ pageAs }) => {
    const page = await pageAs("alphaPresident");
    await page.goto("/dashboard/efootball/coaches");
    await settle(page);
    await page.getByPlaceholder("Search coaches").fill("Coach Two");
    const card = page.getByTestId("coach-card").filter({ hasText: "Coach Two" });
    await card.getByRole("button", { name: "Offer a deal" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Close" }).first().click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await card.getByRole("button", { name: "Offer a deal" }).click();
    await page.mouse.click(5, 5);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test.describe("the public coach page and the feed", () => {
  test("a visitor can follow and unfollow; a leader can offer; the coach can edit the card", async ({ pageAs }) => {
    const visitor = await pageAs("entrant1");
    const problems = watch(visitor);
    await visitor.goto(`/dashboard/efootball/coaches/${coachId()}`);
    await settle(visitor);
    await expect(visitor.getByTestId("coach-hero")).toBeVisible();
    await expect(visitor.getByRole("button", { name: "Offer a deal" })).toHaveCount(0);
    await expect(visitor.getByRole("link", { name: "Edit coach card" })).toHaveCount(0);
    await visitor.getByRole("button", { name: /Follow/ }).click();
    await expect(visitor.getByRole("button", { name: /Following/ })).toBeVisible();
    await visitor.getByRole("button", { name: /Following/ }).click();
    await expect(visitor.getByRole("button", { name: /\+ Follow/ })).toBeVisible();
    expectHealthy(problems, "public coach page");

    const leader = await pageAs("alphaPresident");
    await leader.goto(`/dashboard/efootball/coaches/${coachId()}`);
    await settle(leader);
    await expect(leader.getByRole("button", { name: "Offer a deal" })).toBeVisible();

    const own = await pageAs("coach2");
    await own.goto(`/dashboard/efootball/coaches/${coachId()}`);
    await settle(own);
    await expect(own.getByRole("button", { name: /Follow/ })).toHaveCount(0);
    await own.getByRole("link", { name: "Edit coach card" }).click();
    await expect(own).toHaveURL(/\/dashboard\/coach\/profile/);
  });

  test("the feed has its three tabs, and each one shows posts or its own empty message", async ({ pageAs }) => {
    const page = await pageAs("entrant2");
    const problems = watch(page);
    await page.goto("/dashboard/feed");
    await settle(page);
    for (const [name, query] of [["Following", /tab=following/], ["Saved", /tab=saved/], ["For you", /\/dashboard\/feed$/]] as const) {
      await page.getByRole("tab", { name }).click();
      await expect(page.getByRole("tab", { name })).toHaveAttribute("aria-selected", "true");
      await expect(page, name).toHaveURL(query);
      await expect(page.getByTestId("feed-card").first().or(page.getByTestId("feed-empty")).or(page.getByTestId("feed-end"))).toBeVisible({ timeout: 20_000 });
    }
    expectHealthy(problems, "feed");
  });
});

test.describe("find clubs", () => {
  test("the real clubs are listed, and asking one sends a real request", async ({ pageAs }) => {
    await clearDeals();
    const page = await pageAs("coach2");
    await page.goto("/dashboard/coach/clubs");
    await settle(page);
    await page.getByPlaceholder("Choose a club").fill(`E2E ${cast.runId} Alpha`);
    const row = page.locator("div").filter({ hasText: `E2E ${cast.runId} Alpha` }).filter({ has: page.getByRole("button", { name: "Ask to coach" }) }).last();
    await expect(row, "the real club should be listed").toBeVisible({ timeout: 10_000 });
    await row.getByRole("button", { name: "Ask to coach" }).click();
    await page.getByRole("dialog").getByLabel("Message (optional)").fill("e2e ui find clubs");
    await page.getByRole("dialog").getByRole("button", { name: "Send" }).click();
    await expect(page.getByText("Sent")).toBeVisible();
    const open = (await as("coach2").get("/coaching/me")).deals.filter((d: any) => d.status === "pending");
    expect(open.map((d: any) => d.message)).toContain("e2e ui find clubs");
  });
});
