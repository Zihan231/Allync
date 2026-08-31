import type { TransferOffer } from "./types";

export const mockTransferWindow = {
  isOpen: true,
  opensAt: "2026-08-25",
  closesAt: "2026-09-15",
};

export const mockTransferOffers: TransferOffer[] = [
  {
    id: "offer-1",
    playerName: "Tanvir Ahmed",
    fromClub: "Chittagong Kings",
    toClub: "Red Falcons",
    feeBdt: 1500,
    status: "pending",
    direction: "incoming",
  },
  {
    id: "offer-2",
    playerName: "Junayed Karim",
    fromClub: "Red Falcons",
    toClub: "Blue Tigers",
    feeBdt: 800,
    status: "pending",
    direction: "outgoing",
  },
];
