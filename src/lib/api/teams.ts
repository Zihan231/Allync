import { apiFetch } from "./client";

export type BackendLineupStatus = "Starter" | "Sub" | "None";

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
  members: ClubMemberProfile[];
  createdAt: string;
  updatedAt: string;
}

export function getClubMembers(clubId: string): Promise<ClubMemberProfile[]> {
  return apiFetch<ClubMemberProfile[]>(`/clubs/${clubId}/members`);
}

export function getTeams(clubId: string): Promise<Team[]> {
  return apiFetch<Team[]>(`/clubs/${clubId}/teams`);
}

export function getTeam(clubId: string, teamId: string): Promise<Team> {
  return apiFetch<Team>(`/clubs/${clubId}/teams/${teamId}`);
}

export function createTeam(clubId: string, name: string): Promise<Team> {
  return apiFetch<Team>(`/clubs/${clubId}/teams`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function updateTeam(
  clubId: string,
  teamId: string,
  patch: { name?: string; captainProfileId?: string | null },
): Promise<Team> {
  return apiFetch<Team>(`/clubs/${clubId}/teams/${teamId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteTeam(clubId: string, teamId: string): Promise<void> {
  return apiFetch<void>(`/clubs/${clubId}/teams/${teamId}`, { method: "DELETE" });
}

export interface LineupPlayerInput {
  profileId: string;
  lineupStatus: BackendLineupStatus;
  gamePosition?: string;
}

export function setLineup(
  clubId: string,
  teamId: string,
  players: LineupPlayerInput[],
): Promise<Team> {
  return apiFetch<Team>(`/clubs/${clubId}/teams/${teamId}/lineup`, {
    method: "PUT",
    body: JSON.stringify({ players }),
  });
}

export interface SubstituteResult {
  message: string;
  inPlayer: ClubMemberProfile;
  outPlayer: ClubMemberProfile;
}

export function substitutePlayer(
  clubId: string,
  teamId: string,
  outProfileId: string,
  inProfileId: string,
): Promise<SubstituteResult> {
  return apiFetch<SubstituteResult>(`/clubs/${clubId}/teams/${teamId}/substitute`, {
    method: "POST",
    body: JSON.stringify({ outProfileId, inProfileId }),
  });
}
