import { test, expect } from "@playwright/test";
import { Api, anon } from "../../lib/api";
import { castApis } from "../../lib/cast";

/**
 * No public endpoint may hand out another user's private details (contact, address,
 * ID document, moderation or 2FA fields). Signed out, or signed in as someone else.
 */
const { cast, as, actor } = castApis();

const PRIVATE = [
  "email",
  "phoneNumber",
  "permanentAddress",
  "documentDataUrl",
  "documentType",
  "password",
  "tokenVersion",
  "twoFactorSecretEncrypted",
  "twoFactorLastCounter",
  "banReason",
  "suspendReason",
  "warningsCount",
  "lastLoginAt",
];

/** Private keys found on any object other than the viewer's own user record. */
function leaks(body: unknown, selfId: string): string[] {
  const found = new Set<string>();
  const walk = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== "object") return;
    const o = v as Record<string, unknown>;
    for (const [k, val] of Object.entries(o)) {
      if (PRIVATE.includes(k) && val !== undefined && o.id !== selfId) found.add(k);
      walk(val);
    }
  };
  walk(body);
  return [...found];
}

test("public endpoints never expose other users' private details", async () => {
  const A = cast.clubs.alpha;
  const player = actor("alphaPlayer").userId;
  // A tournament with a creator and player entrants.
  const t = await as("organizer").post("/tournaments", {
    name: `E2E ${cast.runId} Privacy Cup`,
    type: "pvp",
    general: true,
    maxParticipants: 4,
    startAt: new Date(Date.now() + 5 * 24 * 3600_000).toISOString(),
  });
  await as("freeAgent2").raw("POST", `/tournaments/${t.id}/join`, {});

  const paths = [
    `/tournaments/${t.id}`,
    "/tournaments?limit=20",
    `/clubs/${A}`,
    `/clubs/${A}/members`,
    `/clubs/${A}/manager`,
    `/clubs/${A}/teams`,
    `/clubs/${A}/teams/free-players`,
    "/clubs?limit=20",
    `/communities/${cast.communityId}`,
    `/communities/${cast.communityId}/members`,
    `/users/${player}`,
    "/users?limit=20",
    `/users/${player}/efootball-profile`,
    `/transfers/players/${player}`,
    "/transfers/history?limit=20",
    "/transfers/free-agents?limit=20",
    `/transfers/clubs/${A}`,
    `/transfers/loans/clubs/${A}`,
    `/stats/players/${player}`,
    "/stats/players?limit=20",
    `/stats/clubs/${A}`,
  ];
  const problems: string[] = [];
  for (const [who, api, selfId] of [
    ["guest", anon, ""],
    ["a player", new Api(actor("entrant2").token), actor("entrant2").userId],
  ] as const) {
    for (const path of paths) {
      const res = await api.raw("GET", path);
      const found = leaks(res.body, selfId);
      if (found.length) problems.push(`${who}: GET ${path} → ${found.join(", ")}`);
    }
  }
  await as("freeAgent2").raw("POST", `/tournaments/${t.id}/leave`, {});
  await as("organizer").del(`/tournaments/${t.id}`);
  expect(problems, problems.join("\n")).toEqual([]);
});

test("your own account still shows your private details", async () => {
  const me = await as("entrant2").me();
  expect(me.email).toBe(actor("entrant2").email);
  expect(me.phoneNumber).toBeTruthy();
});
