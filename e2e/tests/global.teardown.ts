import { test as teardown } from "@playwright/test";
import { cleanupRun } from "../lib/cleanup";

teardown("clean up the e2e cast", async () => {
  teardown.setTimeout(5 * 60_000);
  if (process.env.E2E_KEEP === "1") {
    console.log("E2E_KEEP=1: leaving the e2e data in place");
    return;
  }
  await cleanupRun();
});
