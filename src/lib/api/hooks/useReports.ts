import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addReportNote,
  assignReport,
  createReport,
  getActivityFeed,
  getAdminReport,
  getAdminReportCounts,
  getAdminReports,
  getLoginFeed,
  getMyReport,
  getMyReports,
  replyToReport,
  resolveReport,
  withdrawReport,
  type ActivityFeedQuery,
  type AdminReportsQuery,
  type LoginFeedQuery,
  type ResolveReportInput,
} from "@/lib/api/reports";
import { adminKeys } from "@/lib/api/hooks/useAdmin";

export const reportKeys = {
  mine: (params: object) => ["reports", "mine", params] as const,
  one: (id: string) => ["reports", "one", id] as const,
  admin: (query: object) => ["admin", "reports", query] as const,
  adminOne: (id: string) => ["admin", "report", id] as const,
  counts: () => ["admin", "reports", "counts"] as const,
  activity: (params: object) => ["admin", "activity", params] as const,
  logins: (params: object) => ["admin", "logins", params] as const,
};

// ------------------------------------------------------------ reporter

export function useMyReports(params: { page?: number; limit?: number }) {
  return useQuery({ queryKey: reportKeys.mine(params), queryFn: () => getMyReports(params), placeholderData: keepPreviousData });
}

export function useMyReport(id: string | null) {
  return useQuery({ queryKey: reportKeys.one(id ?? ""), queryFn: () => getMyReport(id!), enabled: Boolean(id) });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useReplyToReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => replyToReport(id, body),
    onSuccess: (data) => {
      queryClient.setQueryData(reportKeys.one(data.id), data);
      queryClient.invalidateQueries({ queryKey: ["reports", "mine"] });
    },
  });
}

export function useWithdrawReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: withdrawReport,
    onSuccess: (data) => {
      queryClient.setQueryData(reportKeys.one(data.id), data);
      queryClient.invalidateQueries({ queryKey: ["reports", "mine"] });
    },
  });
}

// --------------------------------------------------------------- staff

export function useAdminReports(query: AdminReportsQuery) {
  return useQuery({ queryKey: reportKeys.admin(query), queryFn: () => getAdminReports(query), placeholderData: keepPreviousData });
}

export function useAdminReportCounts(enabled = true) {
  return useQuery({ queryKey: reportKeys.counts(), queryFn: getAdminReportCounts, enabled, refetchInterval: 60_000 });
}

export function useAdminReport(id: string | undefined) {
  return useQuery({ queryKey: reportKeys.adminOne(id ?? ""), queryFn: () => getAdminReport(id!), enabled: Boolean(id) });
}

/** Report writes refresh the report itself and every admin list / count. */
function useReportMutation<TVars>(fn: (vars: TVars) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }) });
}

export function useAssignReport() {
  return useReportMutation(({ id, assigneeId }: { id: string; assigneeId: string | null }) => assignReport(id, assigneeId));
}

export function useAddReportNote() {
  return useReportMutation(({ id, body, internal }: { id: string; body: string; internal: boolean }) => addReportNote(id, body, internal));
}

export function useResolveReport() {
  return useReportMutation(({ id, ...input }: { id: string } & ResolveReportInput) => resolveReport(id, input));
}

export function useActivityFeed(params: ActivityFeedQuery) {
  return useQuery({ queryKey: reportKeys.activity(params), queryFn: () => getActivityFeed(params), placeholderData: keepPreviousData });
}

export function useLoginFeed(params: LoginFeedQuery) {
  return useQuery({ queryKey: reportKeys.logins(params), queryFn: () => getLoginFeed(params), placeholderData: keepPreviousData });
}
