import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelSponsorship,
  closeSponsorCall,
  counterSponsorship,
  createSponsorPost,
  createSponsorship,
  deleteSponsorPost,
  endSponsorship,
  getAdminSponsors,
  getMySponsor,
  getSponsor,
  getSponsorCalls,
  getSponsors,
  getTargetSponsors,
  openSponsorCall,
  respondSponsorship,
  saveSponsorProfile,
  verifySponsor,
  type SponsorTargetType,
  type SponsorTier,
} from "@/lib/api/sponsors";

export const sponsorKeys = {
  all: ["sponsors"] as const,
  me: ["sponsors", "me"] as const,
  list: (params: object) => ["sponsors", "list", params] as const,
  sponsor: (userId: string) => ["sponsors", "public", userId] as const,
  target: (type: string, id: string) => ["sponsors", "target", type, id] as const,
  calls: ["sponsors", "calls"] as const,
  admin: (params: object) => ["sponsors", "admin", params] as const,
};

export function useMySponsor(enabled = true) {
  return useQuery({ queryKey: sponsorKeys.me, queryFn: getMySponsor, enabled });
}

export function useSponsors(params: { search?: string; verified?: boolean; page?: number; limit?: number }) {
  return useQuery({ queryKey: sponsorKeys.list(params), queryFn: () => getSponsors(params) });
}

export function useSponsor(userId: string | undefined) {
  return useQuery({ queryKey: sponsorKeys.sponsor(userId ?? ""), queryFn: () => getSponsor(userId!), enabled: Boolean(userId) });
}

export function useTargetSponsors(type: SponsorTargetType, id: string | undefined) {
  return useQuery({ queryKey: sponsorKeys.target(type, id ?? ""), queryFn: () => getTargetSponsors(type, id!), enabled: Boolean(id) });
}

export function useSponsorCalls() {
  return useQuery({ queryKey: sponsorKeys.calls, queryFn: getSponsorCalls });
}

export function useAdminSponsors(params: { search?: string; page?: number }) {
  return useQuery({ queryKey: sponsorKeys.admin(params), queryFn: () => getAdminSponsors(params) });
}

/** Anything sponsor-related (and wallets, which deals move money in) refreshes after a change. */
function useRefresh() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: sponsorKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["transfers"] });
    void queryClient.invalidateQueries({ queryKey: ["feed"] });
  };
}

export function useSaveSponsorProfile() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: saveSponsorProfile, onSuccess: refresh });
}

export function useCreateSponsorPost() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: createSponsorPost, onSuccess: refresh });
}

export function useDeleteSponsorPost() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: deleteSponsorPost, onSuccess: refresh });
}

export function useCreateSponsorship() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: createSponsorship, onSuccess: refresh });
}

export function useRespondSponsorship() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: ({ id, accept }: { id: string; accept: boolean }) => respondSponsorship(id, accept), onSuccess: refresh });
}

export function useCounterSponsorship() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; amountTk: number; tier?: SponsorTier; days?: number; message?: string }) => counterSponsorship(id, input),
    onSuccess: refresh,
  });
}

export function useCancelSponsorship() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: cancelSponsorship, onSuccess: refresh });
}

export function useEndSponsorship() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: endSponsorship, onSuccess: refresh });
}

export function useOpenSponsorCall() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: openSponsorCall, onSuccess: refresh });
}

export function useCloseSponsorCall() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: closeSponsorCall, onSuccess: refresh });
}

export function useVerifySponsor() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: ({ userId, verified }: { userId: string; verified: boolean }) => verifySponsor(userId, verified), onSuccess: refresh });
}
