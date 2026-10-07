"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import { downloadCsv } from "@/lib/csv";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Pagination } from "@/components/dashboard/Pagination";
import { getAuditLog, hasRole, type AuditQuery, type AuditRow, type SystemRole } from "@/lib/api/admin";
import { useAuditLog } from "@/lib/api/hooks/useAdmin";
import { Button, EmptyRow, Field, RoleBadge, fmtDateTime, inputClass } from "@/components/admin/ui";
import { SearchIcon } from "@/components/icons";

const PAGE_SIZE = 25;
const EXPORT_LIMIT = 5000;
const STAFF_ROLES = ["moderator", "admin", "super_admin"];

function targetHref(row: AuditRow): string | null {
  if (!row.targetId) return null;
  if (row.targetType === "user") return `/dashboard/admin/users/${row.targetId}`;
  if (row.targetType === "club") return `/dashboard/efootball/clubs/${row.targetId}`;
  if (row.targetType === "community") return `/dashboard/efootball/community/${row.targetId}`;
  if (row.targetType === "tournament") return `/dashboard/efootball/tournaments/${row.targetId}`;
  return null;
}

/** Before / after as "key: old → new" lines. */
function Changes({ row }: { row: AuditRow }) {
  const { t } = useLanguage();
  const keys = [...new Set([...Object.keys(row.before ?? {}), ...Object.keys(row.after ?? {})])];
  if (!keys.length) return <span className="text-ink-faint">–</span>;
  const show = (v: unknown) => (v == null || v === "" ? "∅" : typeof v === "object" ? JSON.stringify(v) : String(v));
  return (
    <table className="text-xs">
      <thead className="text-ink-faint">
        <tr>
          <th className="pr-4 text-left font-normal" />
          <th className="pr-4 text-left font-normal">{t.admin.audit.before}</th>
          <th className="text-left font-normal">{t.admin.audit.after}</th>
        </tr>
      </thead>
      <tbody>
        {keys.map((k) => (
          <tr key={k}>
            <td className="pr-4 font-mono text-ink-faint">{k}</td>
            <td className="pr-4 text-ink-soft">{show(row.before?.[k])}</td>
            <td className="text-ink">{show(row.after?.[k])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AuditLogPage() {
  const { t, locale } = useLanguage();
  const ta = t.admin.audit;
  const { user: me } = useSession();
  const { toasts, toast, dismiss } = useToast();
  const [filters, setFilters] = useState<Omit<AuditQuery, "page" | "limit">>({});
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const isSuper = hasRole(me.systemRole, "super_admin");
  const query = useMemo(() => ({ ...filters, page, limit: PAGE_SIZE }), [filters, page]);
  const { data, isLoading, isFetching } = useAuditLog(query, isSuper);
  const labels = ta.actions as Record<string, string>;
  const targets = ta.targets as Record<string, string>;

  useEffect(() => {
    const id = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput.trim() || undefined }));
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const set = (patch: Partial<AuditQuery>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  async function exportCsv() {
    setExporting(true);
    try {
      const all = await getAuditLog({ ...filters, page: 1, limit: EXPORT_LIMIT });
      downloadCsv(`allynq-audit-${new Date().toISOString().slice(0, 10)}.csv`, [
        ["when", "staff", "staffRole", "action", "targetType", "targetId", "target", "reason", "ip", "before", "after"],
        ...all.data.map((r) => [
          r.createdAt,
          r.actorName,
          r.actorRole,
          r.action,
          r.targetType,
          r.targetId,
          r.targetName,
          r.reason,
          r.ip,
          r.before ? JSON.stringify(r.before) : "",
          r.after ? JSON.stringify(r.after) : "",
        ]),
      ]);
      if (all.meta.total > EXPORT_LIMIT) toast(format(t.admin.common.exportCapped, { count: EXPORT_LIMIT }), "info");
    } catch {
      toast(t.admin.common.errGeneric, "error");
    } finally {
      setExporting(false);
    }
  }

  if (!isSuper) return <EmptyRow>{t.admin.noAccessBody}</EmptyRow>;

  return (
    <div>
      <PageHeader
        eyebrow={t.admin.eyebrow}
        title={ta.title}
        description={ta.description}
        action={
          <Button small variant="outline" onClick={exportCsv} disabled={exporting || !data?.meta.total}>
            {exporting ? t.admin.common.exporting : t.admin.common.exportCsv}
          </Button>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <span className="mb-1 block text-xs font-medium text-ink-soft">{t.admin.common.search}</span>
          <SearchIcon className="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-ink-faint" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={ta.searchPlaceholder} className={`${inputClass} pl-9`} />
        </div>
        <Field label={ta.actionFilter}>
          <select value={filters.action ?? ""} onChange={(e) => set({ action: e.target.value || undefined })} className={inputClass}>
            <option value="">{t.admin.common.all}</option>
            {Object.entries(labels).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={ta.targetFilter}>
          <select value={filters.targetType ?? ""} onChange={(e) => set({ targetType: e.target.value || undefined })} className={inputClass}>
            <option value="">{t.admin.common.all}</option>
            {Object.entries(targets).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.admin.common.from}>
          <input type="date" value={filters.from?.slice(0, 10) ?? ""} onChange={(e) => set({ from: e.target.value ? `${e.target.value}T00:00:00+06:00` : undefined })} className={inputClass} />
        </Field>
        <Field label={t.admin.common.to}>
          <input type="date" value={filters.to?.slice(0, 10) ?? ""} onChange={(e) => set({ to: e.target.value ? `${e.target.value}T23:59:59+06:00` : undefined })} className={inputClass} />
        </Field>
      </div>

      <div className={`mt-4 overflow-x-auto rounded-xl border border-surface-line transition-opacity ${isFetching && !isLoading ? "opacity-60" : ""}`}>
        {isLoading ? (
          <div className="h-64 animate-pulse bg-surface/40" />
        ) : data?.data.length ? (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-surface/60 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-3 py-2.5">{ta.cols.when}</th>
                <th className="px-3 py-2.5">{ta.cols.actor}</th>
                <th className="px-3 py-2.5">{ta.cols.action}</th>
                <th className="px-3 py-2.5">{ta.cols.target}</th>
                <th className="px-3 py-2.5">{ta.cols.reason}</th>
                <th className="px-3 py-2.5">{ta.cols.ip}</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-line/70">
              {data.data.map((row) => {
                const href = targetHref(row);
                return (
                  <Fragment key={row.id}>
                    <tr className="align-top hover:bg-surface/40">
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-ink-soft">{fmtDateTime(row.createdAt, locale)}</td>
                      <td className="px-3 py-2.5">
                        <div className="text-ink">{row.actorName}</div>
                        <RoleBadge role={STAFF_ROLES.includes(row.actorRole) ? (row.actorRole as SystemRole) : null} />
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-ink">{labels[row.action] ?? row.action}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-mono text-[10px] uppercase text-ink-faint">{targets[row.targetType] ?? row.targetType}</div>
                        {href ? (
                          <Link href={href} className="text-ink hover:text-accent-ink">
                            {row.targetName ?? row.targetId}
                          </Link>
                        ) : (
                          <span className="text-ink-soft">{row.targetName ?? "–"}</span>
                        )}
                      </td>
                      <td className="max-w-xs px-3 py-2.5 text-xs text-ink-soft">{row.reason ?? "–"}</td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-ink-faint">{row.ip ?? "–"}</td>
                      <td className="px-3 py-2.5">
                        {row.before || row.after ? (
                          <button type="button" onClick={() => setOpen(open === row.id ? null : row.id)} className="text-xs font-bold text-accent-ink hover:underline">
                            {ta.details}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                    {open === row.id ? (
                      <tr className="bg-surface/30">
                        <td colSpan={7} className="px-3 py-3">
                          <Changes row={row} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-4">
            <EmptyRow>{ta.empty}</EmptyRow>
          </div>
        )}
      </div>
      {data && data.meta.totalPages > 1 ? (
        <div className="mt-4">
          <Pagination page={page} pageCount={data.meta.totalPages} onPageChange={setPage} />
        </div>
      ) : null}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
