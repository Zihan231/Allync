"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import {
  useContractDocument,
  useCounterTransferOffer,
  useMyTransfers,
  useOfferBids,
  useRespondTransferOffer,
} from "@/lib/api/hooks/useTransfers";
import type { PaymentMethod } from "@/lib/api/transfers";
import { Avatar } from "@/components/common/Avatar";
import { formatMatchTime, formatShortDate } from "@/components/dashboard/fixtures/labels";
import { CloseIcon } from "@/components/icons";
import { digits } from "./MakeOfferModal";
import { PaymentModal } from "./PaymentModal";
import { CommitmentNotice, ModalPortal, tk, useTransferLabels } from "./shared";

const errorMessage = (err: unknown) => {
  const data = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data;
  return Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
};

/**
 * The transfer agreement: parties, terms and clauses, negotiation, payment and
 * signatures, styled like a printed contract. Opened by the side whose turn it is
 * (`signAs`) to accept, reject or counter a pending offer, or to view any deal.
 * Mount only while open.
 */
export function ContractDocument({
  offerId,
  signAs,
  balanceTk = null,
  onClose,
  onToast,
}: {
  offerId: string;
  /** Who is answering now, if it's the viewer's turn on this offer. */
  signAs?: "player" | "club";
  /** The club's available balance, when the club signs and pays. */
  balanceTk?: number | null;
  onClose: () => void;
  onToast?: (message: string, variant?: "success" | "error") => void;
}) {
  const { locale } = useLanguage();
  const { tr, kind: kindLabel, method: methodLabel, status: statusLabel } = useTransferLabels();
  const { data: doc, isLoading } = useContractDocument(offerId);
  const respond = useRespondTransferOffer();
  const counter = useCounterTransferOffer();
  const { data: bids } = useOfferBids(offerId);
  const { data: mine } = useMyTransfers();
  const expiryDays = mine?.settings.offerExpiryDays ?? 3;
  // The club pays only what it doesn't already hold for this deal.
  const [paying, setPaying] = useState<{ amountTk: number; run: (method: PaymentMethod) => Promise<string | null> } | null>(null);
  const [mode, setMode] = useState<"answer" | "counter" | "confirmReject">("answer");
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [error, setError] = useState("");

  const offer = doc?.offer;
  const canSign = Boolean(signAs && offer?.status === "pending" && offer.turn === signAs);
  const extraToSign = signAs === "club" && offer ? Math.max(0, offer.amountTk - offer.heldTk) : 0;
  const busy = respond.isPending || counter.isPending;
  const payeeName = offer ? (offer.payeeType === "club" ? (offer.fromClub?.name ?? "—") : offer.player.name) : "";
  const dateTime = (iso: string | null | undefined) => (iso ? formatMatchTime(iso, locale) : "—");
  const date = (iso: string | null | undefined) => (iso ? formatShortDate(iso, locale) : tr.datesOnSigning);

  async function accept(method?: PaymentMethod): Promise<string | null> {
    const result = await respond.mutateAsync({ offerId, accept: true, paymentMethod: method });
    onToast?.(tr.acceptedToast, "success");
    return result.paymentRef;
  }

  async function signNow() {
    setError("");
    if (extraToSign > 0) {
      setPaying({ amountTk: extraToSign, run: (method) => accept(method) });
      return;
    }
    try {
      await accept();
      onClose();
    } catch (err) {
      setError(errorMessage(err) || tr.errGeneric);
    }
  }

  async function sendCounter(amountTk: number, method?: PaymentMethod): Promise<string | null> {
    const result = await counter.mutateAsync({ offerId, amountTk, message: counterMessage.trim() || undefined, paymentMethod: method });
    onToast?.(tr.counteredToast, "success");
    return result.paymentRef;
  }

  async function submitCounter() {
    setError("");
    if (!offer) return;
    const amountTk = Number(counterAmount || 0);
    if (amountTk === offer.amountTk) {
      setError(tr.sameAmount);
      return;
    }
    // A club counter goes into the hold now: pay the difference first if it's more than held.
    if (signAs === "club" && amountTk > offer.heldTk) {
      setPaying({ amountTk: amountTk - offer.heldTk, run: (method) => sendCounter(amountTk, method) });
      return;
    }
    try {
      await sendCounter(amountTk);
      onClose();
    } catch (err) {
      setError(errorMessage(err) || tr.errGeneric);
    }
  }

  async function decline() {
    setError("");
    try {
      await respond.mutateAsync({ offerId, accept: false });
      onToast?.(tr.declinedToast, "success");
      onClose();
    } catch (err) {
      setError(errorMessage(err) || tr.errGeneric);
    }
  }

  const status = !offer
    ? ""
    : offer.status === "completed"
      ? doc?.contract?.status === "active"
        ? format(tr.statusActive, { days: doc.contract.daysLeft, fee: doc.contract.feeTk })
        : tr.statusEnded
      : offer.status === "scheduled"
        ? tr.statusScheduledDoc
        : offer.status === "pending"
          ? tr.draft
          : statusLabel[offer.status];

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-[3vh] backdrop-blur-md">
      {/* Print only the contract. */}
      <style>{`@media print { body * { visibility: hidden !important; } .contract-print, .contract-print * { visibility: visible !important; } .contract-print { position: absolute; inset: 0; margin: 0; box-shadow: none !important; } .contract-noprint { display: none !important; } }`}</style>
      <button type="button" aria-label={tr.close} onClick={onClose} className="fixed inset-0 cursor-default" tabIndex={-1} />

      <div role="dialog" aria-modal="true" className="relative w-full max-w-3xl">
        <div className="contract-noprint mb-2 flex justify-end gap-2">
          <button type="button" onClick={() => window.print()} className="rounded-full border border-white/20 bg-black/40 px-4 py-1.5 text-xs font-bold text-white hover:bg-black/60">
            {tr.print}
          </button>
          <button type="button" onClick={onClose} aria-label={tr.close} className="rounded-full border border-white/20 bg-black/40 p-1.5 text-white hover:bg-black/60">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <article className="contract-print rounded-lg bg-[#fbf8f1] px-6 py-8 text-[#1f1b16] shadow-2xl sm:px-10">
          {isLoading || !doc || !offer ? (
            <div className="flex justify-center py-24">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#8a6a2b] border-t-transparent" />
            </div>
          ) : (
            <>
              {/* Header */}
              <header className="border-b-2 border-double border-[#8a6a2b]/60 pb-5 text-center">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#8a6a2b]">ALLYNQ · eFootball</p>
                <h1 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">{tr.docTitle}</h1>
                <p className="mt-1 text-sm text-[#5b5245]">{kindLabel[offer.kind]}</p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs">
                  <span className="font-mono">
                    {tr.contractNo}: <b>{offer.contractNo ?? "—"}</b>
                  </span>
                  <span className="rounded-full border border-[#8a6a2b]/50 px-2.5 py-0.5 font-semibold text-[#6b4f1d]">{status}</span>
                </div>
              </header>

              {offer.scheduledTournament ? (
                <div className="contract-noprint mt-4">
                  <CommitmentNotice commitment={offer.scheduledTournament} playerName={offer.player.name} />
                </div>
              ) : null}

              {/* Parties */}
              <section className="mt-6">
                <h2 className="font-serif text-lg font-bold">1. {tr.parties}</h2>
                <div className={`mt-3 grid gap-3 ${offer.kind === "buyout" && offer.fromClub ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                  <Party label={tr.partyClub} name={offer.toClub.name} dpUrl={offer.toClub.dpUrl} square />
                  <Party label={tr.partyPlayer} name={offer.player.name} dpUrl={offer.player.dpUrl} />
                  {offer.kind === "buyout" && offer.fromClub ? (
                    <Party label={tr.partyReleasing} name={offer.fromClub.name} dpUrl={offer.fromClub.dpUrl} square />
                  ) : null}
                </div>
              </section>

              {/* Terms */}
              <section className="mt-6">
                <h2 className="font-serif text-lg font-bold">2. {tr.terms}</h2>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <Term label={tr.signingAmount} value={tk(doc.terms.signingAmountTk)} />
                  <Term
                    label={tr.feeAtSigning}
                    value={`${tk(doc.terms.feeAtSigningTk)} (${format(tr.feeBreakdown, { frozen: doc.terms.frozenTk, base: doc.terms.baseTk })})`}
                  />
                </dl>
                <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[#2d2820]">
                  <li>
                    {format(tr.clauseLock, {
                      days: doc.terms.lockDays,
                      start: date(doc.terms.startAt),
                      end: date(doc.terms.lockEndsAt),
                    })}
                  </li>
                  <li>{format(tr.clauseDecay, { base: doc.terms.baseTk, frozen: doc.terms.frozenTk })}</li>
                  <li>{tr.clauseBuyout}</li>
                  <li>{tr.clauseFree}</li>
                </ol>
                {offer.message ? <p className="mt-3 border-l-2 border-[#8a6a2b]/50 pl-3 text-sm italic text-[#5b5245]">“{offer.message}”</p> : null}
              </section>

              {/* Negotiation: the opening amount and every counter-offer */}
              {bids && bids.length > 1 ? (
                <section className="mt-6">
                  <h2 className="font-serif text-lg font-bold">{tr.negotiation}</h2>
                  <ol className="mt-3 space-y-2 text-sm">
                    {bids.map((b, i) => (
                      <li key={b.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-md bg-white/60 px-3 py-2">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8a6a2b]">
                          {i === 0 ? tr.bidOpening : tr.bidCounter}
                        </span>
                        <span className="font-semibold">{b.party === "club" ? offer.toClub.name : offer.player.name}</span>
                        <span className="font-mono font-bold">{tk(b.amountTk)}</span>
                        <span className="text-xs text-[#5b5245]">{dateTime(b.createdAt)}</span>
                        {b.message ? <span className="w-full text-xs italic text-[#5b5245]">“{b.message}”</span> : null}
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}

              {/* Payment */}
              <section className="mt-6">
                <h2 className="font-serif text-lg font-bold">3. {tr.paymentTitle}</h2>
                {offer.paymentStatus === "held" ? (
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="rounded-md bg-white/60 px-3 py-2 font-semibold">
                      {format(tr.payHeld, { amount: offer.heldTk.toLocaleString("en-US"), club: offer.toClub.name, payee: payeeName })}
                    </p>
                    {offer.amountTk > offer.heldTk && offer.status === "pending" ? (
                      <p className="text-[#5b5245]">
                        {format(tr.payDue, { club: offer.toClub.name, amount: (offer.amountTk - offer.heldTk).toLocaleString("en-US") })}
                      </p>
                    ) : null}
                    <dl className="grid gap-2 sm:grid-cols-2">
                      <Term label={tr.method} value={offer.paymentMethod ? methodLabel[offer.paymentMethod] : "—"} />
                      <Term label={tr.txId} value={offer.paymentRef ?? "—"} mono />
                    </dl>
                  </div>
                ) : offer.paymentStatus === "refunded" ? (
                  <p className="mt-2 text-sm text-[#5b5245]">{tr.payRefunded}</p>
                ) : offer.paymentStatus === "reversed" ? (
                  <p className="mt-2 text-sm text-[#5b5245]">{tr.payReversed}</p>
                ) : offer.paymentStatus === "paid" ? (
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <Term label={tr.paidBy} value={offer.toClub.name} />
                    <Term label={tr.paidTo} value={offer.payeeType === "club" ? (offer.fromClub?.name ?? "—") : offer.player.name} />
                    <Term label={tr.method} value={offer.paymentMethod ? methodLabel[offer.paymentMethod] : "—"} />
                    <Term label={tr.txId} value={offer.paymentRef ?? "—"} mono />
                    <Term label={tr.paidAt} value={dateTime(offer.paidAt)} />
                    <Term label={tr.signingAmount} value={tk(offer.amountTk)} />
                  </dl>
                ) : (
                  <p className="mt-2 text-sm text-[#5b5245]">{offer.amountTk > 0 ? tr.notPaidYet : tk(0)}</p>
                )}
              </section>

              {/* Signatures */}
              <section className="mt-6">
                <h2 className="font-serif text-lg font-bold">4. {tr.signatures}</h2>
                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                  <Signature label={tr.partyPlayer} name={offer.player.name} at={offer.playerSignedAt} pending={tr.notSigned} format={dateTime} />
                  <Signature
                    label={format(tr.signedFor, { club: offer.toClub.name })}
                    name={offer.clubSignedBy}
                    at={offer.clubSignedAt}
                    pending={tr.notSigned}
                    format={dateTime}
                  />
                </div>
              </section>

              {error ? (
                <p className="contract-noprint mt-5 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700" role="alert">
                  {error}
                </p>
              ) : null}

              {canSign && mode === "counter" ? (
                <div className="contract-noprint mt-8 space-y-3 border-t border-[#8a6a2b]/30 pt-5">
                  <h3 className="font-serif text-base font-bold">{tr.counterTitle}</h3>
                  <p className="text-xs leading-relaxed text-[#5b5245]">
                    {format(tr.counterHint, { days: expiryDays })} {signAs === "club" ? tr.counterHintClub : ""}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <label className="block w-40">
                      <span className="text-xs font-semibold text-[#5b5245]">{tr.amountLabel}</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={counterAmount}
                        onChange={(e) => setCounterAmount(digits(e.target.value))}
                        className="mt-1 w-full rounded-md border border-[#8a6a2b]/40 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-[#8a6a2b]"
                      />
                    </label>
                    <label className="block min-w-[200px] flex-1">
                      <span className="text-xs font-semibold text-[#5b5245]">{tr.messageLabel}</span>
                      <input
                        type="text"
                        value={counterMessage}
                        maxLength={500}
                        onChange={(e) => setCounterMessage(e.target.value)}
                        className="mt-1 w-full rounded-md border border-[#8a6a2b]/40 bg-white px-3 py-2 text-sm outline-none focus:border-[#8a6a2b]"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setMode("answer")}
                      disabled={busy}
                      className="rounded-full border border-[#1f1b16]/30 px-5 py-2 text-sm font-semibold text-[#1f1b16] hover:bg-black/5 disabled:opacity-50"
                    >
                      {tr.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={submitCounter}
                      disabled={busy || counterAmount === ""}
                      className="rounded-full bg-[#1f1b16] px-6 py-2 font-serif text-sm font-bold text-[#fbf8f1] hover:bg-black disabled:opacity-50"
                    >
                      {counter.isPending ? "…" : tr.sendCounter}
                    </button>
                  </div>
                </div>
              ) : canSign && mode === "confirmReject" ? (
                <div className="contract-noprint mt-8 space-y-3 border-t border-[#8a6a2b]/30 pt-5">
                  <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700" role="alert">
                    {tr.rejectWarning}
                  </p>
                  <div className="flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setMode("answer")}
                      disabled={busy}
                      className="rounded-full border border-[#1f1b16]/30 px-5 py-2 text-sm font-semibold text-[#1f1b16] hover:bg-black/5 disabled:opacity-50"
                    >
                      {tr.keepNegotiating}
                    </button>
                    <button
                      type="button"
                      onClick={decline}
                      disabled={busy}
                      className="rounded-full bg-red-700 px-6 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50"
                    >
                      {respond.isPending ? "…" : tr.confirmReject}
                    </button>
                  </div>
                </div>
              ) : canSign ? (
                <div className="contract-noprint mt-8 border-t border-[#8a6a2b]/30 pt-5">
                  {offer.kind === "buyout" ? <p className="mb-3 text-xs text-[#5b5245]">{tr.noCounterBuyout}</p> : null}
                  <div className="flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setMode("confirmReject")}
                      disabled={busy}
                      className="rounded-full border border-[#1f1b16]/30 px-5 py-2 text-sm font-semibold text-[#1f1b16] hover:bg-black/5 disabled:opacity-50"
                    >
                      {tr.decline}
                    </button>
                    {offer.kind !== "buyout" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCounterAmount(String(offer.amountTk));
                          setMode("counter");
                        }}
                        disabled={busy}
                        className="rounded-full border border-[#8a6a2b] px-5 py-2 text-sm font-semibold text-[#6b4f1d] hover:bg-[#8a6a2b]/10 disabled:opacity-50"
                      >
                        {tr.counter}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={signNow}
                      disabled={busy}
                      className="rounded-full bg-[#1f1b16] px-6 py-2 font-serif text-sm font-bold text-[#fbf8f1] hover:bg-black disabled:opacity-50"
                    >
                      {respond.isPending ? "…" : extraToSign > 0 ? `${tr.signAccept} · ${tk(extraToSign)}` : tr.signAccept}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </article>
      </div>

      {paying && offer ? (
        <PaymentModal
          amountTk={paying.amountTk}
          payeeName={payeeName}
          purpose={
            offer.heldTk > 0
              ? format(tr.extraPurpose, { player: offer.player.name })
              : `${kindLabel[offer.kind]} · ${offer.player.name}`
          }
          balanceTk={balanceTk}
          onPay={paying.run}
          onClose={(paid) => {
            setPaying(null);
            if (paid) onClose();
          }}
        />
      ) : null}
    </div>
    </ModalPortal>
  );
}

function Party({ label, name, dpUrl, square = false }: { label: string; name: string; dpUrl: string | null; square?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#8a6a2b]/30 bg-white/60 p-3">
      <Avatar dpUrl={dpUrl} name={name} size="md" mode="static" shape={square ? "square" : "circle"} />
      <div className="min-w-0">
        <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8a6a2b]">{label}</div>
        <div className="truncate font-serif text-base font-bold">{name}</div>
      </div>
    </div>
  );
}

function Term({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md bg-white/60 px-3 py-2">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#8a6a2b]">{label}</dt>
      <dd className={`mt-0.5 font-semibold ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

function Signature({
  label,
  name,
  at,
  pending,
  format: fmt,
}: {
  label: string;
  name: string | null;
  at: string | null;
  pending: string;
  format: (iso: string | null) => string;
}) {
  return (
    <div>
      <div className="h-12 border-b border-[#1f1b16]/50 font-serif text-2xl italic text-[#1f3a6b]">{at && name ? name : ""}</div>
      <div className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-[#8a6a2b]">{label}</div>
      <div className="text-xs text-[#5b5245]">{at ? `${name ?? ""} · ${fmt(at)}` : pending}</div>
    </div>
  );
}
