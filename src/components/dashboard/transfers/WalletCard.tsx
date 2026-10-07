"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useTopUpWallet } from "@/lib/api/hooks/useTransfers";
import type { WalletView } from "@/lib/api/transfers";
import { formatMatchTime } from "@/components/dashboard/fixtures/labels";
import { PlusIcon, WalletIcon } from "@/components/icons";
import { tk } from "./shared";

/** Demo wallet: available and held balance, "Add demo funds", recent transactions. */
export function WalletCard({
  wallet,
  clubId,
  title,
  onToast,
}: {
  wallet: WalletView;
  /** Set for a club wallet (top-up goes to the club). */
  clubId?: string;
  title?: string;
  onToast?: (message: string, variant?: "success" | "error") => void;
}) {
  const { t, locale } = useLanguage();
  const tr = t.dashboard.transfers;
  const topUp = useTopUpWallet();

  const kindLabel = {
    top_up: tr.txTopUp,
    hold: tr.txHold,
    refund: tr.txRefund,
    payout_sent: tr.txPayout,
    received: tr.txReceived,
    adjustment: tr.txAdjustment,
    reversal: tr.txReversal,
  } as const;

  async function addFunds() {
    try {
      const before = wallet.balanceTk;
      const next = await topUp.mutateAsync(clubId);
      onToast?.(format(tr.toppedUp, { amount: next.balanceTk - before }), "success");
    } catch {
      onToast?.(tr.errGeneric, "error");
    }
  }

  return (
    <section className="rounded-2xl border border-surface-line bg-surface/50 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-display text-base font-black text-ink">
          <WalletIcon className="h-4 w-4 text-accent-ink" />
          {title ?? tr.walletTitle}
        </h3>
        <button
          type="button"
          onClick={addFunds}
          disabled={topUp.isPending}
          className="inline-flex items-center gap-1 rounded-full border border-accent/50 bg-accent-soft px-3 py-1 text-xs font-bold text-accent-ink transition-colors hover:bg-accent hover:text-bg disabled:opacity-50"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          {tr.addFunds}
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-bg/60 p-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{tr.available}</div>
          <div className="mt-1 font-display text-2xl font-black tabular-nums text-ink">{tk(wallet.balanceTk)}</div>
        </div>
        <div className="rounded-xl bg-bg/60 p-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{tr.held}</div>
          <div className="mt-1 font-display text-2xl font-black tabular-nums text-warning-ink">{tk(wallet.heldTk)}</div>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-ink-faint">{tr.demoNote}</p>

      <ul className="mt-3 divide-y divide-surface-line/70">
        {wallet.transactions.length ? (
          wallet.transactions.slice(0, 8).map((tx) => {
            // Staff adjustments and reversals can go either way, so the sign decides.
            const positive = tx.kind !== "payout_sent" && tx.amountTk > 0;
            return (
              <li key={tx.id} className="flex items-center justify-between gap-3 py-2 text-xs">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-ink">
                    {kindLabel[tx.kind]}
                    {tx.counterparty && tx.kind !== "top_up" ? <span className="font-normal text-ink-soft"> · {tx.counterparty}</span> : null}
                  </div>
                  <div className="font-mono text-[10px] text-ink-faint">
                    {formatMatchTime(tx.createdAt, locale)}
                    {tx.reference ? ` · ${tx.reference}` : ""}
                  </div>
                </div>
                <span
                  className={`shrink-0 font-mono font-bold tabular-nums ${
                    tx.kind === "payout_sent" ? "text-ink-soft" : positive ? "text-success-ink" : "text-warning-ink"
                  }`}
                >
                  {tx.kind === "payout_sent" ? "" : positive ? "+" : "−"}
                  {tk(Math.abs(tx.amountTk))}
                </span>
              </li>
            );
          })
        ) : (
          <li className="py-3 text-center text-xs text-ink-faint">{tr.noTx}</li>
        )}
      </ul>
    </section>
  );
}
