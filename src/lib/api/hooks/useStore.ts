import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { equipStoreItem, getMyStore, getStoreCatalog, purchaseStoreItem, type MyStore, type StoreCategory } from "@/lib/api/store";

export const storeKeys = {
  catalog: ["store", "catalog"] as const,
  me: ["store", "me"] as const,
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
