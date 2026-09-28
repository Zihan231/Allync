import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTournaments,
  getTournament,
  createTournament,
  joinTournament,
  submitTournamentLineup,
  generateTournamentBracket,
  updateTournament,
  deleteTournament,
  type BackendTournament,
  type TournamentQueryParams,
  type CreateTournamentPayload,
  type SubmitLineupPayload,
  type TournamentParticipant,
  type UpdateTournamentPayload,
  type JoinTournamentPayload,
} from "../tournaments";

export const tournamentKeys = {
  all: ["tournaments"] as const,
  list: (params?: TournamentQueryParams) => ["tournaments", "list", params] as const,
  detail: (id: string) => ["tournaments", "detail", id] as const,
};

/**
 * `viewerId` must be passed for per-user queries (e.g. `joined: true`) so cached results are
 * never shown to a different signed-in user; the query waits until it is known.
 */
export function useTournaments(params?: TournamentQueryParams, viewerId?: string | null) {
  const perUser = Boolean(params?.joined);
  return useQuery<BackendTournament[]>({
    queryKey: perUser ? [...tournamentKeys.list(params), viewerId] : tournamentKeys.list(params),
    queryFn: () => getTournaments(params),
    enabled: !perUser || Boolean(viewerId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useTournament(id: string) {
  return useQuery<BackendTournament>({
    queryKey: tournamentKeys.detail(id),
    queryFn: () => getTournament(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useCreateTournament() {
  const queryClient = useQueryClient();
  return useMutation<BackendTournament, Error, CreateTournamentPayload>({
    mutationFn: (payload: CreateTournamentPayload) => createTournament(payload),
    onSuccess: (newTour) => {
      queryClient.invalidateQueries({ queryKey: tournamentKeys.all });
      queryClient.setQueriesData<BackendTournament[]>(
        { queryKey: ["tournaments", "list"] },
        (old) => {
          if (!old) return [newTour];
          const exists = old.some((t) => t.id === newTour.id);
          return exists ? old : [newTour, ...old];
        },
      );
    },
  });
}

export function useJoinTournament(tournamentId: string) {
  const queryClient = useQueryClient();
  return useMutation<TournamentParticipant, Error, JoinTournamentPayload | undefined>({
    mutationFn: (payload?: JoinTournamentPayload) => joinTournament(tournamentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(tournamentId) });
      queryClient.invalidateQueries({ queryKey: tournamentKeys.all });
    },
  });
}

export function useSubmitTournamentLineup(tournamentId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    TournamentParticipant,
    Error,
    { participantId: string; payload: SubmitLineupPayload }
  >({
    mutationFn: ({ participantId, payload }) =>
      submitTournamentLineup(tournamentId, participantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(tournamentId) });
      queryClient.invalidateQueries({ queryKey: tournamentKeys.all });
    },
  });
}

export function useGenerateTournamentBracket(tournamentId: string) {
  const queryClient = useQueryClient();
  return useMutation<BackendTournament, Error, void>({
    mutationFn: () => generateTournamentBracket(tournamentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(tournamentId) });
      queryClient.invalidateQueries({ queryKey: tournamentKeys.all });
    },
  });
}

export function useUpdateTournament(tournamentId: string) {
  const queryClient = useQueryClient();
  return useMutation<BackendTournament, Error, UpdateTournamentPayload>({
    mutationFn: (payload) => updateTournament(tournamentId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(tournamentKeys.detail(tournamentId), updated);
      queryClient.invalidateQueries({ queryKey: tournamentKeys.all });
    },
  });
}

export function useDeleteTournament(tournamentId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ id: string }, Error, void>({
    mutationFn: () => deleteTournament(tournamentId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: tournamentKeys.detail(tournamentId) });
      queryClient.invalidateQueries({ queryKey: tournamentKeys.all });
    },
  });
}
