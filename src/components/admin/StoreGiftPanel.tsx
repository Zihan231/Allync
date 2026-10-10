"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { AdminUserDetail } from "@/lib/api/admin";
import { useAdminStoreItems, useGrantStoreItem } from "@/lib/api/hooks/useAdminStore";
import { Badge, Button, Panel, inputClass } from "./ui";

/** Admin user page: the store items a user owns, with gift (free) and remove. */
export function StoreGiftPanel({ user, onMessage }: { user: AdminUserDetail; onMessage: (text: string, tone?: "success" | "error") => void }) {
  const { t } = useLanguage();
  const ts = t.admin.store;
  const { data: items } = useAdminStoreItems();
  const grant = useGrantStoreItem(user.id);
  const [pick, setPick] = useState("");
  const [reason, setReason] = useState("");

  const owned = new Set(user.ownedCosmeticIds ?? []);
  const equipped = new Set([user.equippedBadgeId, user.equippedTitleId, user.equippedFrameId, user.equippedThemeId].filter(Boolean));
  const ownedItems = (items ?? []).filter((item) => owned.has(item.sku));
  const giftable = (items ?? []).filter((item) => !owned.has(item.sku));

  async function run(itemId: string, remove: boolean) {
    try {
      await grant.mutateAsync({ itemId, remove, reason: reason.trim() || undefined });
      onMessage(remove ? ts.revoked : ts.gifted, "success");
      setPick("");
      setReason("");
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      onMessage(message || t.admin.common.errGeneric, "error");
    }
  }

  return (
    <Panel title={ts.giftTitle}>
      {ownedItems.length ? (
        <ul className="mb-3 space-y-1.5">
          {ownedItems.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate">
                <span className="font-semibold text-ink">{item.name}</span>{" "}
                <span className="text-xs capitalize text-ink-faint">{item.category}</span>{" "}
                {equipped.has(item.sku) ? <Badge tone="accent">{ts.equippedTag}</Badge> : null}
              </span>
              <Button small variant="danger" disabled={grant.isPending} onClick={() => run(item.id, true)}>
                {ts.revoke}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-sm text-ink-soft">{ts.noneOwned}</p>
      )}
      <div className="space-y-2">
        <select value={pick} onChange={(e) => setPick(e.target.value)} className={inputClass}>
          <option value="">{ts.giftPick}</option>
          {giftable.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.category} · {item.priceTk > 0 ? `৳${item.priceTk}` : ts.free}
            </option>
          ))}
        </select>
        <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder={ts.giftReason} className={inputClass} />
        <div className="flex justify-end">
          <Button variant="primary" small disabled={!pick || grant.isPending} onClick={() => run(pick, false)}>
            {ts.gift}
          </Button>
        </div>
      </div>
    </Panel>
  );
}
