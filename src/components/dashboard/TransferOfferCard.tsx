"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { updateTransferOffer } from "@/lib/mock/store";
import type { TransferOffer } from "@/lib/mock/types";
import { StatusPill } from "./StatusPill";

export function TransferOfferCard({ offer }: { offer: TransferOffer }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-line bg-surface/40 p-4">
      <div>
        <div className="text-sm font-medium text-ink">{offer.playerName}</div>
        <div className="text-xs text-ink-faint">
          {offer.fromClub} → {offer.toClub} · ৳ {offer.feeBdt.toLocaleString()}
        </div>
      </div>

      {offer.status === "pending" ? (
        <div className="flex gap-2">
          <button
            onClick={() => updateTransferOffer(offer.id, { status: "accepted" })}
            className="rounded-full bg-success-soft px-3.5 py-1.5 text-xs font-semibold text-success-ink"
          >
            {t.dashboard.transfers.accept}
          </button>
          <button
            onClick={() => updateTransferOffer(offer.id, { status: "declined" })}
            className="rounded-full bg-danger-soft px-3.5 py-1.5 text-xs font-semibold text-danger-ink"
          >
            {t.dashboard.transfers.decline}
          </button>
        </div>
      ) : (
        <StatusPill tone={offer.status === "accepted" ? "success" : "danger"}>
          {offer.status === "accepted" ? t.dashboard.transfers.accepted : t.dashboard.transfers.declined}
        </StatusPill>
      )}
    </div>
  );
}
