import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginRequest, registerRequest, logoutRequest } from "@/lib/api/auth";
import { meKey } from "./useUsers";

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      // Seed the /users/me cache directly from the login response so the
      // profile page doesn't have to make a second round trip for data we
      // already have.
      queryClient.setQueryData(meKey, data.user);
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerRequest,
    onSuccess: (data) => {
      queryClient.setQueryData(meKey, data.user);
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: meKey });
    },
  });
}
