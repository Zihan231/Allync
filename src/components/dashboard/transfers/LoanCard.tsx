"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useBuyLoan, useCancelLoan, useCounterLoan, useLoan, useRespondLoan } from "@/lib/api/hooks/useTransfers";
import type { Loan, LoanEndReason, LoanParty, LoanStatus, PaymentMethod } from "@/lib/api/transfers";
import { Avatar } from "@/components/common/Avatar";
import { formatMatchTime, formatShortDate } from "@/components/dashboard/fixtures/labels";
import { ArrowRightIcon } from "@/components/icons";
import { digits } from "./MakeOfferModal";
import { PaymentModal } from "./PaymentModal";
import { CommitmentNotice, PAYMENT_CLASSES, tk, useTransferLabels } from "./shared";

const errorMessage = (err: unknown) => {
  const data = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data;
  return Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
};

const STATUS_CLASSES: Record<LoanStatus, string> = {
  pending: "bg-warning-soft text-warning-ink",
  scheduled: "bg-blue-soft text-blue-ink",
  active: "bg-accent-soft text-accent-ink",
  returning: "bg-blue-soft text-blue-ink",
  completed: "bg-success-soft text-success-ink",
  declined: "bg-danger-soft text-danger-ink",
  cancelled: "bg-surface-line text-ink-faint",
  expired: "bg-surface-line text-ink-faint",
};

/**
 * One loan, seen from a club page. The club whose turn it is accepts, rejects (with a
 * warning) or counters the fee; the other club can withdraw. While he's on loan the
 * borrowing club can buy him. `canAct`: the viewer leads `viewerClubId`.
 */
export function LoanCard({
  loan,
  viewerClubId,
  canAct,
  balanceTk = null,
  onToast,
}: {
  loan: Loan;
  viewerClubId: string;
  canAct: boolean;
  /** The viewer club's available balance (when it's the borrowing club and pays). */
  balanceTk?: number | null;
  onToast?: (message: string, variant?: "success" | "error") => void;
}) {
  const { t, locale } = useLanguage();
  const { tr, payment: paymentLabel } = useTransferLabels();
  const respond = useRespondLoan();
  const counter = useCounterLoan();
  const cancel = useCancelLoan();
  const buy = useBuyLoan();
  const [mode, setMode] = useState<"idle" | "counter" | "confirmReject" | "confirmBuy">("idle");
  const [amount, setAmount] = useState("");
  const [showBids, setShowBids] = useState(false);
  const [paying, setPaying] = useState<{ amountTk: number; run: (method: PaymentMethod) => Promise<string | null> } | null>(null);
  const [error, setError] = useState("");
  const { data: detail } = useLoan(showBids ? loan.id : null);

  const party: LoanParty = viewerClubId === loan.parentClub.id ? "parent" : "borrower";
  const pending = loan.status === "pending";
  const myTurn = canAct && pending && loan.turn === party;
  const canWithdraw = canAct && pending && loan.turn !== party;
  const running = loan.status === "active" || loan.status === "returning";
  const canBuy = canAct && running && party === "borrower" && loan.buyPriceTk !== null;
  const busy = respond.isPending || counter.isPending || cancel.isPending || buy.isPending;
  const answering = loan.turn === "parent" ? loan.parentClub.name : loan.borrowClub.name;

  const statusLabel: Record<LoanStatus, string> = {
    pending: tr.loanStatusPending,
    scheduled: tr.loanStatusScheduled,
    active: tr.loanStatusActive,
    returning: tr.loanStatusReturning,
    completed: tr.loanStatusCompleted,
    declined: tr.loanStatusDeclined,
    cancelled: tr.loanStatusCancelled,
    expired: tr.loanStatusExpired,
  };
  const endLabel: Record<LoanEndReason, string> = {
    matches: tr.loanEndMatches,
    time: tr.loanEndTime,
    bought: tr.loanEndBought,
    staff: tr.loanEndStaff,
    club_deleted: tr.loanEndStaff,
  };

  async function run(action: () => Promise<unknown>, toast: string) {
    setError("");
    try {
      await action();
      onToast?.(toast, "success");
      setMode("idle");
    } catch (err) {
      setError(errorMessage(err) || tr.errGeneric);
    }
  }

  function accept() {
    // The borrowing club pays what it doesn't hold yet.
    const extra = party === "borrower" ? Math.max(0, loan.feeTk - loan.heldTk) : 0;
    if (extra > 0) {
      setPaying({
        amountTk: extra,
        run: async (method) => (await respond.mutateAsync({ loanId: loan.id, accept: true, paymentMethod: method })).paymentRef,
      });
      return;
    }
    void run(() => respond.mutateAsync({ loanId: loan.id, accept: true }), tr.acceptedToast);
  }

  function sendCounter() {
    const feeTk = Number(amount || 0);
    if (feeTk === loan.feeTk) return setError(tr.sameAmount);
    if (party === "borrower" && feeTk > loan.heldTk) {
      setPaying({
        amountTk: feeTk - loan.heldTk,
        run: async (method) => {
          const result = await counter.mutateAsync({ loanId: loan.id, feeTk, paymentMethod: method });
          onToast?.(tr.counteredToast, "success");
          setMode("idle");
          return result.paymentRef;
        },
      });
      return;
    }
    void run(() => counter.mutateAsync({ loanId: loan.id, feeTk }), tr.counteredToast);
  }

  function buyNow() {
    const price = loan.buyPriceTk ?? 0;
    if (price > 0) {
      setPaying({
        amountTk: price,
        run: async (method) => {
          await buy.mutateAsync({ loanId: loan.id, paymentMethod: method });
          onToast?.(tr.loanBoughtToast, "success");
          setMode("idle");
          return null;
        },
      });
      return;
    }
    void run(() => buy.mutateAsync({ loanId: loan.id }), tr.loanBoughtToast);
  }

  const button = "rounded-full px-3.5 py-1.5 text-xs font-bold disabled:opacity-50";

  return (
    <li className="rounded-xl border border-surface-line bg-surface/50 p-3.5">
      <div className="flex items-start gap-3">
        <Avatar dpUrl={loan.player.dpUrl} name={loan.player.name} size="md" mode="static" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-bold text-ink">{loan.player.name}</span>
            <span className={`rounded-full px-2 py-px text-[10px] font-bold ${STATUS_CLASSES[loan.status]}`}>{statusLabel[loan.status]}</span>
            {loan.endReason && loan.status === "completed" ? (
              <span className="rounded-full bg-surface-line px-2 py-px text-[10px] font-bold text-ink-faint">{endLabel[loan.endReason]}</span>
            ) : null}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-faint">
            {loan.parentClub.name}
            <ArrowRightIcon className="h-3 w-3" />
            {loan.borrowClub.name}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="font-mono font-bold text-ink">{tk(loan.feeTk)}</span>
            {loan.paymentStatus === "held" ? (
              <span className="text-warning-ink">{format(tr.heldNote, { amount: loan.heldTk.toLocaleString("en-US") })}</span>
            ) : loan.paymentStatus !== "none" ? (
              <span className={`rounded-full px-2 py-px text-[10px] font-bold ${PAYMENT_CLASSES[loan.paymentStatus]}`}>{paymentLabel[loan.paymentStatus]}</span>
            ) : null}
            <span className="text-ink-soft">{format(tr.loanTerms, { matches: loan.matches, days: loan.maxDays })}</span>
            {pending ? <span className="text-ink-faint">{format(tr.expires, { time: formatMatchTime(loan.expiresAt, locale) })}</span> : null}
          </div>
          {pending ? (
            <p className={`mt-1 text-[11px] font-semibold ${myTurn ? "text-accent-ink" : "text-ink-faint"}`}>
              {myTurn ? tr.yourTurn : format(tr.waitingFor, { name: answering })}
            </p>
          ) : null}
          {running ? (
            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-line">
                <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (loan.matchesPlayed / loan.matches) * 100)}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-ink-faint">
                <span>{format(tr.loanProgress, { played: loan.matchesPlayed, total: loan.matches })}</span>
                {loan.endsBy ? <span>{format(tr.loanEndsBy, { date: formatShortDate(loan.endsBy, locale) })}</span> : null}
              </div>
            </div>
          ) : null}
          {loan.message ? <p className="mt-1.5 line-clamp-2 text-xs italic text-ink-soft">“{loan.message}”</p> : null}
        </div>
      </div>

      {loan.scheduledTournament ? (
        <div className="mt-3">
          <CommitmentNotice commitment={loan.scheduledTournament} playerName={loan.player.name} />
        </div>
      ) : null}

      {showBids && detail ? (
        <ol className="mt-3 space-y-1 rounded-lg bg-bg/50 p-2.5 text-xs">
          {detail.bids.map((b, i) => (
            <li key={b.id} className="flex flex-wrap gap-x-2">
              <span className="font-mono text-[10px] font-bold uppercase text-ink-faint">{i === 0 ? tr.bidOpening : tr.bidCounter}</span>
              <span className="font-semibold text-ink">{b.party === "parent" ? loan.parentClub.name : loan.borrowClub.name}</span>
              <span className="font-mono font-bold text-ink">{tk(b.feeTk)}</span>
              <span className="text-ink-faint">{formatMatchTime(b.createdAt, locale)}</span>
              {b.message ? <span className="w-full italic text-ink-soft">“{b.message}”</span> : null}
            </li>
          ))}
        </ol>
      ) : null}

      {mode === "counter" ? (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="block w-36">
            <span className="text-[11px] font-semibold text-ink-soft">{tr.loanFeeLabel}</span>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(digits(e.target.value))}
              className="mt-1 w-full rounded-lg border border-surface-line bg-bg px-3 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <button type="button" onClick={() => setMode("idle")} disabled={busy} className={`${button} border border-surface-line-strong text-ink-soft`}>
            {tr.cancel}
          </button>
          <button type="button" onClick={sendCounter} disabled={busy || amount === ""} className={`${button} bg-accent text-bg`}>
            {tr.sendCounter}
          </button>
        </div>
      ) : null}

      {mode === "confirmReject" ? (
        <div className="mt-3 space-y-2">
          <p className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-xs font-semibold text-danger-ink">{tr.rejectWarning}</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setMode("idle")} disabled={busy} className={`${button} border border-surface-line-strong text-ink-soft`}>
              {tr.keepNegotiating}
            </button>
            <button
              type="button"
              onClick={() => run(() => respond.mutateAsync({ loanId: loan.id, accept: false }), tr.declinedToast)}
              disabled={busy}
              className={`${button} bg-danger text-bg`}
            >
              {tr.confirmReject}
            </button>
          </div>
        </div>
      ) : null}

      {mode === "confirmBuy" ? (
        <div className="mt-3 space-y-2">
          <p className="rounded-lg bg-surface/60 px-3 py-2 text-xs text-ink-soft">{format(tr.loanBuyHint, { club: loan.parentClub.name })}</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setMode("idle")} disabled={busy} className={`${button} border border-surface-line-strong text-ink-soft`}>
              {tr.cancel}
            </button>
            <button type="button" onClick={buyNow} disabled={busy} className={`${button} bg-accent text-bg`}>
              {format(tr.loanBuy, { amount: tk(loan.buyPriceTk ?? 0) })}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-xs font-semibold text-danger-ink" role="alert">
          {error}
        </p>
      ) : null}

      {mode === "idle" ? (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          {canAct ? (
            <button type="button" onClick={() => setShowBids((v) => !v)} className={`${button} text-ink-soft hover:text-ink`}>
              {tr.negotiation}
            </button>
          ) : null}
          {canWithdraw ? (
            <button
              type="button"
              onClick={() => run(() => cancel.mutateAsync(loan.id), tr.withdrawnToast)}
              disabled={busy}
              className={`${button} border border-surface-line-strong text-ink-soft hover:text-ink`}
            >
              {tr.withdraw}
            </button>
          ) : null}
          {myTurn ? (
            <>
              <button type="button" onClick={() => setMode("confirmReject")} disabled={busy} className={`${button} border border-surface-line-strong text-ink-soft hover:text-ink`}>
                {tr.decline}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAmount(String(loan.feeTk));
                  setMode("counter");
                }}
                disabled={busy}
                className={`${button} border border-accent/50 text-accent-ink hover:bg-accent hover:text-bg`}
              >
                {tr.counter}
              </button>
              <button type="button" onClick={accept} disabled={busy} className={`${button} bg-accent text-bg`}>
                {party === "borrower" && loan.feeTk > loan.heldTk ? `${tr.accept} · ${tk(loan.feeTk - loan.heldTk)}` : tr.accept}
              </button>
            </>
          ) : null}
          {canBuy ? (
            <button type="button" onClick={() => setMode("confirmBuy")} disabled={busy} className={`${button} border border-accent/50 text-accent-ink hover:bg-accent hover:text-bg`}>
              {format(tr.loanBuy, { amount: tk(loan.buyPriceTk ?? 0) })}
            </button>
          ) : null}
        </div>
      ) : null}

      {paying ? (
        <PaymentModal
          amountTk={paying.amountTk}
          payeeName={loan.parentClub.name}
          purpose={`${t.dashboard.transfers.loansTitle} · ${loan.player.name}`}
          balanceTk={balanceTk}
          onPay={paying.run}
          onClose={() => setPaying(null)}
        />
      ) : null}
    </li>
  );
}
