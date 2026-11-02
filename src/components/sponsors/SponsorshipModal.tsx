"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useCounterSponsorship, useCreateSponsorship } from "@/lib/api/hooks/useSponsors";
import { apiMessage } from "@/lib/api/creators";
import { SPONSOR_TIERS, type SponsorTargetType, type SponsorTier, type Sponsorship } from "@/lib/api/sponsors";
import { tk } from "@/components/dashboard/transfers/shared";

type Toast = (message: string, variant?: "success" | "error") => void;

/**
 * A sponsorship offer: a sponsor offering to sponsor a target, a host asking a sponsor
 * (`sponsor` set), or a counter-offer on an open deal (`deal` set).
 */
export function SponsorshipModal({
  target,
  sponsor,
  deal,
  commissionPct,
  minDays = 7,
  maxDays = 365,
  onClose,
  onToast,
}: {
  target?: { type: SponsorTargetType; id: string; name: string };
  sponsor?: { id: string; brandName: string };
  deal?: Sponsorship;
  commissionPct: number;
  minDays?: number;
  maxDays?: number;
  onClose: () => void;
  onToast: Toast;
}) {
  const { t } = useLanguage();
  const tm = t.sponsors.modal;
  const create = useCreateSponsorship();
  const counter = useCounterSponsorship();
  const type = deal?.targetType ?? target!.type;
  const [tier, setTier] = useState<SponsorTier>(deal?.tier ?? "partner");
  const [amount, setAmount] = useState(deal?.amountTk ?? 1000);
  const [days, setDays] = useState(deal?.days ?? 30);
  const [message, setMessage] = useState("");
  const busy = create.isPending || counter.isPending;
  const net = amount - Math.round((amount * commissionPct) / 100);
  // Who pays now: a sponsor's own offer (or their counter) holds the money.
  const sponsorPays = deal ? deal.mySide === "sponsor" : !sponsor;

  const title = deal
    ? tm.counterTitle
    : sponsor
      ? format(tm.titleAsk, { brand: sponsor.brandName })
      : format(tm.titleSponsor, { name: target!.name });
  const field = "w-full rounded-xl border border-surface-line-strong bg-bg-raised px-3 py-2.5 text-sm text-ink outline-none focus:border-accent";

  const submit = async () => {
    try {
      if (deal) {
        await counter.mutateAsync({ id: deal.id, amountTk: amount, tier, days: type === "community" ? days : undefined, message: message || undefined });
        onToast(t.sponsors.deals.countered, "success");
      } else {
        await create.mutateAsync({
          targetType: target!.type,
          targetId: target!.id,
          sponsorUserId: sponsor?.id,
          tier,
          amountTk: amount,
          days: type === "community" ? days : undefined,
          message: message || undefined,
        });
        onToast(t.sponsors.deals.sent, "success");
      }
      onClose();
    } catch (err) {
      onToast(apiMessage(err, t.coaching.deals.errGeneric), "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        data-testid="sponsorship-modal"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-surface-line bg-bg-raised p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-black text-ink">{title}</h2>
            {deal ? <p className="text-xs text-ink-soft">{deal.target.name}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-xs font-semibold text-ink-soft hover:text-ink">
            {tm.close}
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold text-ink-soft">{tm.tier}</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {SPONSOR_TIERS.map((x) => (
                <button
                  key={x}
                  type="button"
                  onClick={() => setTier(x)}
                  aria-pressed={tier === x}
                  className={`rounded-xl border p-2.5 text-left transition-colors ${tier === x ? "border-accent bg-accent-soft" : "border-surface-line hover:border-accent/50"}`}
                >
                  <div className="font-display text-sm font-black text-ink">{t.sponsors.tiers[x]}</div>
                  <div className="mt-0.5 text-[10px] leading-snug text-ink-faint">{t.sponsors.tierHints[x]}</div>
                </button>
              ))}
            </div>
          </fieldset>

          <div className={`grid gap-3 ${type === "community" ? "grid-cols-2" : ""}`}>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-ink-soft">{tm.amount}</span>
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                className={field}
                data-testid="sponsorship-amount"
              />
            </label>
            {type === "community" ? (
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-ink-soft">{tm.days}</span>
                <input type="number" min={minDays} max={maxDays} value={days} onChange={(e) => setDays(Math.floor(Number(e.target.value) || 0))} className={field} />
              </label>
            ) : null}
          </div>
          {type === "community" ? <p className="-mt-2 text-[11px] text-ink-faint">{format(tm.daysHint, { min: minDays, max: maxDays })}</p> : null}

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-ink-soft">{tm.message}</span>
            <textarea rows={3} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={tm.messagePlaceholder} className={field} />
          </label>

          <div className="space-y-1 rounded-xl bg-surface/70 p-3 text-xs text-ink-soft">
            <p>{sponsorPays ? tm.holdHint : tm.hostHint}</p>
            <p>
              {format(tm.payNote, { pct: commissionPct })} ({tk(net)})
            </p>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="w-full rounded-full bg-accent px-5 py-3 font-display text-sm font-black text-bg disabled:opacity-50"
            data-testid="sponsorship-send"
          >
            {busy ? "…" : deal ? tm.sendCounter : tm.send}
          </button>
        </div>
      </div>
    </div>
  );
}
