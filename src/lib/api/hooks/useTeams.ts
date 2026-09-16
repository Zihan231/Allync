import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getClubMembers,
  getTeams,
  getTeam,
  getFreeClubPlayers,
  createTeam,
  updateTeam,
  deleteTeam,
  setLineup,
  substitutePlayer,
  shiftPlayerPosition,
  swapPlayerPositions,
  addTeamPlayer,
  removeTeamPlayer,
  applyFormation,
  type LineupPlayerInput,
  type BackendLineupStatus,
} from "@/lib/api/teams";

export const teamKeys = {
  members: (clubId: string) => ["clubs", clubId, "members"] as const,
  freePlayers: (clubId: string) => ["clubs", clubId, "teams", "free-players"] as const,
  list: (clubId: string) => ["clubs", clubId, "teams"] as const,
  detail: (clubId: string, teamId: string) => ["clubs", clubId, "teams", teamId] as const,
};

export function useClubMembers(clubId: string) {
  return useQuery({
    queryKey: teamKeys.members(clubId),
    queryFn: () => getClubMembers(clubId),
    enabled: Boolean(clubId),
  });
}

export function useFreeClubPlayers(clubId: string) {
  return useQuery({
    queryKey: teamKeys.freePlayers(clubId),
    queryFn: () => getFreeClubPlayers(clubId),
    enabled: Boolean(clubId),
  });
}

export function useTeams(clubId: string) {
  return useQuery({
    queryKey: teamKeys.list(clubId),
    queryFn: () => getTeams(clubId),
    enabled: Boolean(clubId),
  });
}

export function useTeam(clubId: string, teamId: string) {
  return useQuery({
    queryKey: teamKeys.detail(clubId, teamId),
    queryFn: () => getTeam(clubId, teamId),
    enabled: Boolean(clubId) && Boolean(teamId),
  });
}

export function useCreateTeam(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createTeam(clubId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.list(clubId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.freePlayers(clubId) });
    },
  });
}

export function useUpdateTeam(clubId: string, teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: { name?: string; captainProfileId?: string | null; formation?: string }) =>
      updateTeam(clubId, teamId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(clubId, teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.list(clubId) });
    },
  });
}

export function useDeleteTeam(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) => deleteTeam(clubId, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.list(clubId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.freePlayers(clubId) });
    },
  });
}

export function useSetLineup(clubId: string, teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (players: LineupPlayerInput[]) => setLineup(clubId, teamId, players),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(clubId, teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.list(clubId) });
    },
  });
}

export function useSubstitutePlayer(clubId: string, teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ outProfileId, inProfileId }: { outProfileId: string; inProfileId: string }) =>
      substitutePlayer(clubId, teamId, outProfileId, inProfileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(clubId, teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.list(clubId) });
    },
  });
}

export function useShiftPosition(clubId: string, teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, gamePosition }: { profileId: string; gamePosition: string }) =>
      shiftPlayerPosition(clubId, teamId, profileId, gamePosition),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(clubId, teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.list(clubId) });
    },
  });
}

export function useSwapPositions(clubId: string, teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId1, profileId2 }: { profileId1: string; profileId2: string }) =>
      swapPlayerPositions(clubId, teamId, profileId1, profileId2),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(clubId, teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.list(clubId) });
    },
  });
}

export function useAddTeamPlayer(clubId: string, teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      profileId,
      lineupStatus = "Sub",
      gamePosition,
    }: {
      profileId: string;
      lineupStatus?: BackendLineupStatus;
      gamePosition?: string | null;
    }) => addTeamPlayer(clubId, teamId, profileId, lineupStatus, gamePosition),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(clubId, teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.list(clubId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.freePlayers(clubId) });
    },
  });
}

export function useRemoveTeamPlayer(clubId: string, teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => removeTeamPlayer(clubId, teamId, profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(clubId, teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.list(clubId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.freePlayers(clubId) });
    },
  });
}

export function useApplyFormation(clubId: string, teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formation: string) => applyFormation(clubId, teamId, formation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(clubId, teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.list(clubId) });
    },
  });
}
