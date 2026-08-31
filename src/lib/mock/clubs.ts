import type { Club } from "./types";

export const mockClubs: Club[] = [
  {
    id: "red-falcons",
    name: "Red Falcons",
    color: "#ff5470",
    initials: "RF",
    staff: [
      { name: "Rakib Hasan", role: "Captain" },
      { name: "Imran Kabir", role: "President" },
      { name: "Nusrat Jahan", role: "Manager" },
    ],
    roster: [
      { name: "Rakib Hasan", position: "Captain" },
      { name: "Shakib Al", position: "Forward" },
      { name: "Mehedi Rahman", position: "Midfielder" },
      { name: "Tanvir Ahmed", position: "Defender" },
      { name: "Fahim Chowdhury", position: "Goalkeeper" },
    ],
    minRoster: 4,
    maxRoster: 8,
    communityIds: ["dhaka-elite"],
  },
  {
    id: "blue-tigers",
    name: "Blue Tigers",
    color: "#4c8dff",
    initials: "BT",
    staff: [
      { name: "Arafat Islam", role: "President" },
      { name: "Sadia Afrin", role: "Manager" },
      { name: "Mahin Chowdhury", role: "Captain" },
    ],
    roster: [
      { name: "Mahin Chowdhury", position: "Captain" },
      { name: "Rafi Anam", position: "Forward" },
      { name: "Junayed Karim", position: "Midfielder" },
    ],
    minRoster: 4,
    maxRoster: 8,
    communityIds: ["dhaka-elite"],
  },
  {
    id: "chittagong-kings",
    name: "Chittagong Kings",
    color: "#e0a83c",
    initials: "CK",
    staff: [{ name: "Habib Noor", role: "President" }],
    roster: [
      { name: "Habib Noor", position: "Captain" },
      { name: "Riyad Uddin", position: "Forward" },
    ],
    minRoster: 4,
    maxRoster: 8,
    communityIds: ["dhaka-elite"],
  },
];
