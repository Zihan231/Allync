import type { WalletTransaction } from "@/lib/mock/types";

export function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const positive = tx.amountBdt > 0;
  return (
    <div className="flex items-center justify-between rounded-lg border border-surface-line bg-bg-raised px-4 py-3">
      <div>
        <div className="text-sm text-ink">{tx.label}</div>
        <div className="text-xs text-ink-faint">{tx.date}</div>
      </div>
      <div className={`font-mono text-sm font-semibold ${positive ? "text-success-ink" : "text-ink-soft"}`}>
        {positive ? "+" : ""}৳ {tx.amountBdt.toLocaleString()}
      </div>
    </div>
  );
}
