"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import {
  useCancelCoachingDeal,
  useCounterCoachingDeal,
  useEndCoachingDeal,
  useRespondCoachingDeal,
} from "@/lib/api/hooks/useCoaching";
import type { CoachingDeal, CoachingParty, CoachingSettings } from "@/lib/api/coaching";
import type { PaymentMethod } from "@/lib/api/transfers";
import { Avatar } from "@/components/common/Avatar";
import { formatShortDate } from "@/components/dashboard/fixtures/labels";
import { StatusPill, type StatusTone } from "@/components/dashboard/StatusPill";
import { PaymentModal } from "@/components/dashboard/transfers/PaymentModal";
import { tk } from "@/components/dashboard/transfers/shared";

const STATUS_TONE: Record<CoachingDeal["status"], StatusTone> = {
  pending: "warning",
  scheduled: "info",
  active: "accent",
  completed: "success",
  ended: "neutral",
  declined: "danger",
  cancelled: "neutral",
  expired: "neutral",
};

const errorMessage = (err: unknown) => {
  const data = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data;
  return Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
};

/**
 * One coaching deal, seen by the coach or by the club. The side whose turn it is accepts
 * (the club pays what isn't held yet), counters or declines; the other side can withdraw.
 * Either side can end a running deal.
 */
export function CoachingDealCard({
  deal,
  viewer,
  canAct,
  settings,
  clubBalanceTk = null,
  onToast,
}: {
  deal: CoachingDeal;
  viewer: CoachingParty;
  canAct: boolean;
  settings?: CoachingSettings;
  clubBalanceTk?: number | null;
  onToast?: (message: string, variant?: "success" | "error") => void;
}) {
  const { t, locale } = useLanguage();
  const td = t.coaching.deals;
  const respond = useRespondCoachingDeal();
  const counter = useCounterCoachingDeal();
  const cancel = useCancelCoachingDeal();
  const end = useEndCoachingDeal();
  const [mode, setMode] = useState<"idle" | "counter">("idle");
  const [fee, setFee] = useState(String(deal.feeTk));
  const [days, setDays] = useState(String(deal.days));
  const [error, setError] = useState("");
  const [paying, setPaying] = useState<{ amountTk: number; run: (m: PaymentMethod) => Promise<string | null> } | null>(null);

  const other = viewer === "coach" ? deal.club : deal.coach;
  const otherHref = viewer === "coach" ? `/dashboard/efootball/clubs/${deal.club.id}` : `/dashboard/efootball/coaches/${deal.coach.id}`;
  const myTurn = deal.status === "pending" && deal.turn === viewer;
  const busy = respond.isPending || counter.isPending || cancel.isPending || end.isPending;

  const run = async (work: () => Promise<unknown>, done: string) => {
    setError("");
    try {
      await work();
      onToast?.(done, "success");
      setMode("idle");
    } catch (err) {
      setError(errorMessage(err) || td.errGeneric);
    }
  };

  /** The club pays the part of the fee that isn't held yet, through the checkout. */
  const viaCheckout = (amountTk: number, work: (method?: PaymentMethod) => Promise<unknown>, done: string) => {
    if (viewer === "club" && amountTk > 0) {
      setPaying({
        amountTk,
        run: async (method) => {
          await work(method);
          onToast?.(done, "success");
          setMode("idle");
          return null;
        },
      });
      return;
    }
    void run(() => work(), done);
  };

  const accept = () =>
    viaCheckout(Math.max(0, deal.feeTk - deal.heldTk), (method) => respond.mutateAsync({ id: deal.id, accept: true, paymentMethod: method }), td.accept);

  const sendCounter = () => {
    const feeTk = Number(fee || 0);
    const d = Number(days || 0);
    viaCheckout(Math.max(0, feeTk - deal.heldTk), (method) => counter.mutateAsync({ id: deal.id, feeTk, days: d, paymentMethod: method }), td.sentToast);
  };

  const pct = deal.commissionPct;
  const field = "w-full rounded-lg border border-surface-line bg-bg px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent";

  return (
    <div className="rounded-2xl border border-surface-line bg-surface/50 p-4" data-testid="coaching-deal">
      <div className="flex items-start gap-3">
        <Avatar dpUrl={other.dpUrl} name={other.name} size="md" mode="static" shape={viewer === "coach" ? "square" : "circle"} />
        <div className="min-w-0 flex-1">
          <Link href={otherHref} className="block truncate text-sm font-bold text-ink hover:text-accent-ink">
            {other.name}
          </Link>
          <div className="text-[11px] text-ink-faint">{deal.origin === "coach" ? td.fromCoach : td.fromClub}</div>
        </div>
        <StatusPill tone={STATUS_TONE[deal.status]}>{td.status[deal.status]}</StatusPill>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-surface-line bg-bg/40 p-3 text-center">
        <div>
          <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-ink-faint">{td.fee}</div>
          <div className="font-display text-lg font-black text-ink">{tk(deal.feeTk)}</div>
        </div>
        <div>
          <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-ink-faint">{td.days}</div>
          <div className="font-display text-lg font-black text-ink">{format(td.daysValue, { days: deal.days })}</div>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-ink-soft">
        {format(viewer === "coach" ? td.net : td.netClub, { amount: tk(deal.netTk), pct })}
      </p>
      <p className="mt-1 text-[11px] text-ink-faint">
        {deal.status === "pending"
          ? `${myTurn ? td.yourTurn : td.theirTurn} · ${format(td.expires, { date: formatShortDate(deal.expiresAt, locale) })}`
          : deal.status === "scheduled" && deal.startedAt
            ? format(td.startsOn, { date: formatShortDate(deal.startedAt, locale) })
            : deal.status === "active" && deal.endsAt
              ? format(td.runsUntil, { date: formatShortDate(deal.endsAt, locale) })
              : null}
      </p>
      {deal.message ? <p className="mt-2 rounded-lg bg-bg/50 px-3 py-2 text-xs italic text-ink-soft">“{deal.message}”</p> : null}

      {canAct && mode === "counter" ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[11px] font-semibold text-ink-soft">{td.fee}</span>
            <input aria-label={td.fee} value={fee} onChange={(e) => setFee(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={`mt-1 ${field}`} />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-ink-soft">
              {td.days}
              {settings ? ` (${format(td.lengthHint, { min: settings.minDays, max: settings.maxDays })})` : ""}
            </span>
            <input aria-label={td.days} value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={`mt-1 ${field}`} />
          </label>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-2 text-xs font-semibold text-danger-ink">
          {error}
        </p>
      ) : null}

      {canAct ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {myTurn && mode === "idle" ? (
            <>
              <button type="button" disabled={busy} onClick={accept} className="rounded-full bg-accent px-4 py-1.5 text-xs font-black text-bg disabled:opacity-50">
                {viewer === "club" && deal.feeTk > deal.heldTk ? format(td.acceptPay, { amount: tk(deal.feeTk - deal.heldTk) }) : td.accept}
              </button>
              <button type="button" disabled={busy} onClick={() => setMode("counter")} className="rounded-full border border-surface-line-strong px-4 py-1.5 text-xs font-semibold text-ink-soft hover:text-ink">
                {td.counter}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => respond.mutateAsync({ id: deal.id, accept: false }), td.decline)}
                className="rounded-full border border-danger/40 px-4 py-1.5 text-xs font-semibold text-danger-ink hover:bg-danger-soft"
              >
                {td.decline}
              </button>
            </>
          ) : null}
          {myTurn && mode === "counter" ? (
            <>
              <button type="button" disabled={busy} onClick={sendCounter} className="rounded-full bg-accent px-4 py-1.5 text-xs font-black text-bg disabled:opacity-50">
                {td.sendCounter}
              </button>
              <button type="button" onClick={() => setMode("idle")} className="rounded-full border border-surface-line-strong px-4 py-1.5 text-xs font-semibold text-ink-soft">
                {t.dashboard.transfers.close}
              </button>
            </>
          ) : null}
          {deal.status === "pending" && !myTurn ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => cancel.mutateAsync(deal.id), td.withdraw)}
              className="rounded-full border border-surface-line-strong px-4 py-1.5 text-xs font-semibold text-ink-soft hover:text-ink"
            >
              {td.withdraw}
            </button>
          ) : null}
          {deal.status === "active" || deal.status === "scheduled" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (window.confirm(td.endConfirm)) void run(() => end.mutateAsync(deal.id), td.end);
              }}
              className="rounded-full border border-danger/40 px-4 py-1.5 text-xs font-semibold text-danger-ink hover:bg-danger-soft"
            >
              {td.end}
            </button>
          ) : null}
        </div>
      ) : null}

      {paying ? (
        <PaymentModal
          amountTk={paying.amountTk}
          payeeName={deal.coach.name}
          purpose={t.coaching.deals.title}
          balanceTk={clubBalanceTk}
          onPay={paying.run}
          onClose={() => setPaying(null)}
        />
      ) : null}
    </div>
  );
}
