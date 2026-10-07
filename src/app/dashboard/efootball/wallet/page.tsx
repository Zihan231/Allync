"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useMyTransfers, useTopUpWallet, useWalletHistory } from "@/lib/api/hooks/useTransfers";
import type { WalletTxKind } from "@/lib/api/transfers";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatTile } from "@/components/dashboard/StatTile";
import { Pagination } from "@/components/dashboard/Pagination";
import { ContractDocument } from "@/components/dashboard/transfers/ContractDocument";
import { tk } from "@/components/dashboard/transfers/shared";
import { formatMatchTime } from "@/components/dashboard/fixtures/labels";
import { ArrowRightIcon, ClockIcon, LockIcon, PlusIcon, ShieldIcon, SwapIcon, UsersIcon, WalletIcon } from "@/components/icons";

const PAGE_SIZE = 15;
const FILTERS: Array<WalletTxKind | undefined> = [undefined, "received", "payout_sent", "hold", "refund", "top_up"];

/**
 * Demo wallet: balance, held money and totals, with the full transaction
 * history. Club Presidents / GSs can switch to their club's wallet.
 */
export default function WalletPage() {
  const { t, locale } = useLanguage();
  const tr = t.dashboard.transfers;
  const { toasts, toast, dismiss } = useToast();

  // Whether he leads a club comes from the server (the saved session can be out of date).
  const { data: me } = useMyTransfers();
  const leadsClub = Boolean(me?.clubId && (me.clubRole === "President" || me.clubRole === "General Secretary"));
  // Club leaders start on the club wallet (that's where transfer money moves); others on their own.
  const [chosen, setChosen] = useState<"me" | "club" | null>(null);
  const scope = chosen ?? (leadsClub ? "club" : "me");
  const clubId = scope === "club" && leadsClub ? me!.clubId! : undefined;
  // Balances for the two wallet cards.
  const { data: mine } = useWalletHistory({ limit: 1 });
  const { data: club } = useWalletHistory({ clubId: me?.clubId ?? undefined, limit: 1 }, leadsClub);
  const [kind, setKind] = useState<WalletTxKind | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [contractId, setContractId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useWalletHistory({ clubId, kind, page, limit: PAGE_SIZE });
  const topUp = useTopUpWallet();

  const kindLabel: Record<WalletTxKind, string> = {
    top_up: tr.txTopUp,
    hold: tr.txHold,
    refund: tr.txRefund,
    payout_sent: tr.txPayout,
    received: tr.txReceived,
  };
  const filterLabel = (k: WalletTxKind | undefined) =>
    !k
      ? tr.filterAll
      : { received: tr.filterReceived, payout_sent: tr.filterPaid, hold: tr.filterHeld, refund: tr.filterRefund, top_up: tr.filterTopUp }[k];
  const kindIcon = (k: WalletTxKind) =>
    k === "top_up" ? PlusIcon : k === "hold" ? LockIcon : k === "refund" ? ClockIcon : k === "received" ? WalletIcon : SwapIcon;

  async function addFunds() {
    try {
      const before = data?.balanceTk ?? 0;
      const next = await topUp.mutateAsync(clubId);
      toast(format(tr.toppedUp, { amount: next.balanceTk - before }), "success");
    } catch {
      toast(tr.errGeneric, "error");
    }
  }

  const switchScope = (next: "me" | "club") => {
    setChosen(next);
    setKind(undefined);
    setPage(1);
  };

  return (
    <div>
      <PageHeader eyebrow="eFootball" title={t.dashboard.shell.navWallet} />

      {leadsClub ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2" role="tablist">
          {(["club", "me"] as const).map((s) => {
            const active = scope === s;
            const summary = s === "club" ? club : mine;
            const Icon = s === "club" ? ShieldIcon : UsersIcon;
            return (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchScope(s)}
                className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
                  active ? "border-accent bg-accent-soft/40 ring-1 ring-accent/40" : "border-surface-line bg-surface/50 hover:border-surface-line-strong"
                }`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    active ? "bg-accent text-bg" : "bg-surface-line text-ink-soft"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-ink">
                    {s === "me" ? tr.myWallet : format(tr.clubWallet, { club: me?.clubName ?? "" })}
                  </span>
                  <span className="block font-mono text-[11px] text-ink-faint">
                    {tr.available}
                    {summary?.heldTk ? ` · ${tr.held} ${tk(summary.heldTk)}` : ""}
                  </span>
                </span>
                <span className="font-display text-xl font-black tabular-nums text-ink">{summary ? tk(summary.balanceTk) : "–"}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label={tr.available} value={data ? tk(data.balanceTk) : "–"} icon={WalletIcon} />
        <StatTile label={tr.held} value={data ? tk(data.heldTk) : "–"} icon={LockIcon} />
        <StatTile label={tr.totalReceived} value={data ? tk(data.totals.receivedTk) : "–"} icon={ArrowRightIcon} />
        <StatTile label={tr.totalPaid} value={data ? tk(data.totals.paidTk) : "–"} icon={SwapIcon} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink-faint">
          {tr.demoNote} {data?.heldTk ? tr.heldHint : ""}
        </p>
        <button
          type="button"
          onClick={addFunds}
          disabled={topUp.isPending}
          className="inline-flex items-center gap-1.5 rounded-full border border-accent/50 bg-accent-soft px-4 py-1.5 text-xs font-bold text-accent-ink transition-colors hover:bg-accent hover:text-bg disabled:opacity-50"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          {tr.addFunds}
        </button>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-base font-black text-ink">{tr.walletHistoryTitle}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {FILTERS.map((k) => (
            <button
              key={k ?? "all"}
              type="button"
              onClick={() => {
                setKind(k);
                setPage(1);
              }}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                kind === k ? "border-accent bg-accent-soft text-accent-ink" : "border-surface-line-strong text-ink-soft hover:text-ink"
              }`}
            >
              {filterLabel(k)}
            </button>
          ))}
        </div>

        <div className={`mt-4 transition-opacity ${isFetching && !isLoading ? "opacity-60" : ""}`}>
          {isLoading ? (
            <div className="h-48 animate-pulse rounded-xl border border-surface-line bg-surface/40" />
          ) : data && data.data.length ? (
            <>
              <ul className="divide-y divide-surface-line/70 rounded-xl border border-surface-line bg-surface/40">
                {data.data.map((tx) => {
                  const Icon = kindIcon(tx.kind);
                  const incoming = tx.kind === "top_up" || tx.kind === "refund" || tx.kind === "received";
                  const neutral = tx.kind === "payout_sent";
                  return (
                    <li key={tx.id} className="flex items-center gap-3 px-4 py-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          neutral ? "bg-surface-line text-ink-soft" : incoming ? "bg-success-soft text-success-ink" : "bg-warning-soft text-warning-ink"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-ink">
                          {kindLabel[tx.kind]}
                          {tx.counterparty && tx.kind !== "top_up" ? <span className="font-normal text-ink-soft"> · {tx.counterparty}</span> : null}
                        </div>
                        <div className="truncate font-mono text-[11px] text-ink-faint">
                          {formatMatchTime(tx.createdAt, locale)}
                          {tx.reference ? ` · ${tx.reference}` : ""}
                        </div>
                      </div>
                      {tx.offerId ? (
                        <button
                          type="button"
                          onClick={() => setContractId(tx.offerId)}
                          className="hidden shrink-0 text-[11px] font-bold text-accent-ink hover:underline sm:block"
                        >
                          {tr.viewContract}
                        </button>
                      ) : null}
                      <span
                        className={`w-24 shrink-0 text-right font-mono text-sm font-bold tabular-nums ${
                          neutral ? "text-ink-soft" : incoming ? "text-success-ink" : "text-warning-ink"
                        }`}
                      >
                        {neutral ? "" : incoming ? "+" : "−"}
                        {tk(Math.abs(tx.amountTk))}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {data.meta.totalPages > 1 ? (
                <div className="mt-4">
                  <Pagination page={page} pageCount={data.meta.totalPages} onPageChange={setPage} />
                </div>
              ) : null}
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-surface-line p-6 text-center text-sm text-ink-faint">
              {kind ? tr.noTxFiltered : tr.noTx}
            </p>
          )}
        </div>
      </section>

      {contractId ? <ContractDocument offerId={contractId} onClose={() => setContractId(null)} onToast={toast} /> : null}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
