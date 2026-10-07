"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { downloadCsv } from "@/lib/csv";
import { Avatar } from "@/components/common/Avatar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Pagination } from "@/components/dashboard/Pagination";
import { Badge, Button, EmptyRow, Field, Tabs, fmtDateTime, inputClass } from "@/components/admin/ui";
import { useActivityFeed, useLoginFeed } from "@/lib/api/hooks/useReports";
import { getActivityFeed, getLoginFeed, reportTargetHref, type ReportTarget } from "@/lib/api/reports";
import { InfoIcon, SearchIcon } from "@/components/icons";

type Tab = "activity" | "logins";
const PAGE_SIZE = 30;

/** Debounced text input value. */
function useDebounced(value: string, ms = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value.trim()), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export default function AdminActivityPage() {
  const { t } = useLanguage();
  const ta = t.admin.activity;
  const [tab, setTab] = useState<Tab>("activity");
  return (
    <div>
      <PageHeader eyebrow={t.admin.eyebrow} title={ta.title} description={ta.description} />
      <div className="mt-6">
        <Tabs<Tab> value={tab} onChange={setTab} options={(Object.keys(ta.tabs) as Tab[]).map((k) => ({ value: k, label: ta.tabs[k] }))} />
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-faint">
        <InfoIcon className="h-3.5 w-3.5" />
        {ta.hint}
      </p>
      <div className="mt-4">{tab === "activity" ? <ActivityTab /> : <LoginsTab />}</div>
    </div>
  );
}

function DateRange({ from, to, onChange }: { from?: string; to?: string; onChange: (patch: { from?: string; to?: string }) => void }) {
  const { t } = useLanguage();
  return (
    <>
      <Field label={t.admin.common.from}>
        <input type="date" value={from?.slice(0, 10) ?? ""} onChange={(e) => onChange({ from: e.target.value ? `${e.target.value}T00:00:00+06:00` : undefined })} className={inputClass} />
      </Field>
      <Field label={t.admin.common.to}>
        <input type="date" value={to?.slice(0, 10) ?? ""} onChange={(e) => onChange({ to: e.target.value ? `${e.target.value}T23:59:59+06:00` : undefined })} className={inputClass} />
      </Field>
    </>
  );
}

function ActivityTab() {
  const { t, locale } = useLanguage();
  const ta = t.admin.activity;
  const [type, setType] = useState("all");
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput);
  const [paging, setPaging] = useState({ key: "", page: 1 });
  const [exporting, setExporting] = useState(false);
  const params = useMemo(() => ({ type: type === "all" ? undefined : type, ...range, search: search || undefined }), [type, range, search]);
  // Back to page 1 whenever the filters change.
  const filterKey = JSON.stringify(params);
  const page = paging.key === filterKey ? paging.page : 1;
  const setPage = (next: number) => setPaging({ key: filterKey, page: next });
  const { data, isLoading, isFetching } = useActivityFeed({ ...params, page, limit: PAGE_SIZE });

  async function exportCsv() {
    setExporting(true);
    try {
      const all = await getActivityFeed({ ...params, page: 1, limit: 5000 });
      downloadCsv(`allynq-activity-${new Date().toISOString().slice(0, 10)}.csv`, [
        ["when", "user", "userId", "type", "summary", "targetType", "target", "ip"],
        ...all.data.map((a) => [a.createdAt, a.userName, a.userId, a.type, a.summary, a.targetType, a.targetName ?? a.targetId, a.ip]),
      ]);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <span className="mb-1 block text-xs font-medium text-ink-soft">{t.admin.common.search}</span>
          <SearchIcon className="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-ink-faint" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={ta.searchPlaceholder} className={`${inputClass} pl-9`} />
        </div>
        <Field label={t.admin.audit.actionFilter}>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            {(Object.keys(ta.types) as Array<keyof typeof ta.types>).map((k) => (
              <option key={k} value={k}>
                {ta.types[k]}
              </option>
            ))}
          </select>
        </Field>
        <DateRange from={range.from} to={range.to} onChange={(patch) => setRange({ ...range, ...patch })} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-xs text-ink-faint">{data ? data.meta.total.toLocaleString() : ""}</span>
        <Button small variant="outline" onClick={exportCsv} disabled={exporting || !data?.meta.total}>
          {exporting ? t.admin.common.exporting : t.admin.common.exportCsv}
        </Button>
      </div>
      <div className={`mt-3 transition-opacity ${isFetching && !isLoading ? "opacity-60" : ""}`}>
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-xl bg-surface/40" />
        ) : data?.data.length ? (
          <ul className="divide-y divide-surface-line/70 rounded-xl border border-surface-line">
            {data.data.map((a) => {
              const href = a.targetType && a.targetId ? reportTargetHref(a.targetType as ReportTarget, a.targetId) : null;
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
                  {a.userId ? (
                    <Link href={`/dashboard/admin/users/${a.userId}`} className="flex min-w-0 items-center gap-2">
                      <Avatar dpUrl={a.userDpUrl} name={a.userName ?? "?"} size="sm" mode="static" />
                      <span className="truncate font-semibold text-ink hover:text-accent-ink">{a.userName}</span>
                    </Link>
                  ) : null}
                  <span className="min-w-0 flex-1 text-ink-soft">
                    {a.summary}
                    {(a.targetName || a.targetId) && a.targetId !== a.userId ? (
                      <>
                        {" · "}
                        {href ? (
                          <a href={href} className="text-ink hover:text-accent-ink">
                            {a.targetName ?? a.targetId}
                          </a>
                        ) : (
                          <span className="text-ink">{a.targetName ?? a.targetId}</span>
                        )}
                      </>
                    ) : null}
                  </span>
                  <span className="font-mono text-[10px] uppercase text-ink-faint">{a.type}</span>
                  <span className="whitespace-nowrap text-xs text-ink-faint">{fmtDateTime(a.createdAt, locale)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyRow>{ta.empty}</EmptyRow>
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

function LoginsTab() {
  const { t, locale } = useLanguage();
  const ta = t.admin.activity;
  const failures = t.admin.user.loginFailure as Record<string, string>;
  const [result, setResult] = useState<"" | "success" | "failed">("");
  const [ip, setIp] = useState("");
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput);
  const ipFilter = useDebounced(ip);
  const [paging, setPaging] = useState({ key: "", page: 1 });
  const [exporting, setExporting] = useState(false);
  const params = useMemo(
    () => ({ result: result || undefined, ip: ipFilter || undefined, ...range, search: search || undefined }),
    [result, ipFilter, range, search],
  );
  const filterKey = JSON.stringify(params);
  const page = paging.key === filterKey ? paging.page : 1;
  const setPage = (next: number) => setPaging({ key: filterKey, page: next });
  const { data, isLoading, isFetching } = useLoginFeed({ ...params, page, limit: PAGE_SIZE });

  async function exportCsv() {
    setExporting(true);
    try {
      const all = await getLoginFeed({ ...params, page: 1, limit: 5000 });
      downloadCsv(`allynq-signins-${new Date().toISOString().slice(0, 10)}.csv`, [
        ["when", "email", "user", "success", "failureReason", "ip", "accountsOnIp", "userAgent"],
        ...all.data.map((l) => [l.createdAt, l.email, l.userName, l.success ? "yes" : "no", l.failureReason, l.ip, l.accountsOnIp, l.userAgent]),
      ]);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative">
          <span className="mb-1 block text-xs font-medium text-ink-soft">{t.admin.common.search}</span>
          <SearchIcon className="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-ink-faint" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={ta.loginSearchPlaceholder} className={`${inputClass} pl-9`} />
        </div>
        <Field label={ta.ipFilter}>
          <input value={ip} onChange={(e) => setIp(e.target.value)} className={inputClass} />
        </Field>
        <Field label={t.admin.users.status}>
          <select value={result} onChange={(e) => setResult(e.target.value as typeof result)} className={inputClass}>
            <option value="">{ta.results.all}</option>
            <option value="success">{ta.results.success}</option>
            <option value="failed">{ta.results.failed}</option>
          </select>
        </Field>
        <DateRange from={range.from} to={range.to} onChange={(patch) => setRange({ ...range, ...patch })} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-xs text-ink-faint">{data ? data.meta.total.toLocaleString() : ""}</span>
        <Button small variant="outline" onClick={exportCsv} disabled={exporting || !data?.meta.total}>
          {exporting ? t.admin.common.exporting : t.admin.common.exportCsv}
        </Button>
      </div>
      <div className={`mt-3 transition-opacity ${isFetching && !isLoading ? "opacity-60" : ""}`}>
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-xl bg-surface/40" />
        ) : data?.data.length ? (
          <ul className="divide-y divide-surface-line/70 rounded-xl border border-surface-line">
            {data.data.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
                <Badge tone={l.success ? "success" : "danger"}>{l.success ? t.admin.user.loginOk : failures[l.failureReason ?? ""] ?? l.failureReason}</Badge>
                {l.userId ? (
                  <Link href={`/dashboard/admin/users/${l.userId}`} className="font-semibold text-ink hover:text-accent-ink">
                    {l.userName ?? l.email}
                  </Link>
                ) : (
                  <span className="text-ink-soft">{l.email}</span>
                )}
                <button type="button" onClick={() => l.ip && setIp(l.ip)} className="font-mono text-xs text-ink-faint hover:text-accent-ink">
                  {l.ip ?? "–"}
                </button>
                {l.accountsOnIp >= 3 ? <Badge tone="warning">{format(ta.accountsOnIp, { count: l.accountsOnIp })}</Badge> : null}
                <span className="min-w-0 flex-1 truncate text-[11px] text-ink-faint">{l.userAgent}</span>
                <span className="whitespace-nowrap text-xs text-ink-faint">{fmtDateTime(l.createdAt, locale)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyRow>{ta.empty}</EmptyRow>
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
