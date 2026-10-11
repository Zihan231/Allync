import { test as setup, expect } from "@playwright/test";
import { Api } from "../lib/api";
import { APP_URL } from "../lib/env";
import { makeStaff, signUp, writeStorageState } from "../lib/actors";
import { ROLE_KEYS, saveCast, type Actor, type Cast, type RoleKey } from "../lib/cast";

/**
 * Builds the run's cast through the real API: every user role, two clubs with their
 * staff, one community with every community role, three staff members (2FA included),
 * funded wallets, and a browser session per user.
 */
setup("build the e2e cast", async () => {
  setup.setTimeout(10 * 60_000);
  const runId = `${Date.now().toString(36)}${Math.floor(Math.random() * 36 ** 2).toString(36)}`;
  const actors = {} as Record<RoleKey, Actor>;

  for (const [key, name] of Object.entries(ROLE_KEYS) as Array<[RoleKey, string]>) {
    actors[key] = await signUp(runId, key, name);
  }
  const as = (key: RoleKey) => new Api(actors[key].token);

  // Console player (the rest play on mobile).
  await as("consolePlayer").patch("/users/me", { gamingPlatform: "console" });

  // ---------------------------------------------------------------- clubs
  const makeClub = async (president: RoleKey, label: string, color: string) => {
    const club = await as(president).post("/clubs", {
      name: `E2E ${runId} ${label}`,
      color,
      initials: label.slice(0, 2).toUpperCase(),
      description: `Automated test club (${runId})`,
      joinPolicy: "approval",
      minRoster: 1,
      maxRoster: 30,
    });
    return club.id as string;
  };
  const alpha = await makeClub("alphaPresident", "Alpha", "#22c55e");
  const beta = await makeClub("betaPresident", "Beta", "#3b82f6");

  // Club wallets pay for offers; leaders top them up (demo funds).
  for (const [leader, clubId] of [["alphaPresident", alpha], ["betaPresident", beta]] as const) {
    await as(leader).topUp(clubId);
    await as(leader).topUp(clubId);
  }

  /** The club leader offers a free player 0 tk and he accepts: he joins the club. */
  const sign = async (leader: RoleKey, clubId: string, player: RoleKey) => {
    const offer = await as(leader).post("/transfers/offers", { clubId, playerUserId: actors[player].userId, amountTk: 0 });
    await as(player).post(`/transfers/offers/${offer.id}/respond`, { accept: true });
  };
  const position = (leader: RoleKey, clubId: string, member: RoleKey, role: string) =>
    as(leader).patch(`/clubs/${clubId}/positions`, { profileId: actors[member].profileId, role });

  const alphaStaff: Array<[RoleKey, string]> = [
    ["alphaGs", "General Secretary"],
    ["alphaCaptain", "Captain"],
    ["alphaViceCaptain", "Vice-Captain"],
    ["alphaAcademyCaptain", "Academy Captain"],
    ["alphaManager", "Manager"],
  ];
  for (const [member] of alphaStaff) await sign("alphaPresident", alpha, member);
  await sign("alphaPresident", alpha, "alphaPlayer");
  await sign("alphaPresident", alpha, "alphaPlayer2");
  for (const [member, role] of alphaStaff) await position("alphaPresident", alpha, member, role);

  await sign("betaPresident", beta, "betaGs");
  await sign("betaPresident", beta, "betaPlayer");
  await sign("betaPresident", beta, "betaPlayer2");
  await position("betaPresident", beta, "betaGs", "General Secretary");

  // ------------------------------------------------------------ community
  const community = await as("commPresident").post("/communities", {
    name: `E2E ${runId} Community`,
    description: `Automated test community (${runId})`,
    joinPolicy: "instant",
    color: "#f59e0b",
    initials: "EC",
  });
  const communityId: string = community.id;
  const commRoles: Array<[RoleKey, string]> = [
    ["commVicePresident", "Vice President"],
    ["commTeamManager", "Team Manager"],
    ["commHeadOfDiscipline", "Head of Discipline"],
    ["commScout", "Scout"],
    ["commMember", "Member"],
  ];
  for (const [member] of commRoles) {
    const joined = await as(member).post(`/communities/${communityId}/join`, {});
    // An approval community answers with a request: approve it.
    if (joined?.request?.id || joined?.status === "pending") {
      const requests = await as("commPresident").get(`/communities/${communityId}/requests`);
      for (const r of requests) await as("commPresident").post(`/communities/${communityId}/requests/${r.id}/review`, { approve: true });
    }
  }
  for (const [member, role] of commRoles) {
    if (role === "Member") continue;
    await as("commPresident").patch(`/communities/${communityId}/roles`, { targetUserId: actors[member].userId, role });
  }

  // --------------------------------------------------------------- wallets
  for (const key of ["organizer", "entrant1", "entrant2", "freeAgent", "consolePlayer"] as RoleKey[]) await as(key).topUp();

  // ----------------------------------------------------------------- staff
  actors.moderator = await makeStaff(actors.moderator, "moderator");
  actors.admin = await makeStaff(actors.admin, "admin");
  actors.superAdmin = await makeStaff(actors.superAdmin, "super_admin");

  // Sanity: the cast is what we think it is.
  const alphaMembers = await as("alphaPresident").get(`/clubs/${alpha}/members`);
  const roleOf = (key: RoleKey) =>
    (Array.isArray(alphaMembers) ? alphaMembers : alphaMembers.data ?? alphaMembers.items ?? []).find(
      (m: any) => (m.userId ?? m.user?.id ?? m.id) === actors[key].userId || m.id === actors[key].profileId,
    )?.clubRole;
  expect(roleOf("alphaPresident")).toBe("President");
  expect(roleOf("alphaManager")).toBe("Manager");

  const cast: Cast = {
    runId,
    startedAt: new Date().toISOString(),
    actors,
    clubs: { alpha, beta },
    communityId,
    created: { tournaments: [], storeItems: [] },
  };
  saveCast(cast);
  for (const actor of Object.values(actors)) writeStorageState(actor);

  // The dev server compiles each route on its first visit: do it now, not inside a UI test.
  const warm = [
    "/login", "/signup", "/dashboard", "/dashboard/efootball", "/dashboard/efootball/clubs", `/dashboard/efootball/clubs/${alpha}`,
    "/dashboard/efootball/community", `/dashboard/efootball/community/${communityId}`, "/dashboard/efootball/tournaments",
    "/dashboard/efootball/tournaments/general", "/dashboard/efootball/store", "/dashboard/efootball/wallet",
    "/dashboard/efootball/transfers", `/dashboard/efootball/players/${actors.alphaPlayer.userId}`, "/dashboard/organizer",
    "/dashboard/organizer/create", "/dashboard/admin", "/dashboard/admin/users",
  ];
  for (const path of warm) await fetch(`${APP_URL}${path}`).catch(() => undefined);
  console.log(`e2e cast ${runId}: ${Object.keys(actors).length} users, clubs ${alpha} / ${beta}, community ${communityId}`);
});
