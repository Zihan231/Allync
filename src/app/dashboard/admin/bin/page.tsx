"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import { useConfirm } from "@/lib/useConfirm";
import { useToast } from "@/lib/useToast";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ToastContainer } from "@/components/common/Toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Pagination } from "@/components/dashboard/Pagination";
import { hasRole, type BinRow, type BinType } from "@/lib/api/admin";
import { useBin, usePurgeFromBin, useRestoreFromBin } from "@/lib/api/hooks/useAdmin";
import { Badge, Button, EmptyRow, Tabs, fmtDate, inputClass } from "@/components/admin/ui";
import { SearchIcon } from "@/components/icons";

const PAGE_SIZE = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

export default function RecycleBinPage() {
  const { t, locale } = useLanguage();
  const tb = t.admin.bin;
  const { user: me } = useSession();
  const { toasts, toast, dismiss } = useToast();
  const { confirm, confirmProps } = useConfirm();
  const [type, setType] = useState<BinType | "all">("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  // Days-left countdowns are measured from when the page opened.
  const [now] = useState(() => Date.now());
  const restore = useRestoreFromBin();
  const purge = usePurgeFromBin();
  const { data, isLoading, isFetching } = useBin({ type: type === "all" ? undefined : type, search: search || undefined, page, limit: PAGE_SIZE });

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  async function doRestore(row: BinRow) {
    try {
      const result = await restore.mutateAsync({ type: row.entityType, id: row.entityId });
      toast(
        row.memberCount
          ? format(tb.restoredMembers, { name: row.name, reattached: result.reattached, skipped: result.skipped })
          : format(tb.restored, { name: row.name }),
        "success",
      );
    } catch (err) {
      toast((err as { message?: string }).message ?? t.admin.common.errGeneric, "error");
    }
  }

  async function doPurge(row: BinRow) {
    const ok = await confirm(tb.deleteForeverBody, {
      title: format(tb.deleteForeverTitle, { name: row.name }),
      confirmLabel: tb.deleteForever,
      cancelLabel: t.admin.common.cancel,
      variant: "danger",
    });
    if (!ok) return;
    try {
      await purge.mutateAsync({ type: row.entityType, id: row.entityId });
      toast(format(tb.purged, { name: row.name }), "success");
    } catch (err) {
      toast((err as { message?: string }).message ?? t.admin.common.errGeneric, "error");
    }
  }

  if (!hasRole(me.systemRole, "admin")) return <EmptyRow>{t.admin.noAccessBody}</EmptyRow>;
  const isSuper = hasRole(me.systemRole, "super_admin");

  return (
    <div>
      <PageHeader eyebrow={t.admin.eyebrow} title={tb.title} description={tb.description} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Tabs<BinType | "all">
          value={type}
          onChange={(v) => {
            setType(v);
            setPage(1);
          }}
          options={[{ value: "all" as const, label: tb.typeAll }, ...(Object.keys(tb.types) as BinType[]).map((k) => ({ value: k, label: tb.types[k] }))]}
        />
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={t.admin.common.search} className={`${inputClass} pl-9`} />
        </div>
      </div>

      <div className={`mt-4 transition-opacity ${isFetching && !isLoading ? "opacity-60" : ""}`}>
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-xl bg-surface/40" />
        ) : data?.data.length ? (
          <ul className="divide-y divide-surface-line/70 rounded-xl border border-surface-line">
            {data.data.map((row) => {
              const daysLeft = Math.max(0, Math.ceil((new Date(row.purgeAfter).getTime() - now) / DAY_MS));
              return (
                <li key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Badge tone="neutral">{tb.types[row.entityType]}</Badge>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">{row.name}</div>
                    <div className="flex flex-wrap gap-x-2 text-xs text-ink-faint">
                      <span>
                        {row.deletedByName
                          ? format(tb.deletedBy, { name: row.deletedByName, date: fmtDate(row.deletedAt, locale) })
                          : format(tb.deletedBySelf, { date: fmtDate(row.deletedAt, locale) })}
                      </span>
                      {row.memberCount ? <span>· {format(tb.members, { count: row.memberCount })}</span> : null}
                    </div>
                    {row.reason ? <p className="mt-0.5 truncate text-xs text-ink-soft">“{row.reason}”</p> : null}
                  </div>
                  <span className={`font-mono text-[11px] ${daysLeft <= 3 ? "text-danger-ink" : "text-ink-faint"}`}>
                    {daysLeft === 0 ? tb.lastDay : format(tb.daysLeft, { days: daysLeft })}
                  </span>
                  <Button small variant="primary" disabled={restore.isPending} onClick={() => doRestore(row)}>
                    {tb.restore}
                  </Button>
                  {isSuper ? (
                    <Button small variant="danger" disabled={purge.isPending} onClick={() => doPurge(row)}>
                      {tb.deleteForever}
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyRow>{tb.empty}</EmptyRow>
        )}
      </div>
      {data && data.meta.totalPages > 1 ? (
        <div className="mt-4">
          <Pagination page={page} pageCount={data.meta.totalPages} onPageChange={setPage} />
        </div>
      ) : null}

      <ConfirmDialog {...confirmProps} />
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
