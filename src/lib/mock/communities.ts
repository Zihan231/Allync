import type { Community } from "./types";

export const mockCommunities: Community[] = [
  {
    id: "dhaka-elite",
    name: "Dhaka Elite Community",
    dpUrl: null,
    coverUrl: "/community 1.jpg",
    rules: "1. Show up on time or forfeit. 2. Screenshot or clip evidence is mandatory on every result. 3. No smurfing — one account per player. 4. Respect the Head of Discipline's ruling; repeated disputes filed in bad faith get you removed.",
    points: 2400,
    joinPolicy: "approval",
    memberClubIds: ["red-falcons", "blue-tigers", "chittagong-kings", "uttara-gunners", "gulshan-barons", "mirpur-titans"],
    freeAgentCount: 12,
    tournamentIds: ["quarter-final-clash", "weekend-cup"],
  },
  {
    id: "sylhet-strikers",
    name: "Sylhet Strikers Community",
    dpUrl: null,
    coverUrl: "/community 2.jpg",
    rules: "1. Friendly first, competitive second. 2. Entry fees are optional in most tournaments. 3. New players welcome — no minimum rank required.",
    points: 900,
    joinPolicy: "instant",
    memberClubIds: ["sylhet-strikers-fc", "sylhet-comets"],
    freeAgentCount: 4,
    tournamentIds: [],
  },
];
