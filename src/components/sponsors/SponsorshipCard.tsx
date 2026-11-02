"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useCancelSponsorship, useEndSponsorship, useRespondSponsorship } from "@/lib/api/hooks/useSponsors";
import { apiMessage } from "@/lib/api/creators";
import type { Sponsorship, SponsorshipStatus } from "@/lib/api/sponsors";
import { formatShortDate } from "@/components/dashboard/fixtures/labels";
import { tk } from "@/components/dashboard/transfers/shared";
import { BrandLogo, VerifiedTick } from "./BrandLogo";
import { SponsorshipModal } from "./SponsorshipModal";

type Toast = (message: string, variant?: "success" | "error") => void;

const STATUS_CLASS: Record<SponsorshipStatus, string> = {
  pending: "bg-warning-soft text-warning-ink",
  active: "bg-success-soft text-success-ink",
  completed: "bg-surface text-ink-soft",
  declined: "bg-danger-soft text-danger-ink",
  cancelled: "bg-surface text-ink-faint",
  expired: "bg-surface text-ink-faint",
  ended: "bg-surface text-ink-soft",
};

/**
 * A sponsorship deal, from either side: who sponsors what, the terms and their history,
 * and the actions open to the viewer (accept / decline / counter on their turn, withdraw,
 * end an active one).
 */
export function SponsorshipCard({
  deal,
  side,
  commissionPct,
  onToast,
}: {
  deal: Sponsorship;
  /** The viewer's side: the sponsor, or the tournament's / community's leaders. */
  side: "sponsor" | "host";
  commissionPct: number;
  onToast: Toast;
}) {
  const { t, locale } = useLanguage();
  const td = t.sponsors.deals;
  const respond = useRespondSponsorship();
  const cancel = useCancelSponsorship();
  const end = useEndSponsorship();
  const [countering, setCountering] = useState(false);
  const myTurn = deal.status === "pending" && deal.turn === side;
  const busy = respond.isPending || cancel.isPending || end.isPending;
  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      onToast(message, "success");
    } catch (err) {
      onToast(apiMessage(err, t.coaching.deals.errGeneric), "error");
    }
  };
  const btn = "rounded-full px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50";

  return (
    <article className="space-y-3 rounded-2xl border border-surface-line bg-surface/50 p-4" data-testid="sponsorship-card">
      <div className="flex items-start gap-3">
        {side === "host" ? (
          <BrandLogo name={deal.sponsor.brandName} logoUrl={deal.sponsor.logoUrl} size="md" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft font-display text-lg font-black text-accent-ink">
            {deal.target.type === "tournament" ? "🏆" : "👥"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {side === "host" ? (
              <Link href={`/dashboard/efootball/sponsors/${deal.sponsor.id}`} className="truncate font-display text-sm font-black text-ink hover:underline">
                {deal.sponsor.brandName}
              </Link>
            ) : (
              <Link href={deal.target.link} className="truncate font-display text-sm font-black text-ink hover:underline">
                {deal.target.name}
              </Link>
            )}
            {side === "host" && deal.sponsor.verified ? <VerifiedTick label={t.sponsors.profile.verified} /> : null}
          </div>
          <div className="text-[11px] text-ink-faint">
            {deal.target.type === "tournament" ? td.tournament : td.community} · {t.sponsors.tiers[deal.tier]} ·{" "}
            {deal.days ? format(td.days, { n: deal.days }) : td.untilEnd}
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${STATUS_CLASS[deal.status]}`}>
          {t.sponsors.status[deal.status]}
        </span>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-bg-raised/70 px-3 py-2">
        <span className="font-display text-lg font-black text-ink">{tk(deal.amountTk)}</span>
        <span className="text-[11px] text-ink-faint">{format(td.theyGet, { net: tk(deal.netTk), pct: deal.commissionPct || commissionPct })}</span>
      </div>
      {deal.status === "pending" && deal.heldTk > 0 && side === "sponsor" ? (
        <p className="text-[11px] text-ink-soft">{format(td.held, { amount: tk(deal.heldTk) })}</p>
      ) : null}
      {deal.status === "active" && deal.endsAt ? (
        <p className="text-[11px] text-ink-soft">{format(td.endsOn, { date: formatShortDate(deal.endsAt, locale) })}</p>
      ) : null}

      {deal.bids.length ? (
        <details className="text-xs text-ink-soft">
          <summary className="cursor-pointer font-semibold">{td.history} ({deal.bids.length})</summary>
          <ul className="mt-2 space-y-1.5">
            {deal.bids.map((b, i) => (
              <li key={i} className="rounded-lg bg-surface/70 px-2.5 py-1.5">
                <b className="text-ink">{b.party === "sponsor" ? deal.sponsor.brandName : deal.target.name}</b> · {tk(b.amountTk)} · {t.sponsors.tiers[b.tier]}
                {b.days ? ` · ${format(td.days, { n: b.days })}` : ""}
                {b.message ? <div className="mt-0.5 text-ink-faint">“{b.message}”</div> : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {deal.status === "pending" ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-surface-line pt-3">
          {myTurn ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => respond.mutateAsync({ id: deal.id, accept: true }), td.accepted)}
                className={`${btn} bg-accent text-bg hover:brightness-110`}
                data-testid="sponsorship-accept"
              >
                {side === "sponsor" ? `${td.accept} · ${tk(deal.amountTk)}` : td.acceptHost}
              </button>
              <button type="button" disabled={busy} onClick={() => setCountering(true)} className={`${btn} border border-surface-line-strong text-ink-soft hover:text-ink`}>
                {td.counter}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => respond.mutateAsync({ id: deal.id, accept: false }), td.declined)}
                className={`${btn} text-danger-ink hover:bg-danger-soft`}
              >
                {td.decline}
              </button>
            </>
          ) : (
            <>
              <span className="text-[11px] font-semibold text-ink-faint">{td.theirTurn}</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => cancel.mutateAsync(deal.id), td.cancelled)}
                className={`${btn} ml-auto text-danger-ink hover:bg-danger-soft`}
              >
                {td.cancel}
              </button>
            </>
          )}
        </div>
      ) : deal.status === "active" ? (
        <div className="flex justify-end border-t border-surface-line pt-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => window.confirm(td.endConfirm) && run(() => end.mutateAsync(deal.id), td.ended)}
            className={`${btn} text-danger-ink hover:bg-danger-soft`}
          >
            {td.end}
          </button>
        </div>
      ) : null}

      {countering ? (
        <SponsorshipModal deal={{ ...deal, mySide: side }} commissionPct={commissionPct} onClose={() => setCountering(false)} onToast={onToast} />
      ) : null}
    </article>
  );
}
