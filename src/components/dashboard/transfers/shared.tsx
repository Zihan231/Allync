"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import type { ClubCommitment, ContractView, OfferKind, OfferStatus, PaymentMethod } from "@/lib/api/transfers";
import { formatShortDate } from "@/components/dashboard/fixtures/labels";
import { ClockIcon, InfoIcon, LockIcon } from "@/components/icons";

/** "৳1,250" */
export const tk = (amount: number) => `৳${amount.toLocaleString("en-US")}`;

export function useTransferLabels() {
  const { t } = useLanguage();
  const tr = t.dashboard.transfers;
  const kind: Record<OfferKind, string> = {
    player_proposal: tr.kindPlayerProposal,
    club_offer: tr.kindClubOffer,
    renewal: tr.kindRenewal,
    buyout: tr.kindBuyout,
  };
  const status: Record<OfferStatus, string> = {
    pending: tr.statusPending,
    scheduled: tr.statusScheduled,
    completed: tr.statusCompleted,
    declined: tr.statusDeclined,
    cancelled: tr.statusCancelled,
    expired: tr.statusExpired,
    reversed: tr.statusReversed,
  };
  const method: Record<PaymentMethod, string> = { bkash: tr.methodBkash, nagad: tr.methodNagad, card: tr.methodCard };
  return { tr, kind, status, method };
}

export const STATUS_CLASSES: Record<OfferStatus, string> = {
  pending: "bg-warning-soft text-warning-ink",
  scheduled: "bg-blue-soft text-blue-ink",
  completed: "bg-success-soft text-success-ink",
  declined: "bg-danger-soft text-danger-ink",
  cancelled: "bg-surface-line text-ink-faint",
  expired: "bg-surface-line text-ink-faint",
  reversed: "bg-danger-soft text-danger-ink",
};

/**
 * A contract's transfer fee today: frozen part + what's left of the base fee,
 * with the lock countdown as a bar. The info icon explains the decay.
 */
export function TransferFeeBadge({ contract, compact = false }: { contract: ContractView; compact?: boolean }) {
  const { t, locale } = useLanguage();
  const tr = t.dashboard.transfers;
  const share = contract.lockDays ? Math.min(1, contract.daysLeft / contract.lockDays) : 0;
  const tip = format(tr.feeTip, { frozen: contract.frozenTk, decaying: contract.decayingTk, base: contract.baseTk });

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5" title={tip}>
        <span className="font-mono text-sm font-bold text-accent-ink">{tk(contract.feeTk)}</span>
        {contract.locked ? (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-warning-soft px-1.5 py-px text-[10px] font-bold text-warning-ink">
            <LockIcon className="h-3 w-3" />
            {format(tr.daysLeft, { n: contract.daysLeft })}
          </span>
        ) : (
          <span className="rounded-full bg-success-soft px-1.5 py-px text-[10px] font-bold text-success-ink">{tr.freeAgent}</span>
        )}
      </span>
    );
  }

  return (
    <div className="rounded-xl border border-surface-line bg-bg/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">
            {tr.feeToday}
            <span title={tip} className="cursor-help text-ink-faint">
              <InfoIcon className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-1 font-display text-3xl font-black tabular-nums text-accent-ink">{tk(contract.feeTk)}</div>
          <div className="mt-1 text-xs text-ink-soft">
            {tr.frozenPart} {tk(contract.frozenTk)} · {tr.decayingPart} {tk(contract.decayingTk)}
          </div>
        </div>
        {contract.locked ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-bold text-warning-ink">
            <LockIcon className="h-3.5 w-3.5" />
            {tr.locked}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success-ink">{tr.freeAgent}</span>
        )}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-line">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${share * 100}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-ink-faint">
        <span>{contract.locked ? format(tr.daysLeft, { n: contract.daysLeft }) : tr.lockOver}</span>
        <span>{format(tr.lockEnds, { date: formatShortDate(contract.lockEndsAt, locale) })}</span>
      </div>
    </div>
  );
}

/** "X is in <tournament> (start – end); the transfer completes automatically when it ends." */
export function CommitmentNotice({ commitment, playerName }: { commitment: ClubCommitment; playerName: string }) {
  const { t, locale } = useLanguage();
  const tr = t.dashboard.transfers;
  return (
    <p className="flex items-start gap-2 rounded-xl border border-blue/40 bg-blue-soft px-3.5 py-2.5 text-xs font-semibold text-blue-ink">
      <ClockIcon className="mt-px h-4 w-4 shrink-0" />
      <span>
        {format(tr.commitmentNotice, {
          player: playerName,
          tournament: commitment.tournamentName,
          start: formatShortDate(commitment.startAt, locale),
          end: commitment.endAt ? formatShortDate(commitment.endAt, locale) : tr.untilItEnds,
        })}
      </span>
    </p>
  );
}

/**
 * Renders a modal on document.body, so it always covers the whole screen —
 * even when opened from inside another modal (a parent with backdrop blur
 * would otherwise trap "fixed" children inside its own scrolling box).
 */
export function ModalPortal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
