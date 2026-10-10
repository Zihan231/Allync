"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useCancelTransferOffer } from "@/lib/api/hooks/useTransfers";
import type { TransferOffer } from "@/lib/api/transfers";
import { Avatar } from "@/components/common/Avatar";
import { formatMatchTime, formatShortDate } from "@/components/dashboard/fixtures/labels";
import { STATUS_CLASSES, tk, useTransferLabels } from "./shared";

/**
 * Every club the player has proposed to (newest first): open ones can be
 * withdrawn (or answered, once the club has countered), closed ones
 * (declined / expired / withdrawn) proposed to again.
 */
export function ProposalList({
  proposals,
  openClubIds,
  canPropose,
  onProposeAgain,
  onOpenContract,
  onToast,
}: {
  proposals: TransferOffer[];
  /** Clubs he already has an open deal with (can't propose again yet). */
  openClubIds: Set<string>;
  canPropose: boolean;
  onProposeAgain: (clubId: string) => void;
  onOpenContract: (offerId: string, signAs?: "player" | "club") => void;
  onToast?: (message: string, variant?: "success" | "error") => void;
}) {
  const { locale } = useLanguage();
  const { tr, status: statusLabel } = useTransferLabels();
  const cancel = useCancelTransferOffer();

  async function withdraw(offerId: string) {
    try {
      await cancel.mutateAsync(offerId);
      onToast?.(tr.withdrawnToast, "success");
    } catch {
      onToast?.(tr.errGeneric, "error");
    }
  }

  if (!proposals.length) return <p className="mt-2 text-sm text-ink-soft">{tr.noProposals}</p>;

  return (
    <ul className="mt-3 divide-y divide-surface-line/70 rounded-xl border border-surface-line bg-surface/40">
      {proposals.map((p) => {
        const closed = p.status === "declined" || p.status === "cancelled" || p.status === "expired";
        return (
          <li key={p.id} className="flex flex-wrap items-center gap-3 px-3.5 py-3">
            <Link href={`/dashboard/efootball/clubs/${p.toClub.id}`} className="flex min-w-0 flex-1 items-center gap-2.5">
              <Avatar dpUrl={p.toClub.dpUrl} name={p.toClub.name} size="sm" mode="static" shape="square" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{p.toClub.name}</span>
                <span className="block text-[11px] text-ink-faint">
                  {format(tr.sentOn, { date: formatShortDate(p.createdAt, locale) })}
                  {p.status === "pending" ? ` · ${format(tr.expires, { time: formatMatchTime(p.expiresAt, locale) })}` : ""}
                </span>
              </span>
            </Link>
            <span className="font-mono text-sm font-bold text-ink">{tk(p.amountTk)}</span>
            <span className={`rounded-full px-2 py-px text-[10px] font-bold ${STATUS_CLASSES[p.status]}`}>{statusLabel[p.status]}</span>
            {p.status === "pending" && p.turn === "player" ? (
              // The club countered: his turn to accept, reject or counter again.
              <button
                type="button"
                onClick={() => onOpenContract(p.id, "player")}
                className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-bg"
              >
                {tr.reviewSign}
              </button>
            ) : p.status === "pending" ? (
              <button
                type="button"
                onClick={() => withdraw(p.id)}
                disabled={cancel.isPending}
                className="rounded-full border border-danger/50 px-3 py-1 text-[11px] font-bold text-danger-ink hover:bg-danger-soft disabled:opacity-50"
              >
                {tr.withdraw}
              </button>
            ) : closed && canPropose && !openClubIds.has(p.toClub.id) ? (
              <button
                type="button"
                onClick={() => onProposeAgain(p.toClub.id)}
                className="rounded-full border border-accent/50 px-3 py-1 text-[11px] font-bold text-accent-ink hover:bg-accent hover:text-bg"
              >
                {tr.proposeAgain}
              </button>
            ) : p.status === "completed" || p.status === "scheduled" ? (
              <button type="button" onClick={() => onOpenContract(p.id)} className="text-[11px] font-bold text-accent-ink hover:underline">
                {tr.viewContract}
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
