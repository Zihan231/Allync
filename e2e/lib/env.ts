import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const here = path.dirname(fileURLToPath(import.meta.url));

export const E2E_DIR = path.resolve(here, "..");
export const FRONTEND_DIR = path.resolve(E2E_DIR, "..");
export const BACKEND_DIR = process.env.E2E_BACKEND_DIR ?? path.resolve(FRONTEND_DIR, "..", "Allync_Backend");

// The backend's DATABASE_URL is only used for the two e2e-only fixture queries (see lib/db.ts).
dotenv.config({ path: path.join(BACKEND_DIR, ".env"), quiet: true });

export const APP_URL = process.env.E2E_APP_URL ?? "http://localhost:3000";
export const API_URL = process.env.E2E_API_URL ?? `http://localhost:${process.env.PORT ?? 3001}`;

/** Where the run's cast (ids, tokens, sessions) is kept between projects. */
export const RUN_DIR = path.join(E2E_DIR, ".run");
export const RUN_FILE = path.join(RUN_DIR, "cast.json");
export const authFile = (key: string) => path.join(RUN_DIR, "auth", `${key}.json`);

/** Every e2e account matches this, and nothing else does. */
export const E2E_EMAIL_DOMAIN = "allynq.test";
export const E2E_EMAIL_LIKE = `e2e+%@${E2E_EMAIL_DOMAIN}`;
