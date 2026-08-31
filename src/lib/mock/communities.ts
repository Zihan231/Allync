import type { Community } from "./types";

export const mockCommunities: Community[] = [
  {
    id: "dhaka-elite",
    name: "Dhaka Elite Community",
    staff: [
      { name: "Sabbir Rahman", role: "President" },
      { name: "Farzana Yasmin", role: "Vice President" },
      { name: "Nusrat Jahan", role: "Team Manager" },
      { name: "Kamrul Hasan", role: "Head of Discipline" },
      { name: "Mim Akter", role: "Scout" },
    ],
    memberClubIds: ["red-falcons", "blue-tigers", "chittagong-kings"],
    freeAgentCount: 12,
    tournamentIds: ["quarter-final-clash", "weekend-cup"],
  },
];
