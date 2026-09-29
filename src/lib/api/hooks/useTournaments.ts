import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTournaments,
  getTournament,
  createTournament,
  joinTournament,
  submitTournamentLineup,
  generateTournamentBracket,
  getTournamentStructure,
  submitGameResult,
  getReviewQueue,
  getGameForReview,
  reviewGame,
  requestTimeChange,
  respondTimeChange,
  updateTournament,
  deleteTournament,
  type BackendTournament,
  type TournamentQueryParams,
  type CreateTournamentPayload,
  type SubmitLineupPayload,
  type TournamentParticipant,
  type UpdateTournamentPayload,
  type JoinTournamentPayload,
  type TournamentStructure,
  type GameResultInput,
  type GameSubmission,
  type ReviewGame,
  type ReviewDecision,
  type ReviewResult,
} from "../tournaments";

export const tournamentKeys = {
  all: ["tournaments"] as const,
  list: (params?: TournamentQueryParams) => ["tournaments", "list", params] as const,
  detail: (id: string) => ["tournaments", "detail", id] as const,
  structure: (id: string) => ["tournaments", "structure", id] as const,
  reviewQueue: (id: string) => ["tournaments", "review-queue", id] as const,
  reviewGame: (id: string, gameId: string) => ["tournaments", "review-game", id, gameId] as const,
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

/** Groups, standings and knockout rounds for a tournament (empty until generated). */
export function useTournamentStructure(tournamentId: string, enabled = true) {
  return useQuery<TournamentStructure>({
    queryKey: tournamentKeys.structure(tournamentId),
    queryFn: () => getTournamentStructure(tournamentId),
    enabled: enabled && Boolean(tournamentId),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useGenerateTournamentBracket(tournamentId: string) {
  const queryClient = useQueryClient();
  return useMutation<TournamentStructure, Error, void>({
    mutationFn: () => generateTournamentBracket(tournamentId),
    onSuccess: (structure) => {
      queryClient.setQueryData(tournamentKeys.structure(tournamentId), structure);
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

export function useSubmitGameResult(tournamentId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    GameSubmission,
    Error,
    { gameId: string; input: GameResultInput; onProgress?: (percent: number) => void }
  >({
    mutationFn: ({ gameId, input, onProgress }) => submitGameResult(tournamentId, gameId, input, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tournamentKeys.structure(tournamentId) });
    },
  });
}

/** Officials only (the API answers 403 for everyone else, so gate with `enabled`). */
export function useReviewQueue(tournamentId: string, enabled: boolean) {
  return useQuery<ReviewGame[]>({
    queryKey: tournamentKeys.reviewQueue(tournamentId),
    queryFn: () => getReviewQueue(tournamentId),
    enabled: enabled && Boolean(tournamentId),
    staleTime: 1000 * 15,
    retry: false,
  });
}

export function useGameReview(tournamentId: string, gameId: string | null) {
  return useQuery<ReviewGame>({
    queryKey: tournamentKeys.reviewGame(tournamentId, gameId ?? ""),
    queryFn: () => getGameForReview(tournamentId, gameId!),
    enabled: Boolean(tournamentId && gameId),
    retry: false,
  });
}

export function useReviewGame(tournamentId: string) {
  const queryClient = useQueryClient();
  return useMutation<ReviewResult, Error, { gameId: string; decision: ReviewDecision }>({
    mutationFn: ({ gameId, decision }) => reviewGame(tournamentId, gameId, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tournamentKeys.structure(tournamentId) });
      queryClient.invalidateQueries({ queryKey: tournamentKeys.reviewQueue(tournamentId) });
      queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(tournamentId) });
      queryClient.invalidateQueries({ queryKey: ["tournaments", "review-game", tournamentId] });
    },
  });
}

export function useRequestTimeChange(tournamentId: string) {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { gameId: string; proposedStart: string }>({
    mutationFn: ({ gameId, proposedStart }) => requestTimeChange(tournamentId, gameId, proposedStart),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tournamentKeys.structure(tournamentId) }),
  });
}

export function useRespondTimeChange(tournamentId: string) {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { requestId: string; accept: boolean }>({
    mutationFn: ({ requestId, accept }) => respondTimeChange(tournamentId, requestId, accept),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tournamentKeys.structure(tournamentId) }),
  });
}
