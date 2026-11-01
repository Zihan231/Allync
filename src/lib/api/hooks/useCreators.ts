import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDesign,
  deleteDesign,
  getAdminDesigns,
  getCreator,
  getMyCreator,
  reviewDesign,
  updateDesign,
  type DesignFiles,
  type DesignInput,
  type DesignStatus,
  type Rarity,
} from "@/lib/api/creators";
import { storeKeys } from "@/lib/api/hooks/useStore";

export const creatorKeys = {
  all: ["creators"] as const,
  me: ["creators", "me"] as const,
  creator: (userId: string) => ["creators", "public", userId] as const,
  admin: (status: string, page: number) => ["creators", "admin", status, page] as const,
};

export function useMyCreator(enabled = true) {
  return useQuery({ queryKey: creatorKeys.me, queryFn: getMyCreator, enabled });
}

export function useCreator(userId: string | undefined) {
  return useQuery({ queryKey: creatorKeys.creator(userId ?? ""), queryFn: () => getCreator(userId!), enabled: Boolean(userId) });
}

export function useAdminDesigns(status: DesignStatus, page: number) {
  return useQuery({ queryKey: creatorKeys.admin(status, page), queryFn: () => getAdminDesigns({ status, page, limit: 12 }) });
}

/** Designs and the store catalogue refresh after any change. */
function useRefresh() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: creatorKeys.all });
    void queryClient.invalidateQueries({ queryKey: storeKeys.catalog });
  };
}

export function useCreateDesign() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ input, files }: { input: DesignInput; files: DesignFiles }) => createDesign(input, files),
    onSuccess: refresh,
  });
}

export function useUpdateDesign() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, input, files }: { id: string; input: DesignInput; files?: DesignFiles }) => updateDesign(id, input, files),
    onSuccess: refresh,
  });
}

export function useDeleteDesign() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: deleteDesign, onSuccess: refresh });
}

export function useReviewDesign() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; approve: boolean; reason?: string; priceTk?: number; rarity?: Rarity }) => reviewDesign(id, input),
    onSuccess: refresh,
  });
}
