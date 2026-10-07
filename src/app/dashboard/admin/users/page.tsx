"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import { downloadCsv } from "@/lib/csv";
import { COUNTRIES } from "@/lib/countries";
import { BD_DIVISIONS } from "@/lib/bangladeshLocations";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { Avatar } from "@/components/common/Avatar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Pagination } from "@/components/dashboard/Pagination";
import {
  getAdminUsers,
  hasRole,
  type AdminUserRow,
  type AdminUsersQuery,
  type BulkAction,
  type SystemRole,
  type UserSort,
  type UserStatus,
  type VerificationStatus,
} from "@/lib/api/admin";
import { useAdminUsers, useBulkUserAction } from "@/lib/api/hooks/useAdmin";
import {
  Badge,
  Button,
  EmptyRow,
  Field,
  Modal,
  RoleBadge,
  StatusBadge,
  VerificationBadge,
  accountState,
  fmtDate,
  fmtDateTime,
  inlineSelectClass,
  inputClass,
  useLocalState,
} from "@/components/admin/ui";
import { SuspendUntilField, localInputValue } from "@/components/admin/SuspendUntilField";
import { FilterIcon, SearchIcon } from "@/components/icons";

const PAGE_SIZE = 25;
const EXPORT_LIMIT = 5000;

type Filters = Omit<AdminUsersQuery, "page" | "limit">;
type Column = "contact" | "location" | "club" | "community" | "verification" | "role" | "status" | "joined" | "lastLogin" | "warnings";
const ALL_COLUMNS: Column[] = ["contact", "location", "club", "community", "verification", "role", "status", "joined", "lastLogin", "warnings"];
const DEFAULT_COLUMNS: Column[] = ["contact", "club", "verification", "role", "status", "joined", "lastLogin"];
const MODERATOR_BULK: BulkAction[] = ["warn", "suspend"];
const ADMIN_BULK: BulkAction[] = ["warn", "suspend", "unsuspend", "ban", "unban", "force_logout", "notify", "bin"];

/** Reads ?status=…&systemRole=… so dashboard links open a pre-filtered list. */
function filtersFromUrl(): Filters {
  const sp = new URLSearchParams(window.location.search);
  const f: Filters = {};
  const status = sp.get("status");
  if (status) f.status = status as UserStatus;
  const role = sp.get("systemRole");
  if (role) f.systemRole = role as Filters["systemRole"];
  const verification = sp.get("verificationStatus");
  if (verification) f.verificationStatus = verification as VerificationStatus;
  return f;
}

export default function AdminUsersPage() {
  const { t, locale } = useLanguage();
  const au = t.admin.users;
  const { user: me } = useSession();
  const { toasts, toast, dismiss } = useToast();
  const [filters, setFilters] = useState<Filters>({});
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [showMore, setShowMore] = useState(false);
  const [columns, setColumns] = useLocalState<Column[]>("allynq.admin.users.columns", DEFAULT_COLUMNS);
  const [saved, setSaved] = useLocalState<Array<{ name: string; filters: Filters }>>("allynq.admin.users.saved", []);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState<BulkAction | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    function hydrate() {
      setFilters(filtersFromUrl());
    }
    hydrate();
  }, []);

  // Search waits for typing to pause.
  useEffect(() => {
    const id = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput.trim() || undefined }));
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const query = useMemo(() => ({ ...filters, page, limit: PAGE_SIZE }), [filters, page]);
  const { data, isLoading, isFetching } = useAdminUsers(query);
  const rows = data?.data ?? [];

  const setFilter = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
    setSelected(new Set());
  };
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allOnPage) rows.forEach((r) => next.delete(r.id));
    else rows.forEach((r) => next.add(r.id));
    setSelected(next);
  };
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  async function exportCsv() {
    setExporting(true);
    try {
      const all = await getAdminUsers({ ...filters, page: 1, limit: EXPORT_LIMIT });
      downloadCsv(`allynq-users-${new Date().toISOString().slice(0, 10)}.csv`, [
        ["id", "name", "email", "phone", "country", "division", "district", "club", "clubRole", "community", "verificationStatus", "verificationLevel", "systemRole", "status", "warnings", "joined", "lastLogin"],
        ...all.data.map((u) => [
          u.id,
          u.name,
          u.email,
          u.phoneNumber,
          u.country,
          u.division,
          u.district,
          u.clubName,
          u.clubRole,
          u.communityName,
          u.verificationStatus,
          Number(u.verificationLevel),
          u.systemRole,
          accountState(u),
          u.warningsCount,
          u.createdAt,
          u.lastLoginAt,
        ]),
      ]);
      if (all.meta.total > EXPORT_LIMIT) toast(format(t.admin.common.exportCapped, { count: EXPORT_LIMIT }), "info");
    } catch {
      toast(t.admin.common.errGeneric, "error");
    } finally {
      setExporting(false);
    }
  }

  function saveCurrent() {
    const name = window.prompt(au.saveFilterPrompt)?.trim();
    if (!name) return;
    setSaved([...saved.filter((s) => s.name !== name), { name, filters }]);
  }

  const bulkActions = hasRole(me.systemRole, "admin") ? ADMIN_BULK : MODERATOR_BULK;
  const cell = (col: Column, u: AdminUserRow) => {
    switch (col) {
      case "contact":
        return (
          <div className="min-w-0 text-xs">
            <div className="truncate text-ink-soft">{u.email ?? "–"}</div>
            <div className="truncate font-mono text-ink-faint">{u.phoneNumber ?? ""}</div>
          </div>
        );
      case "location":
        return <span className="text-xs text-ink-soft">{[u.district, u.division, u.country].filter(Boolean).join(", ") || "–"}</span>;
      case "club":
        return u.clubName ? (
          <div className="text-xs">
            <div className="truncate text-ink">{u.clubName}</div>
            <div className="text-ink-faint">{u.clubRole}</div>
          </div>
        ) : (
          <span className="text-xs text-ink-faint">–</span>
        );
      case "community":
        return <span className="text-xs text-ink-soft">{u.communityName ?? "–"}</span>;
      case "verification":
        return <VerificationBadge status={u.verificationStatus} level={u.verificationLevel} />;
      case "role":
        return u.systemRole ? <RoleBadge role={u.systemRole} /> : <span className="text-xs text-ink-faint">–</span>;
      case "status":
        return accountState(u) === "suspended" ? (
          <span title={format(au.suspendedUntil, { date: fmtDateTime(u.suspendedUntil, locale) })}>
            <StatusBadge user={u} />
          </span>
        ) : (
          <StatusBadge user={u} />
        );
      case "joined":
        return <span className="whitespace-nowrap text-xs text-ink-soft">{fmtDate(u.createdAt, locale)}</span>;
      case "lastLogin":
        return <span className="whitespace-nowrap text-xs text-ink-soft">{u.lastLoginAt ? fmtDateTime(u.lastLoginAt, locale) : t.admin.common.never}</span>;
      case "warnings":
        return u.warningsCount ? <Badge tone="warning">{u.warningsCount}</Badge> : <span className="text-xs text-ink-faint">0</span>;
    }
  };

  return (
    <div>
      <PageHeader eyebrow={t.admin.eyebrow} title={au.title} description={au.description} />

      {/* Search and filters */}
      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={au.searchPlaceholder} className={`${inputClass} pl-9`} />
          </div>
          <select value={filters.status ?? ""} onChange={(e) => setFilter({ status: (e.target.value || undefined) as UserStatus | undefined })} className={inlineSelectClass}>
            <option value="">{au.status}: {t.admin.common.all}</option>
            {(Object.keys(au.statuses) as UserStatus[]).map((s) => (
              <option key={s} value={s}>
                {au.statuses[s]}
              </option>
            ))}
          </select>
          <select
            value={filters.verificationStatus ?? ""}
            onChange={(e) => setFilter({ verificationStatus: (e.target.value || undefined) as VerificationStatus | undefined })}
            className={inlineSelectClass}
          >
            <option value="">{au.verification}: {t.admin.common.all}</option>
            {(Object.keys(au.verificationStatuses) as VerificationStatus[]).map((s) => (
              <option key={s} value={s}>
                {au.verificationStatuses[s]}
              </option>
            ))}
          </select>
          <select value={filters.sort ?? "newest"} onChange={(e) => setFilter({ sort: e.target.value as UserSort })} className={inlineSelectClass}>
            {(Object.keys(au.sorts) as UserSort[]).map((s) => (
              <option key={s} value={s}>
                {au.sort}: {au.sorts[s]}
              </option>
            ))}
          </select>
          <Button variant="outline" small onClick={() => setShowMore((v) => !v)}>
            <FilterIcon className="h-3.5 w-3.5" />
            {au.moreFilters}
          </Button>
        </div>

        {showMore ? (
          <div className="grid gap-3 rounded-2xl border border-surface-line bg-surface/40 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label={au.role}>
              <select value={filters.systemRole ?? ""} onChange={(e) => setFilter({ systemRole: (e.target.value || undefined) as Filters["systemRole"] })} className={inputClass}>
                <option value="">{au.roleAny}</option>
                <option value="staff">{au.roleStaff}</option>
                <option value="none">{t.admin.roleNone}</option>
                {(Object.keys(t.admin.roles) as SystemRole[]).map((r) => (
                  <option key={r} value={r}>
                    {t.admin.roles[r]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={au.level}>
              <select
                value={filters.verificationLevel ?? ""}
                onChange={(e) => setFilter({ verificationLevel: e.target.value === "" ? undefined : Number(e.target.value) })}
                className={inputClass}
              >
                <option value="">{au.levelAny}</option>
                {[0, 1, 2, 3].map((l) => (
                  <option key={l} value={l}>
                    {au.level} {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.admin.dashboard.country}>
              <select value={filters.country ?? ""} onChange={(e) => setFilter({ country: e.target.value || undefined })} className={inputClass}>
                <option value="">{t.admin.dashboard.anyCountry}</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.admin.dashboard.division}>
              <select value={filters.division ?? ""} onChange={(e) => setFilter({ division: e.target.value || undefined })} className={inputClass}>
                <option value="">{t.admin.dashboard.anyDivision}</option>
                {BD_DIVISIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={au.joinedFrom}>
              <input
                type="date"
                value={filters.joinedFrom?.slice(0, 10) ?? ""}
                onChange={(e) => setFilter({ joinedFrom: e.target.value ? `${e.target.value}T00:00:00+06:00` : undefined })}
                className={inputClass}
              />
            </Field>
            <Field label={au.joinedTo}>
              <input
                type="date"
                value={filters.joinedTo?.slice(0, 10) ?? ""}
                onChange={(e) => setFilter({ joinedTo: e.target.value ? `${e.target.value}T23:59:59+06:00` : undefined })}
                className={inputClass}
              />
            </Field>
            <div className="sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-ink-soft">{au.columns}</span>
              <div className="flex flex-wrap gap-1.5">
                {ALL_COLUMNS.map((c) => {
                  const on = columns.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColumns(on ? columns.filter((x) => x !== c) : ALL_COLUMNS.filter((x) => x === c || columns.includes(x)))}
                      className={`rounded-full border px-2.5 py-1 text-xs ${on ? "border-accent bg-accent-soft text-accent-ink" : "border-surface-line-strong text-ink-faint"}`}
                    >
                      {au.cols[c]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* Saved filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-ink-faint">{au.savedFilters}:</span>
          {saved.length ? (
            saved.map((s) => (
              <span key={s.name} className="inline-flex items-center gap-1 rounded-full border border-surface-line-strong pl-2.5 pr-1 py-0.5">
                <button
                  type="button"
                  className="text-ink-soft hover:text-ink"
                  onClick={() => {
                    setFilters(s.filters);
                    setSearchInput(s.filters.search ?? "");
                    setPage(1);
                  }}
                >
                  {s.name}
                </button>
                <button type="button" className="px-1 text-ink-faint hover:text-danger-ink" onClick={() => setSaved(saved.filter((x) => x.name !== s.name))} aria-label="Remove">
                  ×
                </button>
              </span>
            ))
          ) : (
            <span className="text-ink-faint">{au.noSaved}</span>
          )}
          <button type="button" onClick={saveCurrent} className="font-bold text-accent-ink hover:underline">
            + {au.saveFilter}
          </button>
          <button
            type="button"
            onClick={() => {
              setFilters({});
              setSearchInput("");
              setPage(1);
            }}
            className="text-ink-faint hover:text-ink"
          >
            {t.admin.common.reset}
          </button>
        </div>
      </div>

      {/* Summary + bulk bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xs text-ink-faint">{data ? format(au.total, { count: data.meta.total.toLocaleString() }) : ""}</span>
        <Button small variant="outline" onClick={exportCsv} disabled={exporting || !data?.meta.total}>
          {exporting ? t.admin.common.exporting : t.admin.common.exportCsv}
        </Button>
      </div>
      {selected.size ? (
        <div className="sticky top-16 z-10 mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-accent/50 bg-bg-raised/95 p-2.5 shadow-lg backdrop-blur">
          <span className="px-1 text-xs font-bold text-ink">{format(au.selected, { count: selected.size })}</span>
          {bulkActions.map((a) => (
            <Button key={a} small variant={a === "ban" || a === "bin" ? "danger" : "outline"} onClick={() => setBulk(a)}>
              {au.bulk[a]}
            </Button>
          ))}
          <Button small onClick={() => setSelected(new Set())}>
            {au.clearSelection}
          </Button>
        </div>
      ) : null}

      {/* Table */}
      <div className={`mt-3 overflow-hidden rounded-xl border border-surface-line transition-opacity ${isFetching && !isLoading ? "opacity-60" : ""}`}>
        {isLoading ? (
          <div className="h-64 animate-pulse bg-surface/40" />
        ) : rows.length ? (
          <table className="w-full table-fixed text-left">
            <thead className="bg-surface/60 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="w-10 px-3 py-2.5">
                  <input type="checkbox" checked={allOnPage} onChange={toggleAll} className="h-4 w-4 accent-[var(--color-accent)]" aria-label="Select page" />
                </th>
                <th className="w-[30%] px-2 py-2.5 sm:px-3">{au.cols.user}</th>
                {columns.map((c) => (
                  <th key={c} className="truncate px-2 py-2.5 sm:px-3" title={au.cols[c]}>
                    <span className="truncate">{au.cols[c]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-line/70">
              {rows.map((u) => (
                <tr key={u.id} className={selected.has(u.id) ? "bg-accent-soft/20" : "hover:bg-surface/40"}>
                  <td className="px-2 py-2.5 sm:px-3">
                    <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} className="h-4 w-4 accent-[var(--color-accent)]" aria-label={u.name} />
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/dashboard/admin/users/${u.id}`} className="flex min-w-0 items-center gap-2.5">
                      <Avatar dpUrl={u.dpUrl} name={u.name} size="sm" mode="static" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink hover:text-accent-ink">{u.name}</span>
                        {u.warningsCount && !columns.includes("warnings") ? (
                          <span className="font-mono text-[10px] text-warning-ink">⚠ {u.warningsCount}</span>
                        ) : null}
                      </span>
                    </Link>
                  </td>
                  {columns.map((c) => (
                  <td key={c} className="truncate px-2 py-2.5 align-middle text-ellipsis sm:px-3">
                      {cell(c, u)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-4">
            <EmptyRow>{t.admin.common.noResults}</EmptyRow>
          </div>
        )}
      </div>
      {data && data.meta.totalPages > 1 ? (
        <div className="mt-4">
          <Pagination page={page} pageCount={data.meta.totalPages} onPageChange={setPage} />
        </div>
      ) : null}

      {bulk ? (
        <BulkDialog
          action={bulk}
          userIds={[...selected]}
          moderatorLimitDays={hasRole(me.systemRole, "admin") ? undefined : 7}
          onClose={() => setBulk(null)}
          onDone={(done, failed) => {
            setBulk(null);
            setSelected(new Set());
            toast(format(t.admin.common.bulkResult, { done, failed }), failed ? "warning" : "success");
          }}
          onError={(message) => toast(message, "error")}
        />
      ) : null}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function BulkDialog({
  action,
  userIds,
  moderatorLimitDays,
  onClose,
  onDone,
  onError,
}: {
  action: BulkAction;
  userIds: string[];
  moderatorLimitDays?: number;
  onClose: () => void;
  onDone: (done: number, failed: number) => void;
  onError: (message: string) => void;
}) {
  const { t } = useLanguage();
  const au = t.admin.users;
  const run = useBulkUserAction();
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [until, setUntil] = useState(localInputValue(1));
  const needsReason = ["warn", "suspend", "ban", "bin"].includes(action);
  const valid = (!needsReason || reason.trim().length >= 3) && (action !== "notify" || message.trim().length > 0) && (action !== "suspend" || Boolean(until));

  async function submit() {
    try {
      const result = await run.mutateAsync({
        userIds,
        action,
        reason: reason.trim() || undefined,
        message: action === "notify" ? message.trim() : undefined,
        until: action === "suspend" ? new Date(until).toISOString() : undefined,
      });
      onDone(result.done, result.failed.length);
    } catch (error) {
      onError((error as { message?: string }).message ?? t.admin.common.errGeneric);
    }
  }

  return (
    <Modal
      title={format(au.bulkTitle, { action: au.bulk[action], count: userIds.length })}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t.admin.common.cancel}</Button>
          <Button variant={action === "ban" || action === "bin" ? "danger" : "primary"} disabled={!valid || run.isPending} onClick={submit}>
            {au.bulk[action]}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {action === "suspend" ? <SuspendUntilField value={until} onChange={setUntil} moderatorLimitDays={moderatorLimitDays} /> : null}
        {action === "notify" ? (
          <Field label={au.messageLabel}>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={1000} placeholder={au.messagePlaceholder} className={inputClass} />
          </Field>
        ) : (
          <Field label={needsReason ? t.admin.common.reason : t.admin.common.reasonInternal}>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} placeholder={t.admin.common.reasonPlaceholder} className={inputClass} />
          </Field>
        )}
      </div>
    </Modal>
  );
}
