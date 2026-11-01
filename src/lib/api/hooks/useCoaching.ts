import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelCoachingDeal,
  counterCoachingDeal,
  createCoachingDeal,
  createCoachPost,
  deleteCoachPost,
  endCoachingDeal,
  getAdminCoachPosts,
  getClubCoaching,
  getCoach,
  getCoaches,
  getMyCoaching,
  respondCoachingDeal,
  reviewCoachPost,
  setMyRoles,
  updateCoachProfile,
  type CoachPostStatus,
  type UserRole,
} from "@/lib/api/coaching";
import type { PaymentMethod } from "@/lib/api/transfers";
import { meKey } from "@/lib/api/hooks/useUsers";

export const coachingKeys = {
  all: ["coaching"] as const,
  me: ["coaching", "me"] as const,
  coaches: (params: object) => ["coaching", "coaches", params] as const,
  coach: (userId: string) => ["coaching", "coach", userId] as const,
  club: (clubId: string) => ["coaching", "club", clubId] as const,
  adminPosts: (status: string, page: number) => ["coaching", "admin", "posts", status, page] as const,
};

export function useMyCoaching(enabled = true) {
  return useQuery({ queryKey: coachingKeys.me, queryFn: getMyCoaching, enabled });
}

export function useCoaches(params: { search?: string; available?: boolean; page?: number; limit?: number }) {
  return useQuery({ queryKey: coachingKeys.coaches(params), queryFn: () => getCoaches(params) });
}

export function useCoach(userId: string | undefined) {
  return useQuery({ queryKey: coachingKeys.coach(userId ?? ""), queryFn: () => getCoach(userId!), enabled: Boolean(userId) });
}

export function useClubCoaching(clubId: string | undefined) {
  return useQuery({ queryKey: coachingKeys.club(clubId ?? ""), queryFn: () => getClubCoaching(clubId!), enabled: Boolean(clubId) });
}

export function useAdminCoachPosts(status: CoachPostStatus, page: number) {
  return useQuery({ queryKey: coachingKeys.adminPosts(status, page), queryFn: () => getAdminCoachPosts({ status, page, limit: 10 }) });
}

/** Anything coaching (and wallets, which deals move money in) refreshes after a change. */
function useRefresh() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: coachingKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["transfers"] });
  };
}

export function useSetMyRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roles, primaryRole }: { roles: UserRole[]; primaryRole: UserRole }) => setMyRoles(roles, primaryRole),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: meKey }),
  });
}

export function useUpdateCoachProfile() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: updateCoachProfile, onSuccess: refresh });
}

export function useCreateCoachPost() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: createCoachPost, onSuccess: refresh });
}

export function useDeleteCoachPost() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: deleteCoachPost, onSuccess: refresh });
}

export function useCreateCoachingDeal() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: createCoachingDeal, onSuccess: refresh });
}

export function useRespondCoachingDeal() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, accept, paymentMethod }: { id: string; accept: boolean; paymentMethod?: PaymentMethod }) =>
      respondCoachingDeal(id, accept, paymentMethod),
    onSuccess: refresh,
  });
}

export function useCounterCoachingDeal() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; feeTk: number; days?: number; message?: string; paymentMethod?: PaymentMethod }) =>
      counterCoachingDeal(id, input),
    onSuccess: refresh,
  });
}

export function useCancelCoachingDeal() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: cancelCoachingDeal, onSuccess: refresh });
}

export function useEndCoachingDeal() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: endCoachingDeal, onSuccess: refresh });
}

export function useReviewCoachPost() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, approve, reason }: { id: string; approve: boolean; reason?: string }) => reviewCoachPost(id, approve, reason),
    onSuccess: refresh,
  });
}
