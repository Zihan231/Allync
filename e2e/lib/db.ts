import pg from "pg";
import { E2E_EMAIL_LIKE } from "./env";

/**
 * The only direct database access in the suite. Every statement is limited to e2e
 * accounts (`e2e+…@allynq.test`), so real users are never read or changed.
 */
async function withClient<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (read from Allync_Backend/.env)");
  const client = new pg.Client({ connectionString: url, ssl: url.includes("localhost") ? false : { rejectUnauthorized: false } });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

const assertE2eEmail = (email: string) => {
  if (!/^e2e\+[\w-]+@allynq\.test$/u.test(email)) throw new Error(`Refusing to touch a non-e2e account: ${email}`);
};

/** Gives an e2e account a staff role (there's no API to create the first staff member). */
export async function setSystemRole(email: string, role: "moderator" | "admin" | "super_admin"): Promise<void> {
  assertE2eEmail(email);
  await withClient(async (c) => {
    const res = await c.query(`UPDATE users SET "systemRole" = $1 WHERE email = $2 AND email LIKE $3`, [role, email, E2E_EMAIL_LIKE]);
    if (res.rowCount !== 1) throw new Error(`Could not promote ${email}`);
  });
}

/**
 * Undoes the soft delete of one run's e2e accounts, so a cleanup that was cut short (or
 * blocked by a running deal) can sign in as them and try again.
 */
export async function restoreE2eUsers(runId: string): Promise<number> {
  if (!/^[a-z0-9]+$/u.test(runId)) throw new Error(`Bad run id: ${runId}`);
  return withClient(async (c) => {
    const res = await c.query(
      `UPDATE users SET "deletedAt" = NULL WHERE email LIKE $1 AND email LIKE $2 AND "deletedAt" IS NOT NULL`,
      [`e2e+${runId}-%@allynq.test`, E2E_EMAIL_LIKE],
    );
    return res.rowCount ?? 0;
  });
}

/** Soft-deletes every e2e account of a run (or of all runs), so they disappear from lists. */
export async function softDeleteE2eUsers(runId?: string): Promise<number> {
  const like = runId ? `e2e+${runId}-%@allynq.test` : E2E_EMAIL_LIKE;
  return withClient(async (c) => {
    const res = await c.query(
      `UPDATE users SET "deletedAt" = now(), "systemRole" = NULL
        WHERE email LIKE $1 AND email LIKE $2 AND "deletedAt" IS NULL`,
      [like, E2E_EMAIL_LIKE],
    );
    return res.rowCount ?? 0;
  });
}
