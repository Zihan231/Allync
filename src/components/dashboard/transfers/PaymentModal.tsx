"use client";

import { useState } from "react";
import { format } from "@/lib/i18n/translations";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/api/transfers";
import { CheckIcon, CloseIcon, LockIcon } from "@/components/icons";
import { ModalPortal, tk, useTransferLabels } from "./shared";

const METHOD_STYLE: Record<PaymentMethod, { mark: string; className: string }> = {
  bkash: { mark: "b", className: "bg-[#e2136e] text-white" },
  nagad: { mark: "N", className: "bg-[#f6921e] text-white" },
  card: { mark: "▭", className: "bg-blue text-white" },
};

const errorMessage = (err: unknown) => {
  const data = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data;
  return Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
};

/**
 * Demo checkout: pick bKash / Nagad / Card, pay from the wallet, get a receipt.
 * `onPay` performs the real action (e.g. sending the offer) and returns its
 * transaction ID. Mount only while open.
 */
export function PaymentModal({
  amountTk,
  payeeName,
  purpose,
  balanceTk,
  onPay,
  onClose,
}: {
  amountTk: number;
  payeeName: string;
  purpose: string;
  /** Payer's available balance (shown, and checked before paying). */
  balanceTk: number | null;
  onPay: (method: PaymentMethod) => Promise<string | null>;
  onClose: (paid: boolean) => void;
}) {
  const { tr, method: methodLabel } = useTransferLabels();
  const [method, setMethod] = useState<PaymentMethod>("bkash");
  const [phase, setPhase] = useState<"choose" | "processing" | "done">("choose");
  const [reference, setReference] = useState<string | null>(null);
  const [error, setError] = useState("");
  const short = balanceTk !== null && balanceTk < amountTk;

  async function pay() {
    setError("");
    setPhase("processing");
    try {
      // A short pause so the demo feels like a real payment.
      const [ref] = await Promise.all([onPay(method), new Promise((r) => setTimeout(r, 1200))]);
      setReference(ref);
      setPhase("done");
    } catch (err) {
      setError(errorMessage(err) || tr.errGeneric);
      setPhase("choose");
    }
  }

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <button
        type="button"
        aria-label={tr.close}
        onClick={() => phase !== "processing" && onClose(phase === "done")}
        className="fixed inset-0 cursor-default"
        tabIndex={-1}
      />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-surface-line-strong bg-bg-raised shadow-2xl">
        <header className="flex items-center justify-between border-b border-surface-line px-5 py-3.5">
          <h2 className="flex items-center gap-2 font-display text-base font-black text-ink">
            <LockIcon className="h-4 w-4 text-success-ink" />
            {tr.payTitle}
          </h2>
          {phase !== "processing" ? (
            <button type="button" onClick={() => onClose(phase === "done")} aria-label={tr.close} className="rounded-full p-1.5 text-ink-faint hover:bg-surface-line/60 hover:text-ink">
              <CloseIcon className="h-4 w-4" />
            </button>
          ) : null}
        </header>

        {phase === "done" ? (
          <div className="px-5 py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success text-bg">
              <CheckIcon className="h-7 w-7" />
            </div>
            <p className="mt-4 font-display text-lg font-black text-ink">{tr.paid}</p>
            <p className="mt-1 font-display text-2xl font-black tabular-nums text-accent-ink">{tk(amountTk)}</p>
            <p className="mt-1 text-xs text-ink-soft">
              {tr.payTo}: {payeeName} · {methodLabel[method]}
            </p>
            {reference ? (
              <p className="mt-3 rounded-lg bg-surface/60 px-3 py-2 font-mono text-xs text-ink">
                {tr.txId}: <span className="font-bold">{reference}</span>
              </p>
            ) : null}
            <button type="button" onClick={() => onClose(true)} className="mt-6 w-full rounded-full bg-accent py-2.5 font-display text-sm font-black text-bg">
              {tr.done}
            </button>
          </div>
        ) : (
          <div className="space-y-4 px-5 py-5">
            <div className="rounded-xl bg-surface/60 p-4">
              <div className="flex justify-between text-xs text-ink-soft">
                <span>{tr.payTo}</span>
                <span className="font-semibold text-ink">{payeeName}</span>
              </div>
              <div className="mt-1 flex justify-between text-xs text-ink-soft">
                <span>{tr.payFor}</span>
                <span className="max-w-[60%] truncate text-right font-semibold text-ink">{purpose}</span>
              </div>
              <div className="mt-3 border-t border-surface-line pt-3 text-center font-display text-3xl font-black tabular-nums text-ink">
                {tk(amountTk)}
              </div>
              {balanceTk !== null ? (
                <p className={`mt-1 text-center text-[11px] ${short ? "font-semibold text-danger-ink" : "text-ink-faint"}`}>
                  {tr.available}: {tk(balanceTk)}
                </p>
              ) : null}
            </div>

            <div>
              <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{tr.method}</div>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    disabled={phase === "processing"}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-bold transition-colors ${
                      method === m ? "border-accent bg-accent-soft text-ink" : "border-surface-line text-ink-soft hover:border-surface-line-strong"
                    }`}
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg font-display text-base font-black ${METHOD_STYLE[m].className}`}>
                      {METHOD_STYLE[m].mark}
                    </span>
                    {methodLabel[m]}
                  </button>
                ))}
              </div>
            </div>

            {short ? <p className="text-xs font-semibold text-danger-ink">{tr.insufficient}</p> : null}
            {error ? (
              <p className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-xs font-semibold text-danger-ink" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={pay}
              disabled={phase === "processing" || short}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-success py-3 font-display text-sm font-black text-bg disabled:opacity-50"
            >
              {phase === "processing" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg border-t-transparent" />
                  {tr.paying}
                </>
              ) : (
                format(tr.pay, { amount: amountTk.toLocaleString("en-US") })
              )}
            </button>
            <p className="text-center text-[10px] text-ink-faint">{tr.demoCheckout}</p>
          </div>
        )}
      </div>
    </div>
    </ModalPortal>
  );
}
