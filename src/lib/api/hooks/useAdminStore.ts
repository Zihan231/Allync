import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStoreItem,
  getAdminStoreItems,
  grantStoreItem,
  revokeStoreItem,
  updateStoreItem,
  type StoreItemInput,
} from "@/lib/api/adminPlatform";

const KEY = ["admin", "store", "items"] as const;

export function useAdminStoreItems(enabled = true) {
  return useQuery({ queryKey: KEY, queryFn: getAdminStoreItems, enabled });
}

/** Catalogue edits also change what players see in the store. */
function useRefresh() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: KEY });
    void queryClient.invalidateQueries({ queryKey: ["store"] });
  };
}

export function useSaveStoreItem() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: StoreItemInput }) => (id ? updateStoreItem(id, input) : createStoreItem(input)),
    onSuccess: refresh,
  });
}

export function useGrantStoreItem(userId: string) {
  const refresh = useRefresh();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, remove, reason }: { itemId: string; remove: boolean; reason?: string }) =>
      remove ? revokeStoreItem(userId, itemId, reason) : grantStoreItem(userId, itemId, reason),
    onSuccess: () => {
      refresh();
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}
