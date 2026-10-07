"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { downloadCsv } from "@/lib/csv";
import { Avatar } from "@/components/common/Avatar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Pagination } from "@/components/dashboard/Pagination";
import { Badge, Button, EmptyRow, Field, REPORT_STATUS_TONE, fmtDateTime, inlineSelectClass, inputClass } from "@/components/admin/ui";
import { useAdminReportCounts, useAdminReports } from "@/lib/api/hooks/useReports";
import { getAdminReports, REPORT_REASONS, type AdminReportsQuery, type ReportTarget } from "@/lib/api/reports";
import { SearchIcon } from "@/components/icons";

const PAGE_SIZE = 20;
const TARGETS: ReportTarget[] = ["user", "club", "community", "tournament", "match"];

type Filters = Omit<AdminReportsQuery, "page" | "limit">;

export default function AdminReportsPage() {
  const { t, locale } = useLanguage();
  const ar = t.admin.reports;
  const tr = t.reports;
  const [filters, setFilters] = useState<Filters>({ status: "active", sort: "priority" });
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const query = useMemo(() => ({ ...filters, page, limit: PAGE_SIZE }), [filters, page]);
  const { data, isLoading, isFetching } = useAdminReports(query);
  const { data: counts } = useAdminReportCounts();

  // ?targetId=… (from a club or user page) shows every report about that target.
  useEffect(() => {
    function fromUrl() {
      const targetId = new URLSearchParams(window.location.search).get("targetId");
      if (targetId) setFilters((f) => ({ ...f, targetId, status: "all" }));
    }
    fromUrl();
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput.trim() || undefined }));
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const set = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  async function exportCsv() {
    setExporting(true);
    try {
      const all = await getAdminReports({ ...filters, page: 1, limit: 5000 });
      downloadCsv(`allynq-reports-${new Date().toISOString().slice(0, 10)}.csv`, [
        ["id", "created", "status", "targetType", "target", "reason", "reporter", "reportedAs", "onBehalfOf", "assignee", "openOnTarget", "details"],
        ...all.data.map((r) => [
          r.id,
          r.createdAt,
          r.status,
          r.targetType,
          r.targetName,
          r.reason,
          r.reporterName,
          r.reportedAs,
          r.reporterClubName ?? r.reporterCommunityName,
          r.assigneeName,
          r.openOnTarget,
          r.details,
        ]),
      ]);
    } finally {
      setExporting(false);
    }
  }

  const statusOptions = Object.keys(ar.statusFilter) as Array<keyof typeof ar.statusFilter>;

  return (
    <div>
      <PageHeader
        eyebrow={t.admin.eyebrow}
        title={ar.title}
        description={ar.description}
        action={
          <Button small variant="outline" onClick={exportCsv} disabled={exporting || !data?.meta.total}>
            {exporting ? t.admin.common.exporting : t.admin.common.exportCsv}
          </Button>
        }
      />
      {counts ? <p className="mt-3 font-mono text-xs text-ink-faint">{format(ar.counts, counts)}</p> : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={ar.searchPlaceholder} className={`${inputClass} pl-9`} />
        </div>
        <select value={filters.status ?? "active"} onChange={(e) => set({ status: e.target.value as Filters["status"] })} className={inlineSelectClass}>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {ar.statusFilter[s]}
            </option>
          ))}
        </select>
        <select value={filters.targetType ?? ""} onChange={(e) => set({ targetType: (e.target.value || undefined) as ReportTarget | undefined })} className={inlineSelectClass}>
          <option value="">{ar.allTargets}</option>
          {TARGETS.map((k) => (
            <option key={k} value={k}>
              {tr.kinds[k]}
            </option>
          ))}
        </select>
        <select value={filters.reason ?? ""} onChange={(e) => set({ reason: (e.target.value || undefined) as Filters["reason"] })} className={inlineSelectClass}>
          <option value="">{ar.allReasons}</option>
          {REPORT_REASONS.map((r) => (
            <option key={r} value={r}>
              {tr.reasons[r]}
            </option>
          ))}
        </select>
        <select value={filters.assignee ?? ""} onChange={(e) => set({ assignee: e.target.value || undefined })} className={inlineSelectClass}>
          <option value="">{ar.assignee.any}</option>
          <option value="me">{ar.assignee.me}</option>
          <option value="unassigned">{ar.assignee.unassigned}</option>
        </select>
        <select value={filters.reportedAs ?? ""} onChange={(e) => set({ reportedAs: (e.target.value || undefined) as Filters["reportedAs"] })} className={inlineSelectClass}>
          <option value="">{ar.from.any}</option>
          <option value="leaders">{ar.from.leaders}</option>
          <option value="self">{ar.from.self}</option>
        </select>
        <select value={filters.sort ?? "priority"} onChange={(e) => set({ sort: e.target.value as Filters["sort"] })} className={inlineSelectClass}>
          {(Object.keys(ar.sorts) as Array<keyof typeof ar.sorts>).map((s) => (
            <option key={s} value={s}>
              {ar.sorts[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-2 grid max-w-md grid-cols-2 gap-2">
        <Field label={t.admin.common.from}>
          <input type="date" value={filters.from?.slice(0, 10) ?? ""} onChange={(e) => set({ from: e.target.value ? `${e.target.value}T00:00:00+06:00` : undefined })} className={inputClass} />
        </Field>
        <Field label={t.admin.common.to}>
          <input type="date" value={filters.to?.slice(0, 10) ?? ""} onChange={(e) => set({ to: e.target.value ? `${e.target.value}T23:59:59+06:00` : undefined })} className={inputClass} />
        </Field>
      </div>

      <div className={`mt-4 transition-opacity ${isFetching && !isLoading ? "opacity-60" : ""}`}>
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-xl bg-surface/40" />
        ) : data?.data.length ? (
          <ul className="divide-y divide-surface-line/70 rounded-xl border border-surface-line">
            {data.data.map((r) => (
              <li key={r.id}>
                <Link href={`/dashboard/admin/reports/${r.id}`} className="flex flex-wrap items-start gap-3 px-4 py-3 hover:bg-surface/40">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={REPORT_STATUS_TONE[r.status]}>{ar.statusFilter[r.status]}</Badge>
                      <Badge tone="neutral">{tr.kinds[r.targetType]}</Badge>
                      <span className="truncate text-sm font-semibold text-ink">{r.targetName}</span>
                      {r.openOnTarget > 1 ? <Badge tone="danger">{format(ar.onTarget, { count: r.openOnTarget })}</Badge> : null}
                      {r.reportedAs !== "self" ? <Badge tone="accent">{ar.leader}</Badge> : null}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-ink-soft">{tr.reasons[r.reason]}</div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-ink-faint">{r.details}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-faint">
                      <Avatar dpUrl={r.reporterDpUrl} name={r.reporterName} size="sm" mode="static" className="!h-5 !w-5 !text-[8px]" />
                      <span>{format(ar.by, { name: r.reporterName })}</span>
                      {r.reporterClubName || r.reporterCommunityName ? (
                        <span>· {format(ar.forGroup, { name: (r.reporterClubName ?? r.reporterCommunityName)! })}</span>
                      ) : null}
                      <span>· {fmtDateTime(r.createdAt, locale)}</span>
                      {r.attachmentCount ? <span>· 📎 {r.attachmentCount}</span> : null}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-ink-soft">{r.assigneeName ? format(ar.assignedTo, { name: r.assigneeName }) : ar.unassigned}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyRow>{ar.empty}</EmptyRow>
        )}
      </div>
      {data && data.meta.totalPages > 1 ? (
        <div className="mt-4">
          <Pagination page={page} pageCount={data.meta.totalPages} onPageChange={setPage} />
        </div>
      ) : null}
    </div>
  );
}
