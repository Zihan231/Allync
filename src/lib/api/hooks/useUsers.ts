import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, updateMe, upsertMyEfootballProfile, deleteUser } from "@/lib/api/users";

export const meKey = ["users", "me"] as const;

export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: meKey,
    queryFn: getMe,
    enabled,
    retry: false,
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateMe(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meKey });
    },
  });
}

export function useUpsertEfootballProfile() {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => upsertMyEfootballProfile(payload),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
  });
}
