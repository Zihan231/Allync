"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTransferHistory } from "@/lib/api/hooks/useTransfers";
import { Avatar } from "@/components/common/Avatar";
import { formatShortDate } from "@/components/dashboard/fixtures/labels";
import { ArrowRightIcon } from "@/components/icons";
import { tk, useTransferLabels } from "./shared";

/** Completed transfers of a club (in and out) or of a player, newest first. */
export function TransferHistoryList({
  clubId,
  userId,
  onOpenContract,
}: {
  clubId?: string;
  userId?: string;
  onOpenContract?: (offerId: string) => void;
}) {
  const { locale } = useLanguage();
  const { tr, kind: kindLabel } = useTransferLabels();
  const { data, isLoading } = useTransferHistory({ clubId, userId, limit: 30 });
  const rows = data?.data ?? [];

  if (isLoading) return <div className="h-24 animate-pulse rounded-xl border border-surface-line bg-surface/40" />;
  if (!rows.length) return <p className="rounded-xl border border-dashed border-surface-line p-5 text-center text-xs text-ink-faint">{tr.noHistory}</p>;

  return (
    <ul className="divide-y divide-surface-line/70 rounded-xl border border-surface-line bg-surface/40">
      {rows.map((o) => (
        <li key={o.id} className="flex flex-wrap items-center gap-3 px-3.5 py-2.5 text-xs">
          <span className="w-14 shrink-0 font-mono text-[11px] text-ink-faint">{o.completedAt ? formatShortDate(o.completedAt, locale) : ""}</span>
          {userId ? null : (
            <span className="flex min-w-0 items-center gap-2">
              <Avatar dpUrl={o.player.dpUrl} name={o.player.name} size="sm" mode="static" />
              <span className="truncate font-semibold text-ink">{o.player.name}</span>
            </span>
          )}
          <span className="flex min-w-0 flex-1 items-center gap-1.5 text-ink-soft">
            <span className="truncate">{o.fromClub?.name ?? tr.noClub}</span>
            <ArrowRightIcon className="h-3 w-3 shrink-0" />
            <span className="truncate font-semibold text-ink">{o.toClub.name}</span>
          </span>
          <span className="rounded-full bg-accent-soft px-2 py-px text-[10px] font-bold text-accent-ink">{kindLabel[o.kind]}</span>
          <span className="w-16 text-right font-mono font-bold text-ink">{tk(o.amountTk)}</span>
          {onOpenContract ? (
            <button type="button" onClick={() => onOpenContract(o.id)} className="text-[11px] font-bold text-accent-ink hover:underline">
              {tr.viewContract}
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
