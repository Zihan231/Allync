import type { ClubRole, CommunityRole, GameId } from "@/lib/session/SessionContext";

export type JoinPolicy = "instant" | "approval";

export type WorkExperienceEntry = { workplace: string; jobTitle: string };
export type EducationEntry = {
  instituteName: string;
  fieldOfStudy: string;
  instituteType: "University" | "College" | "School" | "Other";
};
export type LatLng = { lat: number; lng: number };
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type DocumentType =
  | "national_id"
  | "passport"
  | "birth_certificate"
  | "driver_license"
  | "university_docs"
  | "college_docs";
export type VerificationLevel = 0 | 1 | 2 | 3;

export type Person = {
  id: string;
  name: string;
  dpUrl: string | null;
  coverUrl: string | null;
  clubId: string | null;
  clubRole: ClubRole | null;
  communityId: string | null;
  communityRole: CommunityRole | null;
  points: number;
  bio?: string;
  facebookUrl?: string;
  inGameId?: string;
  facebookProfileName?: string;
  instagramUrl?: string;
  konamiUid?: string;
  deviceName?: string;
  deviceModel?: string;
  phoneNumber?: string;
  birthday?: string;
  bloodGroup?: BloodGroup;
  country?: string;
  division?: string;
  district?: string;
  permanentAddress?: string;
  currentLocation?: LatLng | null;
  workExperience?: WorkExperienceEntry[];
  education?: EducationEntry[];
  documentType?: DocumentType;
  documentDataUrl?: string;
  verificationLevel?: VerificationLevel;
  ownedCosmeticIds?: string[];
  equippedBadgeId?: string | null;
  equippedTitleId?: string | null;
  equippedFrameId?: string | null;
  equippedThemeId?: string | null;
  gamePosition?: string;
  squadTeam?: "Main" | "Academy" | "Legend";
  shirtNumber?: number;
  discordUrl?: string;
};

export type JoinRequest = {
  id: string;
  targetType: "club" | "community";
  targetId: string;
  personId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type ClubStage =
  | "Apex"
  | "College"
  | "District"
  | "Division"
  | "Elite"
  | "Foundation"
  | "Intra Bid S1"
  | "Matchday Management Panel"
  | "N/A"
  | "Official Team"
  | "Reality Bid S1"
  | "Reality Bid S2"
  | "Special"
  | "University";

export const CLUB_STAGES: ClubStage[] = [
  "Apex",
  "College",
  "District",
  "Division",
  "Elite",
  "Foundation",
  "Intra Bid S1",
  "Matchday Management Panel",
  "N/A",
  "Official Team",
  "Reality Bid S1",
  "Reality Bid S2",
  "Special",
  "University",
];

export type Club = {
  id: string;
  name: string;
  color: string;
  initials: string;
  dpUrl: string | null;
  coverUrl: string | null;
  description: string;
  points: number;
  joinPolicy: JoinPolicy;
  minRoster: number;
  maxRoster: number;
  communityIds: string[];
  stage: ClubStage;
  location?: string;
  motto?: string;
  facebookUrl?: string;
};

export type Community = {
  id: string;
  name: string;
  dpUrl: string | null;
  coverUrl: string | null;
  rules: string;
  points: number;
  joinPolicy: JoinPolicy;
  memberClubIds: string[];
  freeAgentCount: number;
  tournamentIds: string[];
};

export type TournamentFormat = "default" | "custom" | "clubVsClub" | "open";
export type TournamentStatus = "open" | "live" | "completed";

export type Tournament = {
  id: string;
  name: string;
  game: GameId;
  format: TournamentFormat;
  status: TournamentStatus;
  entrants: number;
  entryFeeBdt: number | null;
  prizePoolBdt: number | null;
  communityId: string | null;
  organizerName: string;
  startAt: string;
  endAt: string;
  aggregateTable?: { clubName: string; played: number; won: number; drawn: number; lost: number; points: number }[];
  bracket?: { round: string; matchups: { a: string; b: string; score?: string }[] }[];
};

export type MatchStatus =
  | "unplayed"
  | "pending_submission"
  | "awaiting_opponent"
  | "verified"
  | "disputed";

export type Match = {
  id: string;
  tournamentId: string;
  tournamentName: string;
  game: GameId;
  round: string;
  opponent: string;
  scheduledAt: string;
  status: MatchStatus;
  myScore?: number;
  opponentScore?: number;
  evidenceA?: string;
  evidenceB?: string;
};

export type WalletTransaction = {
  id: string;
  label: string;
  amountBdt: number;
  type: "entry_fee" | "prize_payout" | "commission" | "topup";
  date: string;
};

export type TransferOffer = {
  id: string;
  playerName: string;
  fromClub: string;
  toClub: string;
  feeBdt: number;
  status: "pending" | "accepted" | "declined";
  direction: "incoming" | "outgoing";
};
