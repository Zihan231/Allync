import fs from "node:fs";
import path from "node:path";
import { Api } from "./api";
import { RUN_FILE } from "./env";

/** One signed-up e2e user. */
export type Actor = {
  key: string;
  email: string;
  password: string;
  name: string;
  userId: string;
  profileId: string;
  token: string;
  systemRole?: "moderator" | "admin" | "super_admin";
  /** Staff only: the authenticator secret and the last 30 s window used. */
  totpSecret?: string;
  totpWindow?: number;
};

export type Cast = {
  runId: string;
  startedAt: string;
  actors: Record<string, Actor>;
  clubs: { alpha: string; beta: string };
  communityId: string;
  /** Anything else a suite created and teardown should know about. */
  created: { tournaments: string[]; storeItems: string[] };
};

/**
 * Every kind of user the app has. Club roles: club Alpha (the full staff) and club Beta
 * (a second club for transfers/loans). Community roles: one community with every role.
 */
export const ROLE_KEYS = {
  // Club Alpha
  alphaPresident: "Alpha President",
  alphaGs: "Alpha General Secretary",
  alphaCaptain: "Alpha Captain",
  alphaViceCaptain: "Alpha Vice-Captain",
  alphaAcademyCaptain: "Alpha Academy Captain",
  alphaManager: "Alpha Manager",
  alphaPlayer: "Alpha Player",
  alphaPlayer2: "Alpha Player Two",
  // Club Beta
  betaPresident: "Beta President",
  betaGs: "Beta General Secretary",
  betaPlayer: "Beta Player",
  betaPlayer2: "Beta Player Two",
  // Community
  commPresident: "Community President",
  commVicePresident: "Community Vice President",
  commTeamManager: "Community Team Manager",
  commHeadOfDiscipline: "Community Head of Discipline",
  commScout: "Community Scout",
  commMember: "Community Member",
  // No club
  freeAgent: "Free Agent",
  freeAgent2: "Free Agent Two",
  consolePlayer: "Console Player",
  organizer: "Organizer",
  matchOfficial: "Match Official",
  entrant1: "Entrant One",
  entrant2: "Entrant Two",
  banTarget: "Ban Target",
  // Staff
  moderator: "Staff Moderator",
  admin: "Staff Admin",
  superAdmin: "Staff Super Admin",
} as const;
export type RoleKey = keyof typeof ROLE_KEYS;

/**
 * Spec files are loaded twice: once to list the tests (before `setup` has made this run's
 * cast) and again in the worker that runs them. While listing, a placeholder stands in, so
 * test titles must never contain cast ids.
 */
const PLACEHOLDER_ID = "00000000-0000-4000-8000-000000000000";
function placeholderCast(): Cast {
  const actor = (key: string): Actor => ({ key, email: "", password: "", name: key, userId: PLACEHOLDER_ID, profileId: PLACEHOLDER_ID, token: "" });
  return {
    runId: "pending",
    startedAt: "",
    actors: new Proxy({} as Record<string, Actor>, { get: (_t, key) => actor(String(key)) }),
    clubs: { alpha: PLACEHOLDER_ID, beta: PLACEHOLDER_ID },
    communityId: PLACEHOLDER_ID,
    created: { tournaments: [], storeItems: [] },
  };
}

export function loadCast(): Cast {
  if (!fs.existsSync(RUN_FILE)) return placeholderCast();
  return JSON.parse(fs.readFileSync(RUN_FILE, "utf8")) as Cast;
}

export function saveCast(cast: Cast): void {
  fs.mkdirSync(path.dirname(RUN_FILE), { recursive: true });
  fs.writeFileSync(RUN_FILE, JSON.stringify(cast, null, 2));
}

/** Records something a suite created, so teardown can remove it. */
export function track(kind: keyof Cast["created"], id: string): void {
  const cast = loadCast();
  if (!cast.created[kind].includes(id)) cast.created[kind].push(id);
  saveCast(cast);
}

export const apiAs = (actor: Actor) => new Api(actor.token);

/** The cast plus a signed-in API client per actor. */
export function castApis() {
  const cast = loadCast();
  const as = (key: RoleKey) => apiAs(cast.actors[key]);
  const actor = (key: RoleKey) => cast.actors[key];
  return { cast, as, actor };
}
