import { api } from "./axios";
import type { Paged } from "./admin";

// ------------------------------------------------------------ dispute centre

export type DisputeState = "review" | "ready" | "stale" | "rejected" | "all";

export interface DisputeRow {
  id: string;
  status: string;
  slot: number;
  isDecider: boolean;
  playerAName: string;
  playerBName: string;
  playerADpUrl: string | null;
  playerBDpUrl: string | null;
  evidenceDeadline: string | null;
  updatedAt: string;
  reviewNote: string | null;
  matchId: string;
  roundName: string;
  stage: "group" | "knockout";
  groupLabel: string | null;
  tournamentId: string;
  tournamentName: string;
  tournamentType: "pvp" | "cvc";
  hostName: string | null;
  submissions: number;
  officials: number;
  reviewOpen: boolean;
  stale: boolean;
}

export interface DisputeQuery {
  state?: DisputeState;
  tournamentId?: string;
  communityId?: string;
  clubId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface EvidenceSubmission {
  id: string;
  side: "A" | "B";
  goalsA: number;
  goalsB: number;
  screenshotUrls: string[];
  videoUrl: string | null;
  submittedAt: string;
}

export interface DisputeDetail {
  game: {
    gameId: string;
    matchId: string;
    stage: "group" | "knockout";
    groupLabel: string | null;
    roundName: string;
    slot: number;
    isDecider: boolean;
    status: string;
    entrantA: string;
    entrantB: string;
    playerA: { userId: string | null; name: string; dpUrl: string | null };
    playerB: { userId: string | null; name: string; dpUrl: string | null };
    goalsA: number | null;
    goalsB: number | null;
    reviewNote: string | null;
    submissions: EvidenceSubmission[];
    reviewOpen: boolean;
    reviewOpensAt: string | null;
  };
  tournament: {
    id: string;
    name: string;
    type: "pvp" | "cvc";
    status: string;
    hostName: string | null;
    hostClubId: string | null;
    communityId: string | null;
    matchOfficialIds: string[];
  };
  reviewers: Array<{ id: string; name: string }>;
}

export interface DecideInput {
  action: "approve" | "reject";
  goalsA?: number;
  goalsB?: number;
  note?: string;
  deciderWinner?: "A" | "B";
}

export async function getDisputes(query: DisputeQuery): Promise<Paged<DisputeRow>> {
  return (await api.get("/admin/disputes", { params: query })).data;
}

export async function getDispute(gameId: string): Promise<DisputeDetail> {
  return (await api.get(`/admin/disputes/${gameId}`)).data;
}

export async function decideDispute(gameId: string, input: DecideInput): Promise<{ fixture: "pending" | "needs_decider" | "completed" }> {
  return (await api.post(`/admin/disputes/${gameId}/decide`, input)).data;
}

// ------------------------------------------------- clubs and communities

export interface Member {
  profileId: string;
  userId: string;
  name: string;
  dpUrl: string | null;
  role: string;
}

interface Frozen {
  frozenAt: string | null;
  frozenReason: string | null;
  frozenByName: string | null;
}

export interface ManagedClub extends Frozen {
  id: string;
  name: string;
  dpUrl: string | null;
  color: string;
  motto: string | null;
  location: string | null;
  minRoster: number;
  maxRoster: number;
  points: number;
  createdAt: string;
  members: Member[];
  communities: Array<{ id: string; name: string }>;
  stats: { hostedTournaments: number; openOffers: number; openReports: number };
}

export interface ManagedCommunity extends Frozen {
  id: string;
  name: string;
  dpUrl: string | null;
  color: string;
  motto: string | null;
  location: string | null;
  tier: string;
  createdAt: string;
  creatorId: string;
  creatorName: string | null;
  leaders: Member[];
  clubs: Array<{ id: string; name: string; dpUrl: string | null }>;
  stats: { members: number; tournaments: number; openReports: number };
}

export interface ManagedTournament {
  id: string;
  name: string;
  type: "pvp" | "cvc";
  status: "registration_open" | "submission_phase" | "ongoing" | "completed" | "cancelled";
  format: string | null;
  startAt: string;
  endAt: string | null;
  registrationDeadline: string | null;
  teamSubmissionDeadline: string | null;
  maxParticipants: number;
  matchOfficialIds: string[];
  communityId: string | null;
  hostClubId: string | null;
  createdAt: string;
  hostName: string | null;
  creatorName: string | null;
  participants: Array<{
    id: string;
    participantType: "club" | "player";
    status: string;
    clubId: string | null;
    userId: string | null;
    name: string;
    dpUrl: string | null;
    createdAt: string;
  }>;
  officials: Array<{ id: string; name: string; dpUrl: string | null }>;
  stats: { matchesDone: number; matches: number; gamesInReview: number };
}

export type LeaderRole = "President" | "General Secretary" | "Vice President";

export const getManagedClub = async (id: string): Promise<ManagedClub> => (await api.get(`/admin/manage/club/${id}`)).data;
export const getManagedCommunity = async (id: string): Promise<ManagedCommunity> => (await api.get(`/admin/manage/community/${id}`)).data;
export const getManagedTournament = async (id: string): Promise<ManagedTournament> => (await api.get(`/admin/manage/tournament/${id}`)).data;
export const searchCommunityMembers = async (id: string, search: string): Promise<Array<{ userId: string; name: string; dpUrl: string | null; role: string }>> =>
  (await api.get(`/admin/manage/community/${id}/members`, { params: { search } })).data;

/** Every management write, as one tagged union so the page can use one mutation. */
export type ManageAction =
  /** Only the changed fields (name, motto, location, and for clubs minRoster / maxRoster), plus an optional reason. */
  | { kind: "editClub" | "editCommunity"; id: string; body: Record<string, string | number | undefined> }
  | { kind: "clubLeader" | "communityLeader"; id: string; body: { userId: string; role: LeaderRole; reason: string } }
  | { kind: "clubCommunity"; id: string; body: { communityId: string; action: "add" | "remove"; reason?: string } }
  | { kind: "freeze" | "unfreeze"; target: "club" | "community"; id: string; body: { reason?: string } }
  | { kind: "tournamentTimes"; id: string; body: { startAt?: string; endAt?: string; registrationDeadline?: string; reason?: string } }
  | { kind: "tournamentStatus"; id: string; body: { status: string; reason: string } }
  | { kind: "tournamentOfficials"; id: string; body: { userIds: string[]; reason?: string } }
  | { kind: "removeEntry"; id: string; participantId: string; body: { reason: string } };

export async function runManageAction(a: ManageAction): Promise<unknown> {
  switch (a.kind) {
    case "editClub":
      return (await api.patch(`/admin/manage/club/${a.id}`, a.body)).data;
    case "editCommunity":
      return (await api.patch(`/admin/manage/community/${a.id}`, a.body)).data;
    case "clubLeader":
      return (await api.post(`/admin/manage/club/${a.id}/leader`, a.body)).data;
    case "communityLeader":
      return (await api.post(`/admin/manage/community/${a.id}/leader`, a.body)).data;
    case "clubCommunity":
      return (await api.post(`/admin/manage/club/${a.id}/community`, a.body)).data;
    case "freeze":
    case "unfreeze":
      return (await api.post(`/admin/manage/${a.target}/${a.id}/${a.kind}`, a.body)).data;
    case "tournamentTimes":
      return (await api.patch(`/admin/manage/tournament/${a.id}/times`, a.body)).data;
    case "tournamentStatus":
      return (await api.post(`/admin/manage/tournament/${a.id}/status`, a.body)).data;
    case "tournamentOfficials":
      return (await api.put(`/admin/manage/tournament/${a.id}/officials`, a.body)).data;
    case "removeEntry":
      return (await api.delete(`/admin/manage/tournament/${a.id}/participants/${a.participantId}`, { data: a.body })).data;
  }
}
