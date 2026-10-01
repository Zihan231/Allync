import { api } from "./axios";

export type TournamentType = "pvp" | "cvc";
/** CvC roster presets. "11v11" is legacy (older tournaments only; not offered on create). */
export type TournamentPreset = "16v16" | "12v12" | "8v8" | "4v4" | "custom" | "11v11";

/** Selectable CvC presets with their fixed roster sizes (mirrors the backend). */
export const TOURNAMENT_PRESET_ROSTERS = [
  { preset: "16v16", startersCount: 16, subsCount: 8 },
  { preset: "12v12", startersCount: 12, subsCount: 6 },
  { preset: "8v8", startersCount: 8, subsCount: 4 },
  { preset: "4v4", startersCount: 4, subsCount: 2 },
] as const satisfies readonly { preset: TournamentPreset; startersCount: number; subsCount: number }[];
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
  inGameId?: string;
  dpUrl?: string;
  lineupStatus?: string;
}

export interface TournamentLineup {
  teamId?: string | null;
  teamName?: string | null;
  starters: TournamentLineupPlayer[];
  substitutes: TournamentLineupPlayer[];
  /** @deprecated The backend stores this on the participant (`submittedAt`). */
  submittedAt?: string;
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
  submittedAt?: string | null;
  /** When the participant registered (the backend's creation timestamp). */
  createdAt: string;
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
    inGameId?: string | null;
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
  /** Hosting community; null for a club-hosted tournament (then `hostClubId` is set). */
  communityId: string | null;
  /** Hosting club (club tournaments are PvP for the club's members). */
  hostClubId?: string | null;
  hostClub?: {
    id: string;
    name: string;
    color?: string;
    initials?: string;
    dpUrl?: string | null;
    /** The hosting club's match-official nominees (detail endpoint). */
    matchOfficialIds?: string[];
  } | null;
  createdById?: string;
  creatorId?: string;
  bracket: TournamentBracket | null;
  /** Set once fixtures are generated. */
  format?: TournamentFormat | null;
  /** Daily play hours, minutes after midnight (Bangladesh time); null = 19:00–01:00. */
  playHoursStart?: number | null;
  playHoursEnd?: number | null;
  /** User ids of the match officials, who review evidence with the President / Vice President. */
  matchOfficialIds?: string[];
  /** Returned by the list endpoint instead of the full participants array. */
  participantCount?: number;
  /** List endpoint: winner of a completed tournament. */
  champion?: { name: string; dpUrl: string | null } | null;
  /** List endpoint: the viewer (or their club) entered it. */
  joinedByMe?: boolean;
  /** List endpoint: the viewer's community hosts it (they're President / VP) or they created it. */
  hostedByMe?: boolean;
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
  /** Only tournaments this club has entered. */
  clubId?: string;
  /** Only tournaments this club hosts. */
  hostClubId?: string;
  search?: string;
  isPaid?: boolean;
  hasPrizePool?: boolean;
  sortBy?: "startAt" | "prizePoolBdt";
  sortOrder?: "ASC" | "DESC";
  /** Only tournaments the signed-in user (or their club) has entered. */
  joined?: boolean;
  /** The signed-in user's tournaments: entered, hosted by their community (President / VP), or either. */
  scope?: "joined" | "hosted" | "mine";
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
  /** Exactly one host: a community, or a club (club tournaments are PvP). */
  communityId?: string;
  hostClubId?: string;
  playHoursStart?: number;
  playHoursEnd?: number;
  matchOfficialIds?: string[];
}

/** App link to a tournament page, under its host (community or club). Mirrors the backend helper. */
export function tournamentHref(
  tournament: Pick<BackendTournament, "id" | "communityId" | "hostClubId">,
  query = "",
): string {
  return tournament.hostClubId
    ? `/dashboard/efootball/clubs/${tournament.hostClubId}/tournaments/${tournament.id}${query}`
    : `/dashboard/efootball/community/${tournament.communityId}/tournaments/${tournament.id}${query}`;
}

/** The host's Tournaments tab (community or club). */
export function hostTournamentsHref(tournament: Pick<BackendTournament, "communityId" | "hostClubId">): string {
  return tournament.hostClubId
    ? `/dashboard/efootball/clubs/${tournament.hostClubId}?tab=tournaments`
    : `/dashboard/efootball/community/${tournament.communityId}?tab=tournaments`;
}

export interface SubmitLineupPayload {
  teamId?: string;
  teamName?: string;
  starters: TournamentLineupPlayer[];
  substitutes: TournamentLineupPlayer[];
}

/** CvC clubs register together with their team; PvP players send nothing. */
export interface JoinTournamentPayload {
  clubId?: string;
  lineup?: SubmitLineupPayload;
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

/** Editable details; format and roster size are fixed at creation. */
export interface UpdateTournamentPayload {
  name?: string;
  maxParticipants?: number;
  entryFeeBdt?: number;
  prizePoolBdt?: number;
  startAt?: string;
  endAt?: string | null;
  playHoursStart?: number;
  playHoursEnd?: number;
  matchOfficialIds?: string[];
}

export async function updateTournament(
  id: string,
  payload: UpdateTournamentPayload,
): Promise<BackendTournament> {
  const res = await api.patch<BackendTournament>(`/tournaments/${id}`, payload);
  return res.data;
}

export async function deleteTournament(id: string): Promise<{ id: string }> {
  const res = await api.delete<{ id: string }>(`/tournaments/${id}`);
  return res.data;
}

export async function joinTournament(
  id: string,
  payload?: JoinTournamentPayload,
): Promise<TournamentParticipant> {
  const res = await api.post<TournamentParticipant>(`/tournaments/${id}/join`, payload || {});
  return res.data;
}

/** A club member already taking part in another active tournament. */
export interface PlayerCommitment {
  profileId: string;
  tournamentId: string;
  tournamentName: string;
}

/** Members of `clubId` who can't be picked because they play in another active tournament. */
export async function getClubCommitments(tournamentId: string, clubId: string): Promise<PlayerCommitment[]> {
  const res = await api.get<PlayerCommitment[]>(`/tournaments/${tournamentId}/club-commitments`, {
    params: { clubId },
  });
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

export type TournamentFormat = "knockout" | "groups_knockout";

export interface FixtureEntrant {
  participantId: string;
  name: string;
  dpUrl: string | null;
  color: string | null;
  initials: string | null;
}

export interface FixtureGamePlayer {
  profileId: string | null;
  userId: string | null;
  name: string;
  dpUrl: string | null;
}

export type FixtureGameStatus =
  | "pending"
  | "awaiting_opponent"
  | "submitted"
  | "approved"
  | "rejected"
  | "walkover"
  | "forfeited";
export type FixtureGameResolution = "reviewed" | "official" | "walkover" | "double_forfeit";

export interface PendingTimeRequest {
  id: string;
  requestedByUserId: string;
  proposedStart: string;
}
export type FixtureStatus = "scheduled" | "in_review" | "completed" | "bye";

export interface FixtureGame {
  id: string;
  slot: number;
  isDecider: boolean;
  playerA: FixtureGamePlayer;
  playerB: FixtureGamePlayer;
  goalsA: number | null;
  goalsB: number | null;
  status: FixtureGameStatus;
  /** Sides that have uploaded evidence for this game. */
  submittedSides: Array<"A" | "B">;
  /** Official's note when a submission was rejected. */
  reviewNote: string | null;
  resolution: FixtureGameResolution | null;
  /** 3-hour playing range; evidence upload closes at `evidenceDeadline`. */
  scheduledStart: string | null;
  scheduledEnd: string | null;
  systemScheduledStart: string | null;
  evidenceDeadline: string | null;
  pendingTimeRequest: PendingTimeRequest | null;
}

export interface Fixture {
  id: string;
  stage: "group" | "knockout";
  groupLabel: string | null;
  round: number;
  roundName: string;
  matchNumber: number;
  status: FixtureStatus;
  participantA: FixtureEntrant | null;
  participantB: FixtureEntrant | null;
  scoreA: number | null;
  scoreB: number | null;
  goalsA: number | null;
  goalsB: number | null;
  winnerParticipantId: string | null;
  /** Neither side uploaded evidence: both lose. */
  doubleForfeit: boolean;
  games: FixtureGame[];
}

export interface StandingRow {
  entrantId: string;
  rank: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  scoreFor: number;
  scoreAgainst: number;
  scoreDiff: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  entrant: FixtureEntrant | null;
  qualifies: boolean;
}

export interface TournamentStructure {
  tournamentId: string;
  format: TournamentFormat | null;
  isCvC: boolean;
  groups: Array<{ label: string; standings: StandingRow[]; matches: Fixture[] }>;
  knockout: {
    pending: boolean;
    size: number;
    rounds: Array<{ round: number; name: string; matches: Fixture[] }>;
  };
}

export async function getTournamentStructure(tournamentId: string): Promise<TournamentStructure> {
  const res = await api.get<TournamentStructure>(`/tournaments/${tournamentId}/structure`);
  return res.data;
}

export interface GameSubmission {
  id: string;
  side: "A" | "B";
  goalsA: number;
  goalsB: number;
  screenshotUrls: string[];
  videoUrl: string | null;
  submittedAt: string;
}

export interface GameResultInput {
  goalsA: number;
  goalsB: number;
  /** Omit on a resubmission to keep the earlier evidence. */
  screenshots: File[];
  video: File | null;
}

/** Uploads one side's score + evidence (screenshots, video) for a game. */
export async function submitGameResult(
  tournamentId: string,
  gameId: string,
  input: GameResultInput,
  onProgress?: (percent: number) => void,
): Promise<GameSubmission> {
  const form = new FormData();
  form.append("goalsA", String(input.goalsA));
  form.append("goalsB", String(input.goalsB));
  input.screenshots.forEach((file) => form.append("screenshots", file));
  if (input.video) form.append("video", input.video);

  const res = await api.post<GameSubmission>(`/tournaments/${tournamentId}/games/${gameId}/submission`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 0,
    onUploadProgress: (event) => {
      if (event.total) onProgress?.(Math.round((event.loaded * 100) / event.total));
    },
  });
  return res.data;
}

export interface ReviewGame {
  gameId: string;
  matchId: string;
  stage: "group" | "knockout";
  groupLabel: string | null;
  roundName: string;
  slot: number;
  isDecider: boolean;
  status: FixtureGameStatus;
  entrantA: string;
  entrantB: string;
  playerA: { userId: string | null; name: string; dpUrl: string | null };
  playerB: { userId: string | null; name: string; dpUrl: string | null };
  goalsA: number | null;
  goalsB: number | null;
  reviewNote: string | null;
  submissions: GameSubmission[];
}

export interface ReviewDecision {
  action: "approve" | "reject";
  goalsA?: number;
  goalsB?: number;
  note?: string;
  /** Knockout fixture that ends level: winner of the decider. */
  deciderWinner?: "A" | "B";
}

export interface ReviewResult {
  game: ReviewGame;
  /** needs_decider: the knockout fixture is level — approve again with a decider winner. */
  fixture: "pending" | "needs_decider" | "completed";
}

/** A player proposes a new start time (same date) for their game. */
export async function requestTimeChange(tournamentId: string, gameId: string, proposedStart: string) {
  const res = await api.post(`/tournaments/${tournamentId}/games/${gameId}/time-request`, { proposedStart });
  return res.data;
}

/** The opponent accepts or declines a proposed time. */
export async function respondTimeChange(tournamentId: string, requestId: string, accept: boolean) {
  const res = await api.post(`/tournaments/${tournamentId}/time-requests/${requestId}/respond`, { accept });
  return res.data;
}

/** Officials only: games with evidence waiting for review. */
export async function getReviewQueue(tournamentId: string): Promise<ReviewGame[]> {
  const res = await api.get<ReviewGame[]>(`/tournaments/${tournamentId}/review-queue`);
  return res.data;
}

export async function getGameForReview(tournamentId: string, gameId: string): Promise<ReviewGame> {
  const res = await api.get<ReviewGame>(`/tournaments/${tournamentId}/games/${gameId}/review`);
  return res.data;
}

export async function reviewGame(tournamentId: string, gameId: string, decision: ReviewDecision): Promise<ReviewResult> {
  const res = await api.post<ReviewResult>(`/tournaments/${tournamentId}/games/${gameId}/review`, decision);
  return res.data;
}

/** Creates the fixtures: knockout for up to 8 entrants, otherwise groups + knockout. */
export async function generateTournamentBracket(
  tournamentId: string,
): Promise<TournamentStructure> {
  const res = await api.post<TournamentStructure>(
    `/tournaments/${tournamentId}/generate-bracket`,
    {},
  );
  return res.data;
}

/** From the player's side: what's left to do with a game. */
export type MyGameState = "to_play" | "waiting" | "review" | "finished";
export type MyGameHostKind = "club" | "community";

/** One of the signed-in player's games (a PvP game, or their pairing in a CvC fixture). */
export interface MyGame {
  id: string;
  matchId: string;
  state: MyGameState;
  status: string;
  resolution: string | null;
  outcome: "won" | "lost" | "draw" | null;
  myGoals: number | null;
  opponentGoals: number | null;
  mySubmitted: boolean;
  reviewNote: string | null;
  stage: "group" | "knockout";
  roundName: string;
  groupLabel: string | null;
  isDecider: boolean;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  evidenceDeadline: string | null;
  me: { name: string; dpUrl: string | null };
  opponent: { userId: string | null; name: string; dpUrl: string | null };
  myClubName: string | null;
  opponentClubName: string | null;
  tournament: { id: string; name: string; type: "pvp" | "cvc"; status: string; link: string };
  host: { kind: MyGameHostKind; id: string; name: string; dpUrl: string | null };
}

export interface MyGamesParams {
  host?: MyGameHostKind;
  hostId?: string;
  state?: MyGameState;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MyGamesResponse {
  data: MyGame[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  facets: {
    states: Record<MyGameState, number>;
    hostKinds: Record<MyGameHostKind, number>;
    hosts: Array<{ kind: MyGameHostKind; id: string; name: string; count: number }>;
  };
}

/** The signed-in player's games across every tournament, with counts for the filters. */
export async function getMyGames(params: MyGamesParams): Promise<MyGamesResponse> {
  const res = await api.get<MyGamesResponse>("/tournaments/my-games", { params });
  return res.data;
}
