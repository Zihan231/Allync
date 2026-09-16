import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getClubMembers,
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  setLineup,
  substitutePlayer,
  type LineupPlayerInput,
} from "@/lib/api/teams";

export const teamKeys = {
  members: (clubId: string) => ["clubs", clubId, "members"] as const,
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
    },
  });
}

export function useUpdateTeam(clubId: string, teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: { name?: string; captainProfileId?: string | null }) =>
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
