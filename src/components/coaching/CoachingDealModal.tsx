"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useCreateCoachingDeal } from "@/lib/api/hooks/useCoaching";
import type { CoachingSettings } from "@/lib/api/coaching";
import type { PaymentMethod } from "@/lib/api/transfers";
import { useMockClubs } from "@/lib/mock/communityStore";
import { CloseIcon } from "@/components/icons";
import { PaymentModal } from "@/components/dashboard/transfers/PaymentModal";
import { ModalPortal, tk } from "@/components/dashboard/transfers/shared";

const errorMessage = (err: unknown) => {
  const data = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data;
  return Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
};

/**
 * Start a coaching deal. "request": the coach asks a club (it pays only if it agrees).
 * "offer": a club leader offers a coach a deal; the club pays the fee into a hold now.
 */
export function CoachingDealModal({
  mode,
  clubId: fixedClubId,
  clubName,
  coach,
  settings,
  clubBalanceTk = null,
  suggestedFeeTk,
  onClose,
  onToast,
}: {
  mode: "request" | "offer";
  /** offer: the leader's club. request: a pre-picked club (or let the coach choose). */
  clubId?: string;
  clubName?: string;
  /** offer: the coach being offered the deal. */
  coach?: { id: string; name: string };
  settings?: CoachingSettings;
  clubBalanceTk?: number | null;
  suggestedFeeTk?: number | null;
  onClose: () => void;
  onToast?: (message: string, variant?: "success" | "error") => void;
}) {
  const { t } = useLanguage();
  const td = t.coaching.deals;
  const create = useCreateCoachingDeal();
  const clubs = useMockClubs();
  const [clubId, setClubId] = useState(fixedClubId ?? "");
  const [fee, setFee] = useState(String(suggestedFeeTk ?? 0));
  const [days, setDays] = useState(String(settings?.minDays && settings.minDays > 30 ? settings.minDays : 30));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const feeTk = Number(fee || 0);
  const title =
    mode === "offer"
      ? format(td.offerTitle, { coach: coach?.name ?? "" })
      : format(td.requestTitle, { club: clubName ?? clubs.find((c) => c.id === clubId)?.name ?? "" });

  async function send(paymentMethod?: PaymentMethod) {
    await create.mutateAsync({
      clubId,
      coachUserId: mode === "offer" ? coach?.id : undefined,
      feeTk,
      days: Number(days || 0),
      message: message.trim() || undefined,
      paymentMethod,
    });
    onToast?.(td.sentToast, "success");
    return null;
  }

  async function submit() {
    setError("");
    if (!clubId) return setError(td.pickClub);
    if (mode === "offer" && feeTk > 0) return setPaying(true);
    try {
      await send();
      onClose();
    } catch (err) {
      setError(errorMessage(err) || td.errGeneric);
    }
  }

  const field = "mt-1.5 w-full rounded-lg border border-surface-line bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-accent";

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-[8vh] backdrop-blur-md">
        <button type="button" aria-label={t.dashboard.transfers.close} onClick={onClose} className="fixed inset-0 cursor-default" tabIndex={-1} />
        <div role="dialog" aria-modal="true" className="relative w-full max-w-md rounded-2xl border border-surface-line-strong bg-bg-raised shadow-2xl">
          <header className="flex items-center justify-between border-b border-surface-line px-5 py-3.5">
            <h2 className="font-display text-base font-black text-ink">{title}</h2>
            <button type="button" onClick={onClose} aria-label={t.dashboard.transfers.close} className="rounded-full p-1.5 text-ink-faint hover:bg-surface-line/60 hover:text-ink">
              <CloseIcon className="h-4 w-4" />
            </button>
          </header>
          <div className="space-y-4 px-5 py-5">
            {mode === "request" && !fixedClubId ? (
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft">{td.pickClub}</span>
                <select value={clubId} onChange={(e) => setClubId(e.target.value)} className={`${field} [color-scheme:dark]`}>
                  <option value="">{td.pickClub}</option>
                  {[...clubs]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </label>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft">{td.fee} (৳)</span>
                <input value={fee} onChange={(e) => setFee(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={`${field} font-mono`} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft">{td.days}</span>
                <input value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" className={`${field} font-mono`} />
              </label>
            </div>
            {settings ? (
              <p className="-mt-2 text-[11px] text-ink-faint">
                {format(td.lengthHint, { min: settings.minDays, max: settings.maxDays })} ·{" "}
                {format(mode === "offer" ? td.netClub : td.net, {
                  amount: tk(feeTk - Math.round((feeTk * settings.commissionPct) / 100)),
                  pct: settings.commissionPct,
                })}
              </p>
            ) : null}
            <label className="block">
              <span className="text-xs font-semibold text-ink-soft">{td.message}</span>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} maxLength={500} className={field} />
            </label>
            <p className="rounded-lg bg-surface/60 px-3 py-2 text-xs leading-relaxed text-ink-soft">{td.clubPays}</p>
            {error ? (
              <p role="alert" className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-xs font-semibold text-danger-ink">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              onClick={submit}
              disabled={create.isPending}
              className="w-full rounded-full bg-accent py-2.5 font-display text-sm font-black text-bg disabled:opacity-50"
            >
              {mode === "offer" && feeTk > 0 ? `${t.dashboard.transfers.continueToPayment} · ${tk(feeTk)}` : td.send}
            </button>
          </div>
        </div>
        {paying ? (
          <PaymentModal
            amountTk={feeTk}
            payeeName={coach?.name ?? ""}
            purpose={title}
            balanceTk={clubBalanceTk}
            onPay={(method) => send(method)}
            onClose={(paid) => {
              setPaying(false);
              if (paid) onClose();
            }}
          />
        ) : null}
      </div>
    </ModalPortal>
  );
}
