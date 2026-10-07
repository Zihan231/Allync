import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  binContent,
  bulkUserAction,
  getAdminDashboard,
  getAdminUser,
  getAdminUserActivity,
  getAdminUsers,
  getAuditLog,
  getBin,
  getContent,
  getUserDocument,
  getVerifications,
  purgeFromBin,
  restoreFromBin,
  reviewVerification,
  runUserAction,
  type AdminUsersQuery,
  type AuditQuery,
  type BinType,
  type ContentType,
  type DashboardFilters,
  type UserAction,
  type VerificationStatus,
} from "@/lib/api/admin";
import {
  decideDispute,
  getDispute,
  getDisputes,
  getManagedClub,
  getManagedCommunity,
  getManagedTournament,
  runManageAction,
  type DecideInput,
  type DisputeQuery,
} from "@/lib/api/adminManage";

export const adminKeys = {
  all: ["admin"] as const,
  dashboard: (filters: DashboardFilters) => ["admin", "dashboard", filters] as const,
  users: (query: AdminUsersQuery) => ["admin", "users", query] as const,
  user: (id: string) => ["admin", "user", id] as const,
  activity: (id: string, params: object) => ["admin", "user", id, "activity", params] as const,
  document: (id: string) => ["admin", "user", id, "document"] as const,
  verifications: (params: object) => ["admin", "verifications", params] as const,
  content: (type: ContentType, params: object) => ["admin", "content", type, params] as const,
  bin: (params: object) => ["admin", "bin", params] as const,
  audit: (params: object) => ["admin", "audit", params] as const,
};

export function useAdminDashboard(filters: DashboardFilters) {
  return useQuery({ queryKey: adminKeys.dashboard(filters), queryFn: () => getAdminDashboard(filters), placeholderData: keepPreviousData });
}

export function useAdminUsers(query: AdminUsersQuery) {
  return useQuery({ queryKey: adminKeys.users(query), queryFn: () => getAdminUsers(query), placeholderData: keepPreviousData });
}

export function useAdminUser(id: string | undefined) {
  return useQuery({ queryKey: adminKeys.user(id ?? ""), queryFn: () => getAdminUser(id!), enabled: Boolean(id) });
}

export function useAdminUserActivity(id: string, params: { type?: string; page?: number; limit?: number }, enabled = true) {
  return useQuery({
    queryKey: adminKeys.activity(id, params),
    queryFn: () => getAdminUserActivity(id, params),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useUserDocument(id: string | null) {
  return useQuery({ queryKey: adminKeys.document(id ?? ""), queryFn: () => getUserDocument(id!), enabled: Boolean(id) });
}

export function useVerifications(params: { status?: VerificationStatus; search?: string; page?: number; limit?: number }) {
  return useQuery({ queryKey: adminKeys.verifications(params), queryFn: () => getVerifications(params), placeholderData: keepPreviousData });
}

export function useAdminContent(type: ContentType, params: { search?: string; page?: number; limit?: number }) {
  return useQuery({ queryKey: adminKeys.content(type, params), queryFn: () => getContent(type, params), placeholderData: keepPreviousData });
}

export function useBin(params: { type?: BinType; search?: string; page?: number; limit?: number }) {
  return useQuery({ queryKey: adminKeys.bin(params), queryFn: () => getBin(params), placeholderData: keepPreviousData });
}

export function useAuditLog(params: AuditQuery, enabled = true) {
  return useQuery({ queryKey: adminKeys.audit(params), queryFn: () => getAuditLog(params), enabled, placeholderData: keepPreviousData });
}

/** Every admin write refreshes all admin data (lists, counts, the dashboard). */
function useAdminMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

export function useUserAction() {
  return useAdminMutation(({ id, action }: { id: string; action: UserAction }) => runUserAction(id, action));
}

export function useBulkUserAction() {
  return useAdminMutation(bulkUserAction);
}

export function useReviewVerification() {
  return useAdminMutation(({ id, ...body }: { id: string; approve: boolean; level?: number; note?: string }) => reviewVerification(id, body));
}

export function useBinContent() {
  return useAdminMutation(({ type, id, reason }: { type: ContentType; id: string; reason: string }) => binContent(type, id, reason));
}

export function useRestoreFromBin() {
  return useAdminMutation(({ type, id }: { type: BinType; id: string }) => restoreFromBin(type, id));
}

export function usePurgeFromBin() {
  return useAdminMutation(({ type, id }: { type: BinType; id: string }) => purgeFromBin(type, id));
}

// ------------------------------------------ dispute centre and management

export function useDisputes(query: DisputeQuery) {
  return useQuery({ queryKey: ["admin", "disputes", query], queryFn: () => getDisputes(query), placeholderData: keepPreviousData });
}

export function useDispute(gameId: string | undefined) {
  return useQuery({ queryKey: ["admin", "dispute", gameId], queryFn: () => getDispute(gameId!), enabled: Boolean(gameId) });
}

export function useDecideDispute() {
  return useAdminMutation(({ gameId, ...input }: { gameId: string } & DecideInput) => decideDispute(gameId, input));
}

export function useManagedClub(id: string | undefined) {
  return useQuery({ queryKey: ["admin", "manage", "club", id], queryFn: () => getManagedClub(id!), enabled: Boolean(id) });
}

export function useManagedCommunity(id: string | undefined) {
  return useQuery({ queryKey: ["admin", "manage", "community", id], queryFn: () => getManagedCommunity(id!), enabled: Boolean(id) });
}

export function useManagedTournament(id: string | undefined) {
  return useQuery({ queryKey: ["admin", "manage", "tournament", id], queryFn: () => getManagedTournament(id!), enabled: Boolean(id) });
}

export function useManageAction() {
  return useAdminMutation(runManageAction);
}
