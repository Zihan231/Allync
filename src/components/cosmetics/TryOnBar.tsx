"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STORE_RETURN_KEY } from "@/lib/storeCosmetics";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useEquipStoreItem, useMyStore, usePurchaseStoreItem } from "@/lib/api/hooks/useStore";
import type { CosmeticItem } from "@/lib/mock/cosmetics";
import { PaymentModal } from "@/components/dashboard/transfers/PaymentModal";

/**
 * Shown at the bottom of the user's own profile while trying a store item on
 * (`?try=<sku>`): switch between the current look and the tried one, then buy,
 * claim or equip it without leaving the page.
 */
export function TryOnBar({
  item,
  view,
  onViewChange,
}: {
  item: CosmeticItem;
  view: "before" | "after";
  onViewChange: (view: "before" | "after") => void;
}) {
  const { t } = useLanguage();
  const ts = t.dashboard.store;
  const { data: mine } = useMyStore();
  const purchase = usePurchaseStoreItem();
  const equip = useEquipStoreItem();
  const router = useRouter();
  const [checkout, setCheckout] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const owned = Boolean(mine?.owned.includes(item.id));
  const equipped = mine?.equipped[item.category] === item.id;
  const busy = purchase.isPending || equip.isPending;
  const errorText = (err: unknown) => {
    const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
    return (Array.isArray(m) ? m.join(", ") : m) || ts.actionError;
  };

  /** Back to the store tab and filters the user came from; the store restores the scroll height. */
  function backToStore() {
    let url = "/dashboard/efootball/store";
    try {
      url = JSON.parse(sessionStorage.getItem(STORE_RETURN_KEY) ?? "null")?.url ?? url;
    } catch {
      // Storage blocked: the store's first tab.
    }
    router.push(url, { scroll: false });
  }

  async function buy(): Promise<null> {
    await purchase.mutateAsync({ sku: item.id });
    setMessage(format(ts.boughtToast, { name: item.name }));
    return null;
  }

  async function act() {
    setError("");
    try {
      if (owned) {
        await equip.mutateAsync({ category: item.category, sku: item.id });
        setMessage(format(ts.equippedToast, { name: item.name }));
      } else if (item.priceBdt > 0) {
        setCheckout(true);
      } else {
        await buy();
      }
    } catch (err) {
      setError(errorText(err));
    }
  }

  const label = equipped
    ? null
    : owned
      ? t.dashboard.store.equip
      : item.priceBdt > 0
        ? format(ts.buyFor, { amount: item.priceBdt.toLocaleString() })
        : ts.getFree;

  return (
    <>
      {/* Keeps the end of the profile reachable above the bar */}
      <div className="h-24" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-accent/40 bg-bg-raised/95 px-4 py-3 shadow-[0_-12px_40px_rgba(0,0,0,0.5)] backdrop-blur-md lg:left-60">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-black text-ink">{format(ts.tryTitle, { name: item.name })}</p>
            <p className="truncate text-[11px] text-ink-soft">{error || message || ts.tryHint}</p>
          </div>
          <div className="flex rounded-full border border-surface-line-strong bg-surface/60 p-0.5 text-xs font-semibold">
            {(["before", "after"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onViewChange(v)}
                className={`rounded-full px-3 py-1 transition-colors ${view === v ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"}`}
              >
                {v === "before" ? ts.tryBefore : ts.tryAfter}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={backToStore}
            className="rounded-full border border-surface-line-strong px-4 py-2 text-xs font-bold text-ink-soft hover:text-ink"
          >
            {ts.backToStore}
          </button>
          {label ? (
            <button
              type="button"
              onClick={act}
              disabled={busy}
              className="rounded-full bg-accent px-5 py-2 text-xs font-black uppercase tracking-wider text-bg shadow-lg hover:brightness-110 disabled:opacity-50"
            >
              {label}
            </button>
          ) : (
            <span className="text-xs font-bold text-emerald-400">✓ {ts.equipped}</span>
          )}
        </div>
      </div>
      {checkout ? (
        <PaymentModal
          amountTk={item.priceBdt}
          payeeName="ALLYNQ Store"
          purpose={format(ts.purchaseTitle, { name: item.name })}
          balanceTk={mine?.balanceTk ?? null}
          onPay={buy}
          onClose={() => setCheckout(false)}
        />
      ) : null}
    </>
  );
}
