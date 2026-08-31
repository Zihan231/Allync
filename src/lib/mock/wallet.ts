import type { WalletTransaction } from "./types";

export const mockWalletTransactions: WalletTransaction[] = [
  { id: "tx-1", label: "Quarter-final Clash — entry fee", amountBdt: -500, type: "entry_fee", date: "2026-08-27" },
  { id: "tx-2", label: "Prize payout — August 5v5 Cup", amountBdt: 3200, type: "prize_payout", date: "2026-08-20" },
  { id: "tx-3", label: "Platform commission (5%)", amountBdt: -168, type: "commission", date: "2026-08-20" },
  { id: "tx-4", label: "Wallet top-up (bKash)", amountBdt: 2000, type: "topup", date: "2026-08-10" },
];
