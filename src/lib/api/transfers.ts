import { api } from "./axios";

export type OfferKind = "player_proposal" | "club_offer" | "renewal" | "buyout";
export type OfferStatus = "pending" | "scheduled" | "completed" | "declined" | "cancelled" | "expired" | "reversed";
export type PaymentMethod = "bkash" | "nagad" | "card";
/** The two sides of a deal: the player, and the club he would sign for. */
export type OfferParty = "player" | "club";
/**
 * Where the club's money is: held (taken from the club wallet, not yet with the payee),
 * paid (transfer completed), refunded (deal closed), reversed (staff undid it) or none.
 */
export type PaymentStatus = "none" | "held" | "paid" | "refunded" | "reversed";
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
  /** Who answers next while pending (accept, reject or counter); the other side can only withdraw. */
  turn: OfferParty;
  /** The amount on the table now (changes with every counter-offer). */
  amountTk: number;
  /** Club money held for this deal right now. */
  heldTk: number;
  paymentStatus: PaymentStatus;
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
    kind: "top_up" | "hold" | "refund" | "payout_sent" | "received" | "adjustment" | "reversal";
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
  maxLoanMatches: number;
  maxLoanDays: number;
}

export interface MyTransfers {
  settings: TransferSettingsView;
  clubId: string | null;
  clubName: string | null;
  clubRole: string | null;
  contract: ContractView | null;
  commitment: ClubCommitment | null;
  offers: TransferOffer[];
  /** His recent proposals to clubs (open and closed), newest first. */
  proposals: TransferOffer[];
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
  /** Set while he plays here on loan from another club. */
  onLoanFrom: {
    loanId: string;
    clubId: string;
    clubName: string;
    matches: number;
    matchesPlayed: number;
    endsBy: string | null;
  } | null;
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
  /** His current loan (scheduled, running or about to return), if any. */
  loan: {
    id: string;
    status: LoanStatus;
    parentClub: { id: string; name: string };
    borrowClub: { id: string; name: string };
    matches: number;
    matchesPlayed: number;
    endsBy: string | null;
  } | null;
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
/** One step of a negotiation: the opening amount, then every counter-offer. */
export interface OfferBid {
  id: string;
  party: OfferParty;
  byUserId: string;
  byName: string | null;
  amountTk: number;
  message: string | null;
  createdAt: string;
}

/** Answer with a new amount instead of accepting or rejecting (the side whose turn it is). */
export const counterTransferOffer = async (
  offerId: string,
  input: { amountTk: number; message?: string; paymentMethod?: PaymentMethod },
) => (await api.post<TransferOffer>(`/transfers/offers/${offerId}/counter`, input)).data;
export const getOfferBids = async (offerId: string) => (await api.get<OfferBid[]>(`/transfers/offers/${offerId}/bids`)).data;
// ------------------------------------------------------------------ loans

/** The two clubs of a loan: the parent club (keeps his contract) and the borrowing club (pays the fee). */
export type LoanParty = "parent" | "borrower";
export type LoanStatus = "pending" | "scheduled" | "active" | "returning" | "completed" | "declined" | "cancelled" | "expired";
export type LoanEndReason = "matches" | "time" | "bought" | "staff" | "club_deleted";

export interface Loan {
  id: string;
  status: LoanStatus;
  /** Which club answers next while pending. */
  turn: LoanParty;
  feeTk: number;
  heldTk: number;
  paymentStatus: PaymentStatus;
  matches: number;
  matchesPlayed: number;
  maxDays: number;
  message: string | null;
  player: { id: string; name: string; dpUrl: string | null };
  parentClub: ClubRef;
  borrowClub: ClubRef;
  createdByUserId: string;
  expiresAt: string;
  createdAt: string;
  startedAt: string | null;
  endsBy: string | null;
  endedAt: string | null;
  endReason: LoanEndReason | null;
  paymentMethod: PaymentMethod | null;
  paymentRef: string | null;
  paidAt: string | null;
  scheduledTournament: ClubCommitment | null;
  /** While he's on loan: what the borrowing club pays to buy him now. */
  buyPriceTk: number | null;
}

export interface LoanBid {
  id: string;
  party: LoanParty;
  byUserId: string;
  byName: string | null;
  feeTk: number;
  message: string | null;
  createdAt: string;
}

export interface ClubLoans {
  clubId: string;
  isLeader: boolean;
  /** Players the club has borrowed (or is negotiating for). */
  loansIn: Loan[];
  /** The club's players lent out (or being negotiated). */
  loansOut: Loan[];
}

export interface CreateLoanInput {
  /** The club you lead. */
  clubId: string;
  playerUserId: string;
  /** Lending your own player out: the club that would borrow him. */
  otherClubId?: string;
  feeTk: number;
  matches: number;
  maxDays: number;
  message?: string;
  paymentMethod?: PaymentMethod;
}

export const createLoan = async (input: CreateLoanInput) => (await api.post<Loan>("/transfers/loans", input)).data;
export const getMyLoans = async () => (await api.get<Loan[]>("/transfers/loans/me")).data;
export const getClubLoans = async (clubId: string) => (await api.get<ClubLoans>(`/transfers/loans/clubs/${clubId}`)).data;
export const getLoan = async (loanId: string) => (await api.get<Loan & { bids: LoanBid[] }>(`/transfers/loans/${loanId}`)).data;
export const respondLoan = async (loanId: string, input: { accept: boolean; paymentMethod?: PaymentMethod }) =>
  (await api.post<Loan>(`/transfers/loans/${loanId}/respond`, input)).data;
export const counterLoan = async (loanId: string, input: { feeTk: number; message?: string; paymentMethod?: PaymentMethod }) =>
  (await api.post<Loan>(`/transfers/loans/${loanId}/counter`, input)).data;
export const cancelLoan = async (loanId: string) => (await api.post<Loan>(`/transfers/loans/${loanId}/cancel`)).data;
export const buyLoan = async (loanId: string, input: { paymentMethod?: PaymentMethod }) =>
  (await api.post<Loan>(`/transfers/loans/${loanId}/buy`, input)).data;

export const cancelTransferOffer = async (offerId: string) =>
  (await api.post<TransferOffer>(`/transfers/offers/${offerId}/cancel`)).data;
export const topUpWallet = async (clubId?: string) =>
  (await api.post<WalletView>("/transfers/wallets/top-up", clubId ? { clubId } : {})).data;

export type WalletTxKind = WalletView["transactions"][number]["kind"];

export interface WalletHistory {
  balanceTk: number;
  heldTk: number;
  /** All-time totals by type. */
  totals: { receivedTk: number; paidTk: number; refundedTk: number; topUpTk: number };
  data: WalletView["transactions"];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

/** My wallet's (or a club wallet I lead) balance, totals and paginated history. */
export const getWalletHistory = async (params: { clubId?: string; kind?: WalletTxKind; page?: number; limit?: number }) =>
  (await api.get<WalletHistory>("/transfers/wallets/transactions", { params })).data;
