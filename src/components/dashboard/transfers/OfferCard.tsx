"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useCancelTransferOffer } from "@/lib/api/hooks/useTransfers";
import type { TransferOffer } from "@/lib/api/transfers";
import { Avatar } from "@/components/common/Avatar";
import { formatMatchTime } from "@/components/dashboard/fixtures/labels";
import { ArrowRightIcon } from "@/components/icons";
import { CommitmentNotice, STATUS_CLASSES, tk, useTransferLabels } from "./shared";

/**
 * One offer, seen by the player or by a club. Actions depend on who is looking:
 * the side that has to answer gets "Review & sign" (opens the contract), the
 * sender can withdraw a pending offer, everyone can view the contract.
 */
export function OfferCard({
  offer,
  viewer,
  canAct,
  onOpenContract,
  onToast,
}: {
  offer: TransferOffer;
  /** "player": the signed-in player; "club": a club page (canAct = its President / GS). */
  viewer: "player" | "club";
  canAct: boolean;
  onOpenContract: (offerId: string, signAs?: "player" | "club") => void;
  onToast?: (message: string, variant?: "success" | "error") => void;
}) {
  const { locale } = useLanguage();
  const { tr, kind: kindLabel, status: statusLabel } = useTransferLabels();
  const cancel = useCancelTransferOffer();

  const fromPlayer = offer.kind === "player_proposal";
  const pending = offer.status === "pending";
  // Who answers: the club for a proposal, the player for everything else.
  const mustAnswer = pending && canAct && (viewer === "club" ? fromPlayer : !fromPlayer);
  const canWithdraw = pending && canAct && (viewer === "club" ? !fromPlayer : fromPlayer);
  const other = viewer === "player" ? { name: offer.toClub.name, dpUrl: offer.toClub.dpUrl, square: true } : { name: offer.player.name, dpUrl: offer.player.dpUrl, square: false };
  const clubHeld = pending && !fromPlayer && offer.amountTk > 0;

  async function withdraw() {
    try {
      await cancel.mutateAsync(offer.id);
      onToast?.(tr.withdrawnToast, "success");
    } catch {
      onToast?.(tr.errGeneric, "error");
    }
  }

  return (
    <li className="rounded-xl border border-surface-line bg-surface/50 p-3.5">
      <div className="flex items-start gap-3">
        <Avatar dpUrl={other.dpUrl} name={other.name} size="md" mode="static" shape={other.square ? "square" : "circle"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-bold text-ink">{other.name}</span>
            <span className="rounded-full bg-accent-soft px-2 py-px text-[10px] font-bold text-accent-ink">{kindLabel[offer.kind]}</span>
            <span className={`rounded-full px-2 py-px text-[10px] font-bold ${STATUS_CLASSES[offer.status]}`}>{statusLabel[offer.status]}</span>
          </div>
          {offer.kind === "buyout" && offer.fromClub ? (
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-faint">
              {offer.fromClub.name}
              <ArrowRightIcon className="h-3 w-3" />
              {offer.toClub.name}
            </div>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="font-mono font-bold text-ink">{tk(offer.amountTk)}</span>
            {clubHeld ? <span className="text-warning-ink">{format(tr.heldNote, { amount: offer.amountTk.toLocaleString("en-US") })}</span> : null}
            {pending ? <span className="text-ink-faint">{format(tr.expires, { time: formatMatchTime(offer.expiresAt, locale) })}</span> : null}
          </div>
          {offer.message ? <p className="mt-1.5 line-clamp-2 text-xs italic text-ink-soft">“{offer.message}”</p> : null}
        </div>
      </div>

      {offer.scheduledTournament ? (
        <div className="mt-3">
          <CommitmentNotice commitment={offer.scheduledTournament} playerName={offer.player.name} />
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        {canWithdraw ? (
          <button
            type="button"
            onClick={withdraw}
            disabled={cancel.isPending}
            className="rounded-full border border-surface-line-strong px-3.5 py-1.5 text-xs font-bold text-ink-soft hover:text-ink disabled:opacity-50"
          >
            {tr.withdraw}
          </button>
        ) : null}
        {mustAnswer ? (
          <button
            type="button"
            onClick={() => onOpenContract(offer.id, viewer)}
            className="rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-bg"
          >
            {tr.reviewSign}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpenContract(offer.id)}
            className="rounded-full border border-surface-line-strong px-3.5 py-1.5 text-xs font-bold text-ink-soft hover:text-ink"
          >
            {tr.viewContract}
          </button>
        )}
      </div>
    </li>
  );
}
