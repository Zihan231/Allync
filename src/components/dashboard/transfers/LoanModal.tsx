"use client";

import { useState } from "react";
import { format } from "@/lib/i18n/translations";
import { useCreateLoan, useMyTransfers, usePlayerTransferStatus } from "@/lib/api/hooks/useTransfers";
import { useClub } from "@/lib/api/hooks/useClubs";
import type { PaymentMethod } from "@/lib/api/transfers";
import { useMockClubs } from "@/lib/mock/communityStore";
import { ArrowRightIcon, CloseIcon } from "@/components/icons";
import { Avatar } from "@/components/common/Avatar";
import { digits } from "./MakeOfferModal";
import { PaymentModal } from "./PaymentModal";
import { ModalPortal, TransferFeeBadge, tk, useTransferLabels } from "./shared";

const errorMessage = (err: unknown) => {
  const data = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data;
  return Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
};

/**
 * Loan proposal from a club leader: "borrow" another club's player (your club pays
 * the fee now, into a hold), or "lend" your own player to a club you pick (that
 * club pays when it accepts). Mount only while open.
 */
export function LoanModal({
  mode,
  clubId,
  clubBalanceTk,
  player,
  parentClubName,
  onClose,
  onToast,
}: {
  mode: "borrow" | "lend";
  /** The club you lead. */
  clubId: string;
  clubBalanceTk: number | null;
  player: { id: string; name: string };
  /** Borrowing: the club he plays for (receives the fee). */
  parentClubName?: string;
  onClose: () => void;
  onToast?: (message: string, variant?: "success" | "error") => void;
}) {
  const { tr } = useTransferLabels();
  const create = useCreateLoan();
  const { data: mine } = useMyTransfers();
  const clubs = useMockClubs();
  const maxMatches = mine?.settings.maxLoanMatches ?? 10;
  const maxDays = mine?.settings.maxLoanDays ?? 60;

  const [otherClubId, setOtherClubId] = useState("");
  const [fee, setFee] = useState("0");
  const [matches, setMatches] = useState("3");
  const [days, setDays] = useState("30");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  const feeTk = Number(fee || 0);

  // The two clubs: his club (keeps his contract) and the club that borrows him.
  const { data: status } = usePlayerTransferStatus(player.id);
  const parentId = mode === "borrow" ? (status?.clubId ?? "") : clubId;
  const borrowerId = mode === "borrow" ? clubId : otherClubId;
  const { data: parentClub } = useClub(parentId);
  const { data: borrowClub } = useClub(borrowerId);
  const title = format(mode === "borrow" ? tr.loanRequestTitle : tr.loanOutTitle, { player: player.name });

  async function send(paymentMethod?: PaymentMethod): Promise<string | null> {
    const loan = await create.mutateAsync({
      clubId,
      playerUserId: player.id,
      otherClubId: mode === "lend" ? otherClubId : undefined,
      feeTk,
      matches: Number(matches || 0),
      maxDays: Number(days || 0),
      message: message.trim() || undefined,
      paymentMethod,
    });
    onToast?.(tr.sentToast, "success");
    return loan.paymentRef;
  }

  async function submit() {
    setError("");
    if (mode === "lend" && !otherClubId) return setError(tr.pickClub);
    if (mode === "borrow" && feeTk > 0) {
      setPaying(true);
      return;
    }
    try {
      await send();
      onClose();
    } catch (err) {
      setError(errorMessage(err) || tr.errGeneric);
    }
  }

  const field = "w-full rounded-lg border border-surface-line bg-bg px-3 py-2.5 font-mono text-sm text-ink outline-none focus:border-accent";

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-[8vh] backdrop-blur-md">
        <button type="button" aria-label={tr.close} onClick={onClose} className="fixed inset-0 cursor-default" tabIndex={-1} />
        <div role="dialog" aria-modal="true" className="relative w-full max-w-md rounded-2xl border border-surface-line-strong bg-bg-raised shadow-2xl">
          <header className="flex items-center justify-between border-b border-surface-line px-5 py-3.5">
            <h2 className="font-display text-base font-black text-ink">{title}</h2>
            <button type="button" onClick={onClose} aria-label={tr.close} className="rounded-full p-1.5 text-ink-faint hover:bg-surface-line/60 hover:text-ink">
              <CloseIcon className="h-4 w-4" />
            </button>
          </header>

          <div className="space-y-4 px-5 py-5">
            {/* Clubs: who lends him to whom, his contract, and the paying club's wallet */}
            <div className="rounded-xl border border-surface-line bg-surface/40 p-3">
              <div className="flex items-center gap-2">
                {(
                  [
                    [tr.loanFromLabel, parentClub, parentClubName ?? tr.hisClub],
                    [tr.loanToLabel, borrowClub, mode === "lend" ? tr.pickClub : ""],
                  ] as const
                ).map(([label, c, fallback], i) => (
                  <div key={label} className="flex min-w-0 flex-1 items-center gap-2">
                    {i === 1 ? <ArrowRightIcon className="h-4 w-4 shrink-0 text-ink-faint" /> : null}
                    {c ? <Avatar dpUrl={c.dpUrl} name={c.name} size="sm" mode="static" shape="square" /> : null}
                    <div className="min-w-0">
                      <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-ink-faint">{label}</div>
                      <div className="truncate text-sm font-semibold text-ink">{c?.name ?? fallback}</div>
                      {c ? <div className="text-[10px] text-ink-faint">{format(tr.loanClubPoints, { points: c.points.toLocaleString() })}</div> : null}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-surface-line pt-2.5 text-xs">
                <span className="flex items-center gap-1.5 text-ink-soft">
                  {tr.loanContractLabel}
                  {status?.contract ? <TransferFeeBadge contract={status.contract} compact /> : <span className="text-ink-faint">—</span>}
                </span>
                {mode === "borrow" && clubBalanceTk !== null ? (
                  <span className={clubBalanceTk < feeTk ? "font-semibold text-danger-ink" : "text-ink-soft"}>
                    {format(tr.loanWallet, { amount: tk(clubBalanceTk) })}
                  </span>
                ) : null}
              </div>
            </div>

            {mode === "lend" ? (
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft">{tr.loanToClub}</span>
                <select
                  value={otherClubId}
                  onChange={(e) => setOtherClubId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-surface-line bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-accent [color-scheme:dark]"
                >
                  <option value="">{tr.pickClub}</option>
                  {[...clubs]
                    .filter((c) => c.id !== clubId)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </label>
            ) : null}

            <label className="block">
              <span className="text-xs font-semibold text-ink-soft">{tr.loanFeeLabel}</span>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-faint">৳</span>
                <input type="text" inputMode="numeric" value={fee} onChange={(e) => setFee(digits(e.target.value))} className={`${field} pl-8`} />
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft">{tr.loanMatchesLabel}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={matches}
                  onChange={(e) => setMatches(digits(e.target.value).slice(0, 3))}
                  className={`mt-1.5 ${field}`}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft">{tr.loanDaysLabel}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={days}
                  onChange={(e) => setDays(digits(e.target.value).slice(0, 3))}
                  className={`mt-1.5 ${field}`}
                />
              </label>
            </div>
            <p className="-mt-2 text-[11px] text-ink-faint">{format(tr.loanLimits, { matches: maxMatches, days: maxDays })}</p>

            <label className="block">
              <span className="text-xs font-semibold text-ink-soft">{tr.messageLabel}</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                maxLength={500}
                className="mt-1.5 w-full rounded-lg border border-surface-line bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
            </label>

            <p className="rounded-lg bg-surface/60 px-3 py-2 text-xs leading-relaxed text-ink-soft">
              {tr.loanHint} {mode === "borrow" ? tr.loanHintPay : ""}
            </p>

            {error ? (
              <p className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-xs font-semibold text-danger-ink" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={submit}
              disabled={create.isPending}
              className="w-full rounded-full bg-accent py-2.5 font-display text-sm font-black text-bg disabled:opacity-50"
            >
              {mode === "borrow" && feeTk > 0 ? `${tr.continueToPayment} · ${tk(feeTk)}` : tr.sendLoan}
            </button>
          </div>
        </div>

        {paying ? (
          <PaymentModal
            amountTk={feeTk}
            payeeName={parentClubName ?? player.name}
            purpose={title}
            balanceTk={clubBalanceTk}
            onPay={(method) => send(method)}
            onClose={(paid) => {
              setPaying(false);
              if (paid) onClose();
            }}
          />
        ) : null}
      </div>
    </ModalPortal>
  );
}
