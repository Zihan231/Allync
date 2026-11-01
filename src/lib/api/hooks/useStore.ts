import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  equipStoreItem,
  getClubStore,
  getMyStore,
  getStoreCatalog,
  purchaseBanner,
  purchaseClubTheme,
  purchaseStoreItem,
  setClubTheme,
  setTournamentBanner,
  type ClubStore,
  type MyStore,
  type StoreCategory,
} from "@/lib/api/store";

export const storeKeys = {
  catalog: ["store", "catalog"] as const,
  me: ["store", "me"] as const,
  club: (clubId: string) => ["store", "club", clubId] as const,
};

export function useStoreCatalog() {
  return useQuery({ queryKey: storeKeys.catalog, queryFn: getStoreCatalog, staleTime: 5 * 60 * 1000 });
}

export function useMyStore(enabled = true) {
  return useQuery({ queryKey: storeKeys.me, queryFn: getMyStore, enabled });
}

/** After a purchase or a switch: the store state comes back from the server; wallet and profile refresh. */
function useApply() {
  const queryClient = useQueryClient();
  return (state: MyStore) => {
    queryClient.setQueryData(storeKeys.me, state);
    void queryClient.invalidateQueries({ queryKey: ["transfers"] });
    void queryClient.invalidateQueries({ queryKey: ["me"] });
  };
}

export function usePurchaseStoreItem() {
  const apply = useApply();
  return useMutation({
    mutationFn: ({ sku, equip = true }: { sku: string; equip?: boolean }) => purchaseStoreItem(sku, equip),
    onSuccess: apply,
  });
}

export function useEquipStoreItem() {
  const apply = useApply();
  return useMutation({
    mutationFn: ({ category, sku }: { category: StoreCategory; sku: string | null }) => equipStoreItem(category, sku),
    onSuccess: apply,
  });
}

/** A design's artwork by SKU (from the catalogue), e.g. a club theme or tournament banner. */
export function useDesignAssets(sku: string | null | undefined) {
  const { data } = useStoreCatalog();
  return sku ? (data?.find((i) => i.sku === sku) ?? null) : null;
}

export function useClubStore(clubId: string | undefined, enabled = true) {
  return useQuery({ queryKey: storeKeys.club(clubId ?? ""), queryFn: () => getClubStore(clubId!), enabled: Boolean(clubId) && enabled });
}

/** After buying or switching a club theme: the club page and club wallet refresh too. */
function useApplyClub() {
  const queryClient = useQueryClient();
  return (state: ClubStore) => {
    queryClient.setQueryData(storeKeys.club(state.clubId), state);
    void queryClient.invalidateQueries({ queryKey: ["clubs"] });
    void queryClient.invalidateQueries({ queryKey: ["transfers"] });
  };
}

export function usePurchaseClubTheme() {
  const apply = useApplyClub();
  return useMutation({
    mutationFn: ({ clubId, sku }: { clubId: string; sku: string }) => purchaseClubTheme(clubId, sku),
    onSuccess: apply,
  });
}

export function useSetClubTheme() {
  const apply = useApplyClub();
  return useMutation({
    mutationFn: ({ clubId, sku }: { clubId: string; sku: string | null }) => setClubTheme(clubId, sku),
    onSuccess: apply,
  });
}

/** Banners: my store state changes; the tournament refreshes when one goes on it. */
export function usePurchaseBanner() {
  const apply = useApply();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sku, tournamentId }: { sku: string; tournamentId?: string }) => purchaseBanner(sku, tournamentId),
    onSuccess: (state) => {
      apply(state);
      void queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

export function useSetTournamentBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tournamentId, sku }: { tournamentId: string; sku: string | null }) => setTournamentBanner(tournamentId, sku),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["tournaments"] }),
  });
}
