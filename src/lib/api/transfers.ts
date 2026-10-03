import { api } from "./axios";

export type OfferKind = "player_proposal" | "club_offer" | "renewal" | "buyout";
export type OfferStatus = "pending" | "scheduled" | "completed" | "declined" | "cancelled" | "expired";
export type PaymentMethod = "bkash" | "nagad" | "card";
export const PAYMENT_METHODS: PaymentMethod[] = ["bkash", "nagad", "card"];

export interface ContractView {
  id: string;
  contractNo: string;
  userId: string;
  clubId: string;
  clubName: string;
  frozenTk: number;
  baseTk: number;
  lockDays: number;
  startAt: string;
  lockEndsAt: string;
  status: "active" | "ended";
  endedAt: string | null;
  endReason: "transfer" | "renewal" | "left" | "club_deleted" | null;
  offerId: string | null;
  /** Live: frozen part + what's left of the fixed part. */
  feeTk: number;
  decayingTk: number;
  daysLeft: number;
  locked: boolean;
}

export interface ClubCommitment {
  tournamentId: string;
  tournamentName: string;
  startAt: string;
  endAt: string | null;
}

export interface ClubRef {
  id: string;
  name: string;
  dpUrl: string | null;
  color: string | null;
}

export interface TransferOffer {
  id: string;
  kind: OfferKind;
  status: OfferStatus;
  amountTk: number;
  payeeType: "player" | "club";
  message: string | null;
  player: { id: string; name: string; dpUrl: string | null };
  fromClub: ClubRef | null;
  toClub: ClubRef;
  createdByUserId: string;
  expiresAt: string;
  createdAt: string;
  completedAt: string | null;
  playerSignedAt: string | null;
  clubSignedAt: string | null;
  clubSignedBy: string | null;
  paymentMethod: PaymentMethod | null;
  paymentRef: string | null;
  paidAt: string | null;
  scheduledTournament: ClubCommitment | null;
  contractNo: string | null;
}

export interface WalletView {
  balanceTk: number;
  heldTk: number;
  transactions: Array<{
    id: string;
    kind: "top_up" | "hold" | "refund" | "payout_sent" | "received";
    amountTk: number;
    counterparty: string | null;
    reference: string | null;
    offerId: string | null;
    createdAt: string;
  }>;
}

export interface TransferSettingsView {
  baseFeeTk: number;
  lockDays: number;
  offerExpiryDays: number;
}

export interface MyTransfers {
  settings: TransferSettingsView;
  clubId: string | null;
  clubRole: string | null;
  contract: ContractView | null;
  commitment: ClubCommitment | null;
  offers: TransferOffer[];
  wallet: WalletView;
}

export interface SquadMember {
  userId: string;
  name: string;
  dpUrl: string | null;
  clubRole: string | null;
  gamePosition: string | null;
  points: number;
  contract: ContractView | null;
}

export interface ClubTransfers {
  clubId: string;
  isLeader: boolean;
  squad: SquadMember[];
  incoming: TransferOffer[];
  outgoing: TransferOffer[];
  wallet: WalletView | null;
}

export interface FreeAgent {
  id: string;
  name: string;
  dpUrl: string | null;
  gamePosition: string | null;
  points: number;
  clubId: string | null;
  clubName: string | null;
  lockEndsAt: string | null;
}

export interface PlayerTransferStatus {
  userId: string;
  clubId: string | null;
  clubRole: string | null;
  contract: ContractView | null;
  transferable: boolean;
  scheduled: boolean;
  commitment: ClubCommitment | null;
}

export interface ContractDocument {
  offer: TransferOffer;
  contract: ContractView | null;
  terms: {
    signingAmountTk: number;
    frozenTk: number;
    baseTk: number;
    lockDays: number;
    feeAtSigningTk: number;
    startAt: string | null;
    lockEndsAt: string | null;
  };
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface CreateOfferInput {
  /** The club being proposed to, or (club offers) the club you lead. */
  clubId: string;
  /** Set for club offers; omit when a player proposes himself. */
  playerUserId?: string;
  amountTk: number;
  message?: string;
  paymentMethod?: PaymentMethod;
}

export const getMyTransfers = async () => (await api.get<MyTransfers>("/transfers/me")).data;
export const getClubTransfers = async (clubId: string) => (await api.get<ClubTransfers>(`/transfers/clubs/${clubId}`)).data;
export const getPlayerTransferStatus = async (userId: string) =>
  (await api.get<PlayerTransferStatus>(`/transfers/players/${userId}`)).data;
export const getFreeAgents = async (params: { search?: string; page?: number; limit?: number }) =>
  (await api.get<Paginated<FreeAgent>>("/transfers/free-agents", { params })).data;
export const getTransferHistory = async (params: { clubId?: string; userId?: string; page?: number; limit?: number }) =>
  (await api.get<Paginated<TransferOffer>>("/transfers/history", { params })).data;
export const getContractDocument = async (offerId: string) =>
  (await api.get<ContractDocument>(`/transfers/offers/${offerId}/contract`)).data;
export const createTransferOffer = async (input: CreateOfferInput) =>
  (await api.post<TransferOffer>("/transfers/offers", input)).data;
export const respondTransferOffer = async (offerId: string, input: { accept: boolean; paymentMethod?: PaymentMethod }) =>
  (await api.post<TransferOffer>(`/transfers/offers/${offerId}/respond`, input)).data;
export const cancelTransferOffer = async (offerId: string) =>
  (await api.post<TransferOffer>(`/transfers/offers/${offerId}/cancel`)).data;
export const topUpWallet = async (clubId?: string) =>
  (await api.post<WalletView>("/transfers/wallets/top-up", clubId ? { clubId } : {})).data;
