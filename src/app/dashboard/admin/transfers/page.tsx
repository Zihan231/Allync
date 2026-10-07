"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import { downloadCsv } from "@/lib/csv";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { Avatar } from "@/components/common/Avatar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Pagination } from "@/components/dashboard/Pagination";
import { STATUS_CLASSES, tk, useTransferLabels } from "@/components/dashboard/transfers/shared";
import { Button, EmptyRow, Field, ReasonDialog, Tabs, fmtDateTime, inlineSelectClass, inputClass } from "@/components/admin/ui";
import { hasRole } from "@/lib/api/admin";
import { getAdminOffers, getLedger, type AdminOfferRow, type AdminOffersQuery, type LedgerKind, type LedgerQuery } from "@/lib/api/adminPlatform";
import { useAdminOffers, useLedger, usePlatformAction } from "@/lib/api/hooks/useAdmin";
import type { OfferKind } from "@/lib/api/transfers";
import { SearchIcon } from "@/components/icons";

type Tab = "offers" | "ledger";
const PAGE_SIZE = 25;

function useDebounced(value: string) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value.trim()), 350);
    return () => clearTimeout(id);
  }, [value]);
  return v;
}

/** Page number that falls back to 1 whenever the filters change. */
function usePaging(filters: object) {
  const key = JSON.stringify(filters);
  const [paging, setPaging] = useState({ key, page: 1 });
  return [paging.key === key ? paging.page : 1, (page: number) => setPaging({ key, page })] as const;
}

export default function AdminTransfersPage() {
  const { t } = useLanguage();
  const tm = t.admin.market;
  const { user: me } = useSession();
  const [tab, setTab] = useState<Tab>("offers");
  if (!hasRole(me.systemRole, "admin")) return <EmptyRow>{t.admin.noAccessBody}</EmptyRow>;
  return (
    <div>
      <PageHeader eyebrow={t.admin.eyebrow} title={tm.title} description={tm.description} />
      <div className="mt-6">
        <Tabs<Tab> value={tab} onChange={setTab} options={(Object.keys(tm.tabs) as Tab[]).map((k) => ({ value: k, label: tm.tabs[k] }))} />
      </div>
      <div className="mt-4">{tab === "offers" ? <OffersTab /> : <LedgerTab />}</div>
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

function OffersTab() {
  const { t, locale } = useLanguage();
  const tm = t.admin.market;
  const labels = useTransferLabels();
  const { user: me } = useSession();
  const { toasts, toast, dismiss } = useToast();
  const action = usePlatformAction();
  const [status, setStatus] = useState<string>("open");
  const [kind, setKind] = useState<string>("");
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput);
  const [dialog, setDialog] = useState<{ type: "cancel" | "reverse"; row: AdminOfferRow } | null>(null);
  const [exporting, setExporting] = useState(false);
  const filters: AdminOffersQuery = useMemo(
    () => ({
      status: status === "all" ? undefined : (status as AdminOffersQuery["status"]),
      kind: (kind || undefined) as OfferKind | undefined,
      search: search || undefined,
      ...range,
    }),
    [status, kind, search, range],
  );
  const [page, setPage] = usePaging(filters);
  const { data, isLoading, isFetching } = useAdminOffers({ ...filters, page, limit: PAGE_SIZE });

  async function exportCsv() {
    setExporting(true);
    try {
      const all = await getAdminOffers({ ...filters, page: 1, limit: 5000 });
      downloadCsv(`allynq-transfers-${new Date().toISOString().slice(0, 10)}.csv`, [
        ["id", "created", "completed", "kind", "status", "player", "from", "to", "amountTk", "paidTo", "paymentRef"],
        ...all.data.map((o) => [o.id, o.createdAt, o.completedAt, o.kind, o.status, o.playerName, o.fromClubName, o.toClubName, o.amountTk, o.payeeType, o.paymentRef]),
      ]);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={tm.searchPlaceholder} className={`${inputClass} pl-9`} />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inlineSelectClass}>
          {(Object.keys(tm.statusFilter) as Array<keyof typeof tm.statusFilter>).map((s) => (
            <option key={s} value={s}>
              {tm.statusFilter[s]}
            </option>
          ))}
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value)} className={inlineSelectClass}>
          {(Object.keys(tm.kinds) as Array<keyof typeof tm.kinds>).map((k) => (
            <option key={k} value={k === "all" ? "" : k}>
              {tm.kinds[k]}
            </option>
          ))}
        </select>
        <Button small variant="outline" onClick={exportCsv} disabled={exporting || !data?.meta.total}>
          {exporting ? t.admin.common.exporting : t.admin.common.exportCsv}
        </Button>
      </div>
      <div className="mt-2 grid max-w-md grid-cols-2 gap-2">
        <DateRange from={range.from} to={range.to} onChange={(p) => setRange({ ...range, ...p })} />
      </div>

      <div className={`mt-4 transition-opacity ${isFetching && !isLoading ? "opacity-60" : ""}`}>
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-xl bg-surface/40" />
        ) : data?.data.length ? (
          <ul className="divide-y divide-surface-line/70 rounded-xl border border-surface-line">
            {data.data.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <Avatar dpUrl={o.playerDpUrl} name={o.playerName} size="sm" mode="static" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/dashboard/admin/users/${o.playerUserId}`} className="font-semibold text-ink hover:text-accent-ink">
                      {o.playerName}
                    </Link>
                    <span className="text-ink-faint">
                      {o.fromClubName ?? "—"} → {o.toClubName}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${STATUS_CLASSES[o.status]}`}>{labels.status[o.status]}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-ink-faint">
                    <span>{labels.kind[o.kind]}</span>
                    <span>· {tk(o.amountTk)}</span>
                    {o.amountTk ? <span>· {format(tm.paidTo, { name: o.payeeType === "club" ? (o.fromClubName ?? "club") : o.playerName })}</span> : null}
                    {o.paymentRef ? <span className="font-mono">· {o.paymentRef}</span> : null}
                    <span>· {fmtDateTime(o.completedAt ?? o.createdAt, locale)}</span>
                  </div>
                </div>
                {o.status === "pending" || o.status === "scheduled" ? (
                  <Button small variant="danger" onClick={() => setDialog({ type: "cancel", row: o })}>
                    {tm.cancel}
                  </Button>
                ) : null}
                {o.reversible && hasRole(me.systemRole, "super_admin") ? (
                  <Button small variant="outline" onClick={() => setDialog({ type: "reverse", row: o })}>
                    {tm.reverse}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyRow>{t.admin.common.noResults}</EmptyRow>
        )}
      </div>
      {data && data.meta.totalPages > 1 ? (
        <div className="mt-4">
          <Pagination page={page} pageCount={data.meta.totalPages} onPageChange={setPage} />
        </div>
      ) : null}

      {dialog ? (
        <ReasonDialog
          title={dialog.type === "cancel" ? tm.cancelTitle : format(tm.reverseTitle, { player: dialog.row.playerName, club: dialog.row.toClubName })}
          body={dialog.type === "cancel" ? tm.cancelBody : format(tm.reverseBody, { club: dialog.row.toClubName })}
          confirmLabel={dialog.type === "cancel" ? tm.cancel : tm.reverse}
          danger
          busy={action.isPending}
          onCancel={() => setDialog(null)}
          onConfirm={async (reason) => {
            try {
              await action.mutateAsync({ kind: dialog.type === "cancel" ? "cancelOffer" : "reverseOffer", id: dialog.row.id, reason });
              toast(dialog.type === "cancel" ? tm.cancelled : tm.reversed, "success");
              setDialog(null);
            } catch (err) {
              toast((err as { message?: string }).message ?? t.admin.common.errGeneric, "error");
            }
          }}
        />
      ) : null}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function LedgerTab() {
  const { t, locale } = useLanguage();
  const tm = t.admin.market;
  const [ownerType, setOwnerType] = useState<"" | "user" | "club">("");
  const [kind, setKind] = useState<"" | LedgerKind>("");
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput);
  const [exporting, setExporting] = useState(false);
  const filters: LedgerQuery = useMemo(
    () => ({ ownerType: ownerType || undefined, kind: kind || undefined, search: search || undefined, ...range }),
    [ownerType, kind, search, range],
  );
  const [page, setPage] = usePaging(filters);
  const { data, isLoading, isFetching } = useLedger({ ...filters, page, limit: 30 });

  async function exportCsv() {
    setExporting(true);
    try {
      const all = await getLedger({ ...filters, page: 1, limit: 5000 });
      downloadCsv(`allynq-ledger-${new Date().toISOString().slice(0, 10)}.csv`, [
        ["when", "walletType", "owner", "kind", "amountTk", "counterparty", "reference", "offerId"],
        ...all.data.map((r) => [r.createdAt, r.ownerType, r.ownerName, r.kind, r.amountTk, r.counterparty, r.reference, r.offerId]),
      ]);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={t.admin.common.search} className={`${inputClass} pl-9`} />
        </div>
        <select value={ownerType} onChange={(e) => setOwnerType(e.target.value as typeof ownerType)} className={inlineSelectClass}>
          <option value="">{tm.owners.all}</option>
          <option value="user">{tm.owners.user}</option>
          <option value="club">{tm.owners.club}</option>
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={inlineSelectClass}>
          {(Object.keys(tm.ledgerKinds) as Array<keyof typeof tm.ledgerKinds>).map((k) => (
            <option key={k} value={k === "all" ? "" : k}>
              {tm.ledgerKinds[k]}
            </option>
          ))}
        </select>
        <Button small variant="outline" onClick={exportCsv} disabled={exporting || !data?.meta.total}>
          {exporting ? t.admin.common.exporting : t.admin.common.exportCsv}
        </Button>
      </div>
      <div className="mt-2 grid max-w-md grid-cols-2 gap-2">
        <DateRange from={range.from} to={range.to} onChange={(p) => setRange({ ...range, ...p })} />
      </div>
      {data ? (
        <p className="mt-3 font-mono text-xs text-ink-faint">
          {format(tm.totals, { wallets: data.totals.wallets, balance: tk(data.totals.balanceTk), held: tk(data.totals.heldTk) })}
        </p>
      ) : null}

      <div className={`mt-3 transition-opacity ${isFetching && !isLoading ? "opacity-60" : ""}`}>
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-xl bg-surface/40" />
        ) : data?.data.length ? (
          <ul className="divide-y divide-surface-line/70 rounded-xl border border-surface-line">
            {data.data.map((r) => {
              const tone = r.kind === "payout_sent" ? "text-ink-soft" : r.amountTk > 0 ? "text-success-ink" : "text-warning-ink";
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
                  <span className="w-28 shrink-0 font-mono text-[10px] uppercase text-ink-faint">{tm.ledgerKinds[r.kind]}</span>
                  <Link
                    href={r.ownerType === "club" ? `/dashboard/admin/content/club/${r.ownerId}` : `/dashboard/admin/users/${r.ownerId}`}
                    className="min-w-0 flex-1 truncate text-ink hover:text-accent-ink"
                  >
                    {r.ownerName ?? r.ownerId}
                    {r.counterparty ? <span className="text-ink-faint"> · {r.counterparty}</span> : null}
                  </Link>
                  <span className="text-xs text-ink-faint">{fmtDateTime(r.createdAt, locale)}</span>
                  <span className={`w-24 text-right font-mono font-bold tabular-nums ${tone}`}>
                    {r.kind === "payout_sent" ? "" : r.amountTk > 0 ? "+" : "−"}
                    {tk(Math.abs(r.amountTk))}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyRow>{t.admin.common.noResults}</EmptyRow>
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
