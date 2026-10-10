import { api } from "./axios";

/** Stats periods (Bangladesh time; weeks start Monday). Seasons come later. */
export const STATS_PERIODS = ["all-time", "this-week", "last-week", "this-month", "last-month"] as const;
export type StatsPeriod = (typeof STATS_PERIODS)[number];

/** A player's totals over a period, computed from confirmed results. */
export interface StatLine {
  PL: number;
  W: number;
  D: number;
  L: number;
  GF: number;
  GA: number;
  GD: number;
  CS: number;
  HT: number;
  DHT: number;
  /** Current run of consecutive wins. */
  streak: number;
  /** Not recorded yet (always 0). */
  motm: number;
  winPct: number;
  PTS: number;
}

export interface PlayerStatsRow extends StatLine {
  id: string;
  name: string;
  dpUrl: string | null;
  clubName: string | null;
  /** Null when the player has no confirmed games in the period. */
  rank: number | null;
}

export interface ClubStatsRow {
  id: string;
  name: string;
  color: string | null;
  initials: string | null;
  dpUrl: string | null;
  stage: string | null;
  rank: number | null;
  M: number;
  W: number;
  D: number;
  L: number;
  GF: number;
  GA: number;
  GD: number;
  CS: number;
  winPct: number;
  PTS: number;
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface LoadPoint {
  start: string;
  matches: number;
  wins: number;
  goalsFor: number;
}

export interface TrendPoint {
  start: string;
  rank: number | null;
  players: number;
}

export interface PlayerProfileStats {
  userId: string;
  periods: Record<StatsPeriod, StatLine & { rank: number | null; rankedPlayers: number }>;
  snapshot: {
    debut: string | null;
    lastPlayed: string | null;
    avgGapMs: number | null;
    maxGapMs: number | null;
    unbeatenRun: { matches: number; from: string; to: string } | null;
    highestScoring: { goals: number; conceded: number; opponent: string; date: string } | null;
  };
  topOpponents: {
    mostPlayed: { userId: string | null; name: string; matches: number } | null;
    mostWins: { userId: string | null; name: string; wins: number } | null;
  };
  load: { monthly: LoadPoint[]; weekly: LoadPoint[] };
  rankTrend: { monthly: TrendPoint[]; weekly: TrendPoint[] };
  recentGames: Array<{
    gameId: string;
    tournamentId: string;
    tournamentName: string;
    playedAt: string;
    opponentUserId: string | null;
    opponentName: string;
    myGoals: number;
    opponentGoals: number;
    result: "W" | "D" | "L";
  }>;
  tournamentsPlayed: number;
}

export interface PlayerStatsParams {
  period?: StatsPeriod;
  search?: string;
  clubId?: string;
  communityId?: string;
  page?: number;
  limit?: number;
}

export interface ClubStatsParams {
  period?: StatsPeriod;
  search?: string;
  communityId?: string;
  page?: number;
  limit?: number;
}

export async function getPlayerRankings(params: PlayerStatsParams): Promise<Paginated<PlayerStatsRow>> {
  const res = await api.get<Paginated<PlayerStatsRow>>("/stats/players", { params });
  return res.data;
}

export async function getPlayerStats(userId: string): Promise<PlayerProfileStats> {
  const res = await api.get<PlayerProfileStats>(`/stats/players/${userId}`);
  return res.data;
}

export async function getClubRankings(params: ClubStatsParams): Promise<Paginated<ClubStatsRow>> {
  const res = await api.get<Paginated<ClubStatsRow>>("/stats/clubs", { params });
  return res.data;
}

export async function getClubStats(clubId: string): Promise<{ clubId: string; periods: Record<StatsPeriod, ClubStatsRow> }> {
  const res = await api.get<{ clubId: string; periods: Record<StatsPeriod, ClubStatsRow> }>(`/stats/clubs/${clubId}`);
  return res.data;
}
