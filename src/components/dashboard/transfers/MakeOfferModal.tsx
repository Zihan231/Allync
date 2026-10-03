"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useCreateTransferOffer, useMyTransfers, usePlayerTransferStatus } from "@/lib/api/hooks/useTransfers";
import type { PaymentMethod, PlayerTransferStatus } from "@/lib/api/transfers";
import { useMockClubs } from "@/lib/mock/communityStore";
import { CloseIcon } from "@/components/icons";
import { PaymentModal } from "./PaymentModal";
import { CommitmentNotice, tk } from "./shared";

const errorMessage = (err: unknown) => {
  const data = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data;
  return Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
};

const digits = (v: string) => v.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d))).replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 7);

type Props =
  | {
      /** A player proposes himself to a club (the club is fixed, or picked here). */
      mode: "proposal";
      clubId?: string;
      onClose: () => void;
      onToast?: (message: string, variant?: "success" | "error") => void;
    }
  | {
      /** A club leader offers a player: renewal, buyout or club offer (decided from his status). */
      mode: "offer";
      clubId: string;
      clubName: string;
      clubBalanceTk: number | null;
      player: { id: string; name: string };
      status: PlayerTransferStatus | undefined;
      onClose: () => void;
      onToast?: (message: string, variant?: "success" | "error") => void;
    };

export function MakeOfferModal(props: Props) {
  const { t } = useLanguage();
  const tr = t.dashboard.transfers;
  const create = useCreateTransferOffer();
  const { data: mine } = useMyTransfers(props.mode === "proposal");
  const clubs = useMockClubs();
  const expiryDays = mine?.settings.offerExpiryDays ?? 3;

  const status = props.mode === "offer" ? props.status : undefined;
  const isRenewal = props.mode === "offer" && status?.clubId === props.clubId;
  const isBuyout = props.mode === "offer" && !isRenewal && Boolean(status?.contract?.locked);
  const buyoutPrice = isBuyout ? (status?.contract?.feeTk ?? 0) : 0;

  const [clubId, setClubId] = useState(props.mode === "proposal" ? (props.clubId ?? "") : props.clubId);
  const [amount, setAmount] = useState(isBuyout ? String(buyoutPrice) : "0");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  const amountTk = isBuyout ? buyoutPrice : Number(amount || 0);
  // One open deal per player and club: clubs he already has a pending offer with can't get another.
  const openWith = new Set((mine?.offers ?? []).filter((o) => o.status === "pending").map((o) => o.toClub.id));
  const alreadyOpen = props.mode === "proposal" && Boolean(clubId) && openWith.has(clubId);
  const title =
    props.mode === "proposal"
      ? tr.proposeTitle
      : format(isRenewal ? tr.renewTitle : isBuyout ? tr.buyoutTitle : tr.offerTitle, { player: props.player.name });
  const hint =
    props.mode === "proposal"
      ? format(tr.proposeHint, { days: expiryDays })
      : isBuyout
        ? format(tr.buyoutHint, { player: props.player.name, club: clubs.find((c) => c.id === status?.clubId)?.name ?? "" })
        : `${isRenewal ? format(tr.renewHint, { days: status?.contract?.lockDays ?? 120 }) + " " : ""}${format(tr.offerHint, { days: expiryDays })}`;

  async function send(paymentMethod?: PaymentMethod): Promise<string | null> {
    const offer = await create.mutateAsync({
      clubId,
      playerUserId: props.mode === "offer" ? props.player.id : undefined,
      amountTk,
      message: message.trim() || undefined,
      paymentMethod,
    });
    props.onToast?.(tr.sentToast, "success");
    return offer.paymentRef;
  }

  async function submit() {
    setError("");
    if (!clubId) return setError(tr.pickClub);
    if (alreadyOpen) return setError(tr.proposalPendingNote);
    if (props.mode === "offer" && amountTk > 0) {
      setPaying(true);
      return;
    }
    try {
      await send();
      props.onClose();
    } catch (err) {
      setError(errorMessage(err) || tr.errGeneric);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-[8vh] backdrop-blur-md">
      <button type="button" aria-label={tr.close} onClick={props.onClose} className="fixed inset-0 cursor-default" tabIndex={-1} />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-md rounded-2xl border border-surface-line-strong bg-bg-raised shadow-2xl">
        <header className="flex items-center justify-between border-b border-surface-line px-5 py-3.5">
          <h2 className="font-display text-base font-black text-ink">{title}</h2>
          <button type="button" onClick={props.onClose} aria-label={tr.close} className="rounded-full p-1.5 text-ink-faint hover:bg-surface-line/60 hover:text-ink">
            <CloseIcon className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-4 px-5 py-5">
          {props.mode === "offer" && status?.commitment ? (
            <CommitmentNotice commitment={status.commitment} playerName={props.player.name} />
          ) : null}

          {props.mode === "proposal" && !props.clubId ? (
            <label className="block">
              <span className="text-xs font-semibold text-ink-soft">{tr.clubLabel}</span>
              <select
                value={clubId}
                onChange={(e) => setClubId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-surface-line bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-accent [color-scheme:dark]"
              >
                <option value="">{tr.pickClub}</option>
                {[...clubs]
                  .filter((c) => c.id !== mine?.clubId || !mine?.contract?.locked)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((c) => (
                    <option key={c.id} value={c.id} disabled={openWith.has(c.id)}>
                      {c.name}
                      {openWith.has(c.id) ? ` · ${tr.proposalPending}` : ""}
                    </option>
                  ))}
              </select>
            </label>
          ) : null}

          <label className="block">
            <span className="text-xs font-semibold text-ink-soft">{tr.amountLabel}</span>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-faint">৳</span>
              <input
                type="text"
                inputMode="numeric"
                value={isBuyout ? String(buyoutPrice) : amount}
                readOnly={isBuyout}
                onChange={(e) => setAmount(digits(e.target.value))}
                className="w-full rounded-lg border border-surface-line bg-bg py-2.5 pl-8 pr-3 font-mono text-sm text-ink outline-none focus:border-accent read-only:opacity-70"
              />
            </div>
          </label>

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

          <p className="rounded-lg bg-surface/60 px-3 py-2 text-xs leading-relaxed text-ink-soft">{hint}</p>

          {alreadyOpen ? (
            <p className="rounded-lg border border-warning/40 bg-warning-soft px-3 py-2 text-xs font-semibold text-warning-ink">
              {tr.proposalPendingNote}
            </p>
          ) : null}

          {error ? (
            <p className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-xs font-semibold text-danger-ink" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={submit}
            disabled={create.isPending || alreadyOpen}
            className="w-full rounded-full bg-accent py-2.5 font-display text-sm font-black text-bg disabled:opacity-50"
          >
            {props.mode === "proposal"
              ? tr.sendProposal
              : amountTk > 0
                ? `${tr.continueToPayment} · ${tk(amountTk)}`
                : tr.sendOffer}
          </button>
        </div>
      </div>

      {paying && props.mode === "offer" ? (
        <PaymentModal
          amountTk={amountTk}
          payeeName={isBuyout ? (clubs.find((c) => c.id === status?.clubId)?.name ?? props.player.name) : props.player.name}
          purpose={title}
          balanceTk={props.clubBalanceTk}
          onPay={(method) => send(method)}
          onClose={(paid) => {
            setPaying(false);
            if (paid) props.onClose();
          }}
        />
      ) : null}
    </div>
  );
}

/** Club offer form for a player, with his live transfer status (renewal / buyout / club offer). */
export function OfferToPlayerModal({
  clubId,
  clubName,
  clubBalanceTk,
  player,
  onClose,
  onToast,
}: {
  clubId: string;
  clubName: string;
  clubBalanceTk: number | null;
  player: { id: string; name: string };
  onClose: () => void;
  onToast?: (message: string, variant?: "success" | "error") => void;
}) {
  const { data: status, isLoading } = usePlayerTransferStatus(player.id);
  if (isLoading || !status) return null;
  return (
    <MakeOfferModal
      mode="offer"
      clubId={clubId}
      clubName={clubName}
      clubBalanceTk={clubBalanceTk}
      player={player}
      status={status}
      onClose={onClose}
      onToast={onToast}
    />
  );
}
