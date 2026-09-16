import { api } from "./axios";

export type BackendLineupStatus = "Starter" | "Sub" | "None" | "Reserve";

export interface ClubMemberProfile {
  id: string; // EfootballProfile id — the id every team endpoint expects as profileId
  userId: string;
  clubId: string | null;
  teamId: string | null;
  clubRole: string | null;
  lineupStatus: BackendLineupStatus;
  gamePosition: string | null;
  points: number;
  user: { id: string; name: string; dpUrl: string | null } | null;
}

export interface Team {
  id: string;
  name: string;
  clubId: string;
  captainProfileId: string | null;
  captain: ClubMemberProfile | null;
  formation?: string;
  members: ClubMemberProfile[];
  createdAt: string;
  updatedAt: string;
}

export async function getClubMembers(clubId: string): Promise<ClubMemberProfile[]> {
  const res = await api.get<ClubMemberProfile[]>(`/clubs/${clubId}/members`);
  return res.data;
}

export async function getTeams(clubId: string): Promise<Team[]> {
  const res = await api.get<Team[]>(`/clubs/${clubId}/teams`);
  return res.data;
}

export async function getTeam(clubId: string, teamId: string): Promise<Team> {
  const res = await api.get<Team>(`/clubs/${clubId}/teams/${teamId}`);
  return res.data;
}

export async function getFreeClubPlayers(clubId: string): Promise<ClubMemberProfile[]> {
  const res = await api.get<ClubMemberProfile[]>(`/clubs/${clubId}/teams/free-players`);
  return res.data;
}

export async function createTeam(clubId: string, name: string): Promise<Team> {
  const res = await api.post<Team>(`/clubs/${clubId}/teams`, { name });
  return res.data;
}

export async function updateTeam(
  clubId: string,
  teamId: string,
  patch: { name?: string; captainProfileId?: string | null; formation?: string },
): Promise<Team> {
  const res = await api.patch<Team>(`/clubs/${clubId}/teams/${teamId}`, patch);
  return res.data;
}

export async function deleteTeam(clubId: string, teamId: string): Promise<void> {
  await api.delete<void>(`/clubs/${clubId}/teams/${teamId}`);
}

export interface LineupPlayerInput {
  profileId: string;
  lineupStatus: BackendLineupStatus;
  gamePosition?: string;
}

export async function setLineup(
  clubId: string,
  teamId: string,
  players: LineupPlayerInput[],
): Promise<Team> {
  const res = await api.put<Team>(`/clubs/${clubId}/teams/${teamId}/lineup`, { players });
  return res.data;
}

export interface SubstituteResult {
  message: string;
  inPlayer: ClubMemberProfile;
  outPlayer: ClubMemberProfile;
}

export async function substitutePlayer(
  clubId: string,
  teamId: string,
  outProfileId: string,
  inProfileId: string,
): Promise<SubstituteResult> {
  const res = await api.post<SubstituteResult>(`/clubs/${clubId}/teams/${teamId}/substitute`, {
    outProfileId,
    inProfileId,
  });
  return res.data;
}

export async function shiftPlayerPosition(
  clubId: string,
  teamId: string,
  profileId: string,
  gamePosition: string,
): Promise<ClubMemberProfile> {
  const res = await api.patch<ClubMemberProfile>(
    `/clubs/${clubId}/teams/${teamId}/players/${profileId}/position`,
    { gamePosition },
  );
  return res.data;
}

export async function swapPlayerPositions(
  clubId: string,
  teamId: string,
  profileId1: string,
  profileId2: string,
): Promise<{ message: string; player1: ClubMemberProfile; player2: ClubMemberProfile }> {
  const res = await api.post<{
    message: string;
    player1: ClubMemberProfile;
    player2: ClubMemberProfile;
  }>(`/clubs/${clubId}/teams/${teamId}/swap-positions`, {
    profileId1,
    profileId2,
  });
  return res.data;
}

export async function addTeamPlayer(
  clubId: string,
  teamId: string,
  profileId: string,
  lineupStatus: BackendLineupStatus = "Sub",
  gamePosition?: string | null,
): Promise<ClubMemberProfile> {
  const res = await api.post<ClubMemberProfile>(`/clubs/${clubId}/teams/${teamId}/players`, {
    profileId,
    lineupStatus,
    gamePosition: gamePosition ?? null,
  });
  return res.data;
}

export async function removeTeamPlayer(
  clubId: string,
  teamId: string,
  profileId: string,
): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(
    `/clubs/${clubId}/teams/${teamId}/players/${profileId}`,
  );
  return res.data;
}

export async function applyFormation(
  clubId: string,
  teamId: string,
  formation: string,
): Promise<Team> {
  const res = await api.post<Team>(`/clubs/${clubId}/teams/${teamId}/formation`, {
    formation,
  });
  return res.data;
}
