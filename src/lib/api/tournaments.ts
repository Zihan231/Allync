import { api } from "./axios";

export type TournamentType = "pvp" | "cvc";
export type TournamentPreset = "preset_11v11" | "preset_8v8" | "custom";
export type TournamentStatus =
  | "open"
  | "registration_open"
  | "submission_phase"
  | "registration_closed"
  | "ongoing"
  | "live"
  | "completed"
  | "cancelled";
export type ParticipantType = "club" | "player";
export type ParticipantStatus =
  | "registered"
  | "lineup_submitted"
  | "confirmed"
  | "disqualified";

export interface TournamentLineupPlayer {
  profileId: string;
  userId?: string;
  name: string;
  gamePosition?: string;
  lineupStatus?: string;
}

export interface TournamentLineup {
  starters: TournamentLineupPlayer[];
  substitutes: TournamentLineupPlayer[];
  submittedAt: string;
  submittedByUserId: string;
}

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  participantType: ParticipantType;
  clubId: string | null;
  userId: string | null;
  status: ParticipantStatus;
  lineup: TournamentLineup | null;
  joinedAt: string;
  club?: {
    id: string;
    name: string;
    color?: string;
    initials?: string;
    dpUrl?: string | null;
  } | null;
  user?: {
    id: string;
    name: string;
    dpUrl?: string | null;
  } | null;
}

export interface BracketParticipantRef {
  id: string;
  name: string;
  type: ParticipantType;
  clubId?: string | null;
  userId?: string | null;
}

export interface BracketMatch {
  id: string;
  round: number;
  matchIndex: number;
  participantA: BracketParticipantRef | null;
  participantB: BracketParticipantRef | null;
  winnerId: string | null;
  scoreA: number | null;
  scoreB: number | null;
}

export interface BracketRound {
  round: number;
  roundName: string;
  matches: BracketMatch[];
}

export interface TournamentBracket {
  rounds: BracketRound[];
  totalRounds: number;
}

export interface BackendTournament {
  id: string;
  name: string;
  type: TournamentType;
  preset: TournamentPreset;
  startersCount: number;
  subsCount: number;
  maxParticipants: number;
  status: TournamentStatus;
  isPaid: boolean;
  entryFeeBdt: number;
  prizePoolBdt: number;
  startAt: string;
  endAt: string | null;
  teamSubmissionDeadline: string;
  communityId: string;
  createdById?: string;
  creatorId?: string;
  bracket: TournamentBracket | null;
  createdAt: string;
  updatedAt: string;
  community?: {
    id: string;
    name: string;
    creatorId?: string;
    color?: string;
    initials?: string;
    dpUrl?: string | null;
    presidentId?: string;
    vicePresidentId?: string;
  };
  participants?: TournamentParticipant[];
}

export interface TournamentQueryParams {
  type?: TournamentType;
  status?: TournamentStatus;
  communityId?: string;
  search?: string;
  isPaid?: boolean;
  hasPrizePool?: boolean;
  sortBy?: "startAt" | "prizePoolBdt";
  sortOrder?: "ASC" | "DESC";
}

export interface CreateTournamentPayload {
  name: string;
  type: TournamentType;
  preset?: TournamentPreset;
  startersCount?: number;
  subsCount?: number;
  maxParticipants?: number;
  isPaid?: boolean;
  entryFeeBdt?: number;
  prizePoolBdt?: number;
  startAt: string;
  endAt?: string;
  communityId: string;
}

export interface SubmitLineupPayload {
  starters: TournamentLineupPlayer[];
  substitutes: TournamentLineupPlayer[];
}

export async function getTournaments(
  params?: TournamentQueryParams,
): Promise<BackendTournament[]> {
  const res = await api.get<BackendTournament[]>("/tournaments", { params });
  return res.data;
}

export async function getTournament(id: string): Promise<BackendTournament> {
  const res = await api.get<BackendTournament>(`/tournaments/${id}`);
  return res.data;
}

export async function createTournament(
  payload: CreateTournamentPayload,
): Promise<BackendTournament> {
  const res = await api.post<BackendTournament>("/tournaments", payload);
  return res.data;
}

export async function joinTournament(
  id: string,
  payload?: { clubId?: string },
): Promise<TournamentParticipant> {
  const res = await api.post<TournamentParticipant>(`/tournaments/${id}/join`, payload || {});
  return res.data;
}

export async function submitTournamentLineup(
  tournamentId: string,
  participantId: string,
  payload: SubmitLineupPayload,
): Promise<TournamentParticipant> {
  const res = await api.post<TournamentParticipant>(
    `/tournaments/${tournamentId}/participants/${participantId}/lineup`,
    payload,
  );
  return res.data;
}

export async function generateTournamentBracket(
  tournamentId: string,
): Promise<BackendTournament> {
  const res = await api.post<BackendTournament>(
    `/tournaments/${tournamentId}/generate-bracket`,
    {},
  );
  return res.data;
}
