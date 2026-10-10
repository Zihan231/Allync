import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelTransferOffer,
  counterTransferOffer,
  createTransferOffer,
  getOfferBids,
  getClubTransfers,
  getContractDocument,
  getFreeAgents,
  getMyTransfers,
  getPlayerTransferStatus,
  getTransferHistory,
  getWalletHistory,
  type WalletTxKind,
  respondTransferOffer,
  topUpWallet,
  type CreateOfferInput,
  type PaymentMethod,
} from "@/lib/api/transfers";

export const transferKeys = {
  all: ["transfers"] as const,
  me: () => ["transfers", "me"] as const,
  club: (clubId: string) => ["transfers", "club", clubId] as const,
  player: (userId: string) => ["transfers", "player", userId] as const,
  freeAgents: (params: object) => ["transfers", "free-agents", params] as const,
  history: (params: object) => ["transfers", "history", params] as const,
  contract: (offerId: string) => ["transfers", "contract", offerId] as const,
  bids: (offerId: string) => ["transfers", "bids", offerId] as const,
  wallet: (params: object) => ["transfers", "wallet", params] as const,
};

export function useMyTransfers(enabled = true) {
  return useQuery({ queryKey: transferKeys.me(), queryFn: getMyTransfers, enabled });
}

export function useClubTransfers(clubId: string | undefined) {
  return useQuery({ queryKey: transferKeys.club(clubId ?? ""), queryFn: () => getClubTransfers(clubId!), enabled: Boolean(clubId) });
}

export function usePlayerTransferStatus(userId: string | undefined) {
  return useQuery({
    queryKey: transferKeys.player(userId ?? ""),
    queryFn: () => getPlayerTransferStatus(userId!),
    enabled: Boolean(userId),
  });
}

export function useFreeAgents(params: { search?: string; page?: number; limit?: number }, enabled = true) {
  return useQuery({
    queryKey: transferKeys.freeAgents(params),
    queryFn: () => getFreeAgents(params),
    placeholderData: (previous) => previous,
    enabled,
  });
}

export function useTransferHistory(params: { clubId?: string; userId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: transferKeys.history(params),
    queryFn: () => getTransferHistory(params),
    placeholderData: (previous) => previous,
    enabled: Boolean(params.clubId || params.userId),
  });
}

export function useContractDocument(offerId: string | null) {
  return useQuery({
    queryKey: transferKeys.contract(offerId ?? ""),
    queryFn: () => getContractDocument(offerId!),
    enabled: Boolean(offerId),
  });
}

/** A deal's negotiation: the opening amount and every counter-offer, oldest first. */
export function useOfferBids(offerId: string | null) {
  return useQuery({ queryKey: transferKeys.bids(offerId ?? ""), queryFn: () => getOfferBids(offerId!), enabled: Boolean(offerId) });
}

/** Any transfer action can change offers, contracts, wallets, squads and stats: refresh them all. */
function useRefreshAfter() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: transferKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["clubs"] });
    void queryClient.invalidateQueries({ queryKey: ["stats"] });
    void queryClient.invalidateQueries({ queryKey: ["me"] });
  };
}

export function useCreateTransferOffer() {
  const refresh = useRefreshAfter();
  return useMutation({ mutationFn: (input: CreateOfferInput) => createTransferOffer(input), onSuccess: refresh });
}

export function useRespondTransferOffer() {
  const refresh = useRefreshAfter();
  return useMutation({
    mutationFn: ({ offerId, accept, paymentMethod }: { offerId: string; accept: boolean; paymentMethod?: PaymentMethod }) =>
      respondTransferOffer(offerId, { accept, paymentMethod }),
    onSuccess: refresh,
  });
}

export function useCounterTransferOffer() {
  const refresh = useRefreshAfter();
  return useMutation({
    mutationFn: ({ offerId, ...input }: { offerId: string; amountTk: number; message?: string; paymentMethod?: PaymentMethod }) =>
      counterTransferOffer(offerId, input),
    onSuccess: refresh,
  });
}

export function useCancelTransferOffer() {
  const refresh = useRefreshAfter();
  return useMutation({ mutationFn: (offerId: string) => cancelTransferOffer(offerId), onSuccess: refresh });
}

export function useTopUpWallet() {
  const refresh = useRefreshAfter();
  return useMutation({ mutationFn: (clubId?: string) => topUpWallet(clubId), onSuccess: refresh });
}

/** Wallet page: balance, totals and paginated history (mine, or a club's I lead). */
export function useWalletHistory(
  params: { clubId?: string; kind?: WalletTxKind; page?: number; limit?: number },
  enabled = true,
) {
  return useQuery({
    queryKey: transferKeys.wallet(params),
    queryFn: () => getWalletHistory(params),
    placeholderData: (previous) => previous,
    enabled,
  });
}
