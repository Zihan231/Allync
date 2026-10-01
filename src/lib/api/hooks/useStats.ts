import { useQuery } from "@tanstack/react-query";
import {
  getClubRankings,
  getClubStats,
  getPlayerRankings,
  getPlayerStats,
  type ClubStatsParams,
  type PlayerStatsParams,
  type PlayerStatsRow,
  type StatsPeriod,
} from "@/lib/api/stats";

export const statsKeys = {
  all: ["stats"] as const,
  players: (params: PlayerStatsParams) => ["stats", "players", params] as const,
  player: (userId: string) => ["stats", "player", userId] as const,
  clubs: (params: ClubStatsParams) => ["stats", "clubs", params] as const,
  club: (clubId: string) => ["stats", "club", clubId] as const,
};

const STALE_MS = 60 * 1000;

/** Ranked player stats (global, a club's squad, or a community's members). Keeps the last page while the next loads. */
export function usePlayerRankings(params: PlayerStatsParams, enabled = true) {
  return useQuery({
    queryKey: statsKeys.players(params),
    queryFn: () => getPlayerRankings(params),
    placeholderData: (previous) => previous,
    staleTime: STALE_MS,
    enabled,
  });
}

export function usePlayerStats(userId: string | undefined) {
  return useQuery({
    queryKey: statsKeys.player(userId ?? ""),
    queryFn: () => getPlayerStats(userId!),
    enabled: Boolean(userId),
    staleTime: STALE_MS,
  });
}

export function useClubRankings(params: ClubStatsParams, enabled = true) {
  return useQuery({
    queryKey: statsKeys.clubs(params),
    queryFn: () => getClubRankings(params),
    placeholderData: (previous) => previous,
    staleTime: STALE_MS,
    enabled,
  });
}

export function useClubStats(clubId: string | undefined) {
  return useQuery({
    queryKey: statsKeys.club(clubId ?? ""),
    queryFn: () => getClubStats(clubId!),
    enabled: Boolean(clubId),
    staleTime: STALE_MS,
  });
}

/**
 * Every member's stats for a club or community (all pages; the API caps a page
 * at 100). For views that filter and sort members on the client, like the squad.
 */
export function useAllPlayerStats(params: { clubId?: string; communityId?: string; period?: StatsPeriod }) {
  return useQuery({
    queryKey: ["stats", "players-all", params] as const,
    queryFn: async () => {
      const rows: PlayerStatsRow[] = [];
      for (let page = 1; ; page++) {
        const res = await getPlayerRankings({ ...params, page, limit: 100 });
        rows.push(...res.data);
        if (page >= res.meta.totalPages) return rows;
      }
    },
    enabled: Boolean(params.clubId || params.communityId),
    placeholderData: (previous) => previous,
    staleTime: STALE_MS,
  });
}
