"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useDeleteDesign, useUpdateDesign } from "@/lib/api/hooks/useCreators";
import { apiMessage, type CreatorCategory, type CreatorDesign } from "@/lib/api/creators";
import { tk } from "@/components/dashboard/transfers/shared";
import { DesignPreview, DesignStatusChip } from "./DesignPreview";

type Toast = (message: string, variant?: "success" | "error") => void;

/** One of the creator's designs: its look, status and sales, with price, pause and remove controls. */
export function DesignRow({ design, onToast }: { design: CreatorDesign; onToast: Toast }) {
  const { t } = useLanguage();
  const tc = t.creators;
  const td = tc.designs;
  const update = useUpdateDesign();
  const remove = useDeleteDesign();
  const [price, setPrice] = useState(design.priceTk);
  const approved = design.reviewStatus === "approved";
  const fail = (err: unknown) => onToast(apiMessage(err, t.coaching.deals.errGeneric), "error");

  const save = async (input: { priceTk?: number; active?: boolean }, message: string) => {
    try {
      await update.mutateAsync({ id: design.id, input });
      onToast(message, "success");
    } catch (err) {
      fail(err);
    }
  };

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-surface-line bg-surface/50 p-3" data-testid="design-row">
      <DesignPreview category={design.category as CreatorCategory} name={design.name} assets={design.assets} rarity={design.metadata?.rarity} size="sm" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-display text-sm font-black text-ink">{design.name}</div>
          <div className="text-[11px] text-ink-faint">
            {tc.categories[design.category as CreatorCategory]} · {tc.rarities[(design.metadata?.rarity as keyof typeof tc.rarities) ?? "common"]}
          </div>
        </div>
        <DesignStatusChip design={design} />
      </div>
      {design.rejectReason && (design.reviewStatus === "rejected" || !design.pendingAssets) ? (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger-ink">{format(td.rejectedBecause, { reason: design.rejectReason })}</p>
      ) : null}
      <div className="text-xs text-ink-soft">
        {format(td.salesCount, { n: design.salesCount })} · {format(td.revenue, { amount: tk(design.revenueTk) })}
      </div>

      <div className="mt-auto flex items-center gap-2">
        <span className="text-sm text-ink-faint">৳</span>
        <input
          type="number"
          min={0}
          max={100000}
          value={price}
          onChange={(e) => setPrice(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
          className="w-24 rounded-lg border border-surface-line-strong bg-bg-raised px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
        />
        <button
          type="button"
          disabled={price === design.priceTk || update.isPending}
          onClick={() => save({ priceTk: price }, td.priceSaved)}
          className="rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-bg disabled:opacity-40"
        >
          {td.savePrice}
        </button>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-surface-line pt-3">
        {approved ? (
          <button
            type="button"
            disabled={update.isPending}
            onClick={() => save({ active: !design.active }, design.active ? td.paused : td.resumed)}
            className="rounded-full border border-surface-line-strong px-3 py-1.5 text-xs font-semibold text-ink-soft hover:text-ink"
          >
            {design.active ? td.pause : td.resume}
          </button>
        ) : null}
        <Link
          href={`/dashboard/creator/new?edit=${design.id}`}
          className="rounded-full border border-surface-line-strong px-3 py-1.5 text-xs font-semibold text-ink-soft hover:text-ink"
        >
          {td.changeLook}
        </Link>
        <button
          type="button"
          disabled={remove.isPending}
          onClick={async () => {
            if (!window.confirm(td.removeConfirm)) return;
            try {
              const res = await remove.mutateAsync(design.id);
              onToast(res.delisted ? td.delisted : td.removed, "success");
            } catch (err) {
              fail(err);
            }
          }}
          className="ml-auto rounded-full px-3 py-1.5 text-xs font-semibold text-danger-ink hover:bg-danger-soft"
        >
          {td.remove}
        </button>
      </div>
    </article>
  );
}
