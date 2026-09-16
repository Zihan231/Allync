// Shapes returned by the NestJS backend. Kept loose on nested/rarely-typed
// fields (unknown[] etc.) rather than fully modeling every DTO — the goal is
// to kill `any` at the service-call boundary, not to duplicate the backend's
// entire type system here.

export interface BackendTeam {
  id: string;
  name: string;
  clubId: string;
  captainProfileId: string | null;
}

export interface BackendClub {
  id: string;
  name: string;
  color: string;
  initials: string;
  dpUrl: string | null;
  coverUrl: string | null;
  description: string | null;
  points: number;
  joinPolicy: string;
  minRoster: number;
  maxRoster: number;
  communityIds: string[];
  stage: string;
  location: string | null;
  motto: string | null;
  facebookUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendEfootballProfile {
  id: string;
  userId: string;
  konamiUid: string | null;
  gamePosition: string | null;
  squadTeam: string | null;
  shirtNumber: number | null;
  points: number;
  clubId: string | null;
  club?: BackendClub | null;
  teamId: string | null;
  team?: BackendTeam | null;
  lineupStatus: string;
  clubRole: string | null;
  communityId: string | null;
  communityRole: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  dpUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  facebookUrl: string | null;
  facebookProfileName: string | null;
  instagramUrl: string | null;
  inGameId: string | null;
  deviceName: string | null;
  deviceModel: string | null;
  phoneNumber: string | null;
  birthday: string | null;
  bloodGroup: string | null;
  country: string | null;
  division: string | null;
  district: string | null;
  permanentAddress: string | null;
  currentLocation: { lat: number; lng: number } | null;
  workExperience: unknown[] | null;
  education: unknown[] | null;
  documentType: string | null;
  documentDataUrl: string | null;
  verificationLevel: number;
  ownedCosmeticIds: string[] | null;
  equippedBadgeId: string | null;
  equippedTitleId: string | null;
  equippedFrameId: string | null;
  equippedThemeId: string | null;
  createdAt: string;
  updatedAt: string;
  efootballProfile?: BackendEfootballProfile;
}
