import fs from "node:fs";
import { Api } from "./api";
import { RUN_FILE } from "./env";
import { loadCast, type Cast } from "./cast";
import { restoreE2eUsers, setSystemRole, softDeleteE2eUsers } from "./db";

const quiet = async (label: string, fn: () => Promise<unknown>, leftovers: string[]) => {
  try {
    await fn();
  } catch (err) {
    leftovers.push(`${label}: ${(err as Error).message.slice(0, 160)}`);
  }
};

/**
 * Removes what a run created, through the API where it can (open loans and offers,
 * tournaments, store items, clubs, the community), then soft-deletes its e2e users.
 */
export async function cleanupRun(cast: Cast = loadCast()): Promise<void> {
  const leftovers: string[] = [];
  // A second cleanup of the same run: its accounts must be able to act again first.
  if ((await restoreE2eUsers(cast.runId)) > 0) {
    // The soft delete also cleared their staff roles.
    for (const actor of Object.values(cast.actors)) if (actor.systemRole) await setSystemRole(actor.email, actor.systemRole);
  }
  const a = cast.actors;
  const admin = new Api(a.admin.token);
  const as = (key: string) => new Api(a[key].token);

  // Open loans and offers of both clubs (cancelled by staff, so held money goes back).
  for (const [clubId, leader] of [[cast.clubs.alpha, "alphaPresident"], [cast.clubs.beta, "betaPresident"]] as const) {
    await quiet(`loans ${clubId}`, async () => {
      const loans = await as(leader).get(`/transfers/loans/clubs/${clubId}`);
      for (const l of [...(loans.loansIn ?? []), ...(loans.loansOut ?? [])]) {
        if (["pending", "scheduled"].includes(l.status)) await as("alphaPresident").raw("POST", `/transfers/loans/${l.id}/cancel`, {});
        if (["pending", "scheduled"].includes(l.status)) await as("betaPresident").raw("POST", `/transfers/loans/${l.id}/cancel`, {});
        if (["active", "returning"].includes(l.status)) await admin.raw("POST", `/admin/transfers/loans/${l.id}/end`, { reason: "e2e cleanup" });
      }
    }, leftovers);
  }
  await quiet("offers", async () => {
    const offers = await admin.get(`/admin/transfers/offers`);
    const rows = Array.isArray(offers) ? offers : (offers.data ?? offers.items ?? []);
    for (const o of rows) {
      const names = JSON.stringify(o);
      if (names.includes(cast.runId) && ["pending", "scheduled"].includes(o.status)) {
        await admin.raw("POST", `/admin/transfers/offers/${o.id}/cancel`, { reason: "e2e cleanup" });
      }
    }
  }, leftovers);

  for (const id of cast.created.tournaments) {
    await quiet(`tournament ${id}`, async () => {
      const res = await admin.raw("DELETE", `/tournaments/${id}`);
      if (!res.ok && res.status !== 404) {
        await admin.raw("POST", `/admin/manage/tournament/${id}/status`, { status: "cancelled", reason: "e2e cleanup" });
      }
    }, leftovers);
  }
  for (const id of cast.created.storeItems) {
    await quiet(`store item ${id}`, () => admin.patch(`/admin/store/items/${id}`, { active: false }), leftovers);
  }

  // Already gone (404) is fine: a repeated cleanup.
  const remove = async (label: string, key: string, path: string) => {
    if ((await as(key).raw("GET", path)).status === 404) return;
    const res = await as(key).raw("DELETE", path);
    if (!res.ok && res.status !== 404) leftovers.push(`${label}: ${res.status} ${JSON.stringify(res.body).slice(0, 140)}`);
  };
  await remove("club alpha", "alphaPresident", `/clubs/${cast.clubs.alpha}`);
  await remove("club beta", "betaPresident", `/clubs/${cast.clubs.beta}`);
  await remove("community", "commPresident", `/communities/${cast.communityId}`);

  await sweepOrphans(admin, leftovers);

  const removed = await softDeleteE2eUsers(cast.runId);
  console.log(`e2e cleanup ${cast.runId}: ${removed} users soft-deleted`);
  if (leftovers.length) console.log(`e2e cleanup left behind:\n  ${leftovers.join("\n  ")}`);
}

/** Clubs and communities named "E2E <runId> …" (the e2e naming; run ids are lowercase base-36). */
const E2E_NAME = /^E2E [a-z0-9]{8,14} /u;

/**
 * Any e2e club or community still standing: extra ones a suite made this run, or ones
 * left by an earlier run whose cleanup was cut short. Running loans are ended and they
 * go to the admin bin (restorable), as this run's admin.
 */
async function sweepOrphans(admin: Api, leftovers: string[]): Promise<void> {
  for (const type of ["club", "community"] as const) {
    await quiet(`sweep ${type}s`, async () => {
      const list = await admin.get(`/${type === "club" ? "clubs" : "communities"}?search=E2E&limit=100`);
      const rows: Array<{ id: string; name: string }> = Array.isArray(list) ? list : (list.data ?? list.items ?? []);
      for (const row of rows.filter((r) => E2E_NAME.test(r.name))) {
        if (type === "club") {
          const loans = await admin.raw("GET", `/transfers/loans/clubs/${row.id}`);
          const body = loans.body as { loansIn?: Array<{ id: string; status: string }>; loansOut?: Array<{ id: string; status: string }> };
          for (const l of [...(body?.loansIn ?? []), ...(body?.loansOut ?? [])]) {
            if (["active", "returning"].includes(l.status)) {
              await admin.raw("POST", `/admin/transfers/loans/${l.id}/end`, { reason: "e2e orphan cleanup" });
            }
          }
        }
        const res = await admin.raw("POST", `/admin/content/${type}/${row.id}/bin`, { reason: "e2e orphan cleanup" });
        if (!res.ok) leftovers.push(`orphan ${type} ${row.name}: ${res.status} ${JSON.stringify(res.body).slice(0, 120)}`);
        else console.log(`e2e cleanup: binned ${type} "${row.name}"`);
      }
    }, leftovers);
  }
}

/** CLI: `npm run teardown` cleans the last run (or every e2e user with --all). */
if (process.argv[1]?.endsWith("cleanup.ts")) {
  if (process.argv.includes("--all")) {
    softDeleteE2eUsers().then((n) => console.log(`${n} e2e users soft-deleted`));
  } else if (fs.existsSync(RUN_FILE)) {
    cleanupRun().catch((e) => {
      console.error(e);
      process.exit(1);
    });
  }
}
