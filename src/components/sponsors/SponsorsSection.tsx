"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import { useCloseSponsorCall, useMySponsor, useOpenSponsorCall, useTargetSponsors } from "@/lib/api/hooks/useSponsors";
import { apiMessage } from "@/lib/api/creators";
import { SPONSOR_TIERS, type PublicSponsorship, type SponsorTargetType, type SponsorTier } from "@/lib/api/sponsors";
import { tk } from "@/components/dashboard/transfers/shared";
import { BrandLogo, VerifiedTick } from "./BrandLogo";
import { SponsorshipCard } from "./SponsorshipCard";
import { SponsorshipModal } from "./SponsorshipModal";
import { useSponsorImpression } from "./useSponsorImpressions";

type Toast = (message: string, variant?: "success" | "error") => void;

/** One sponsor's logo (and, for Title / Gold, their banner): counts views and clicks for their stats. */
function SponsorTile({ s, large }: { s: PublicSponsorship; large: boolean }) {
  const { t } = useLanguage();
  const { ref, onClick } = useSponsorImpression(s.id);
  return (
    <Link
      ref={ref as React.Ref<HTMLAnchorElement>}
      href={`/dashboard/efootball/sponsors/${s.sponsor.id}`}
      onClick={onClick}
      data-testid="sponsor-tile"
      className={`group overflow-hidden rounded-2xl border border-surface-line bg-surface/60 transition-colors hover:border-accent/50 ${large ? "sm:col-span-2" : ""}`}
    >
      {large && s.sponsor.bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.sponsor.bannerUrl} alt="" className="aspect-[4/1] w-full object-cover" data-testid="sponsor-banner" />
      ) : null}
      <div className="flex items-center gap-3 p-3">
        <BrandLogo name={s.sponsor.brandName} logoUrl={s.sponsor.logoUrl} size={large ? "lg" : "md"} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-display text-sm font-black text-ink">{s.sponsor.brandName}</span>
            {s.sponsor.verified ? <VerifiedTick label={t.sponsors.profile.verified} /> : null}
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-accent-ink">{t.sponsors.tiers[s.tier]}</span>
        </div>
      </div>
    </Link>
  );
}

/** The leaders' "Looking for sponsors" call: which tiers, what they offer, what they hope for. */
function CallForm({ type, id, onToast, existing }: { type: SponsorTargetType; id: string; onToast: Toast; existing: { id: string; tiers: SponsorTier[]; note: string | null; askTk: number | null } | null }) {
  const { t } = useLanguage();
  const tt = t.sponsors.target;
  const open = useOpenSponsorCall();
  const close = useCloseSponsorCall();
  const [editing, setEditing] = useState(false);
  const [tiers, setTiers] = useState<SponsorTier[]>(existing?.tiers ?? ["gold", "partner"]);
  const [note, setNote] = useState(existing?.note ?? "");
  const [ask, setAsk] = useState(existing?.askTk ?? 0);
  const field = "w-full rounded-xl border border-surface-line-strong bg-bg-raised px-3 py-2 text-sm text-ink outline-none focus:border-accent";

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {existing ? (
          <span className="rounded-full bg-success-soft px-3 py-1 text-[11px] font-bold text-success-ink">● {tt.lookingFor}</span>
        ) : null}
        <button type="button" onClick={() => setEditing(true)} className="rounded-full border border-surface-line-strong px-4 py-1.5 text-xs font-semibold text-ink-soft hover:text-ink" data-testid="sponsor-call-button">
          {existing ? tt.editCall : tt.openCall}
        </button>
        {existing ? (
          <button
            type="button"
            disabled={close.isPending}
            onClick={async () => {
              try {
                await close.mutateAsync(existing.id);
                onToast(tt.callClosed, "success");
              } catch (err) {
                onToast(apiMessage(err, t.coaching.deals.errGeneric), "error");
              }
            }}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-danger-ink hover:bg-danger-soft"
          >
            {tt.closeCall}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-surface-line bg-bg-raised/70 p-3">
      <p className="text-[11px] text-ink-faint">{tt.lookingForHint}</p>
      <div>
        <div className="mb-1 text-xs font-semibold text-ink-soft">{tt.callTiers}</div>
        <div className="flex flex-wrap gap-2">
          {SPONSOR_TIERS.map((x) => (
            <label key={x} className="flex items-center gap-1.5 text-xs text-ink">
              <input type="checkbox" checked={tiers.includes(x)} onChange={(e) => setTiers((list) => (e.target.checked ? [...list, x] : list.filter((y) => y !== x)))} />
              {t.sponsors.tiers[x]}
            </label>
          ))}
        </div>
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-semibold text-ink-soft">{tt.callNote}</span>
        <textarea rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={tt.callNotePlaceholder} className={field} />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-semibold text-ink-soft">{tt.callAsk}</span>
        <input type="number" min={0} value={ask} onChange={(e) => setAsk(Math.max(0, Math.floor(Number(e.target.value) || 0)))} className={field} />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={open.isPending || !tiers.length}
          onClick={async () => {
            try {
              await open.mutateAsync({ targetType: type, targetId: id, tiers, note: note || undefined, askTk: ask || undefined });
              onToast(tt.callSaved, "success");
              setEditing(false);
            } catch (err) {
              onToast(apiMessage(err, t.coaching.deals.errGeneric), "error");
            }
          }}
          className="rounded-full bg-accent px-4 py-2 text-xs font-bold text-bg disabled:opacity-50"
        >
          {tt.openCall}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="rounded-full px-3 py-2 text-xs font-semibold text-ink-soft">
          {t.sponsors.modal.close}
        </button>
      </div>
    </div>
  );
}

/**
 * Sponsors of a tournament or community: tiered logos (Title and Gold with their banners),
 * and for its leaders the incoming requests, "Find sponsors" and the open call. Sponsors
 * visiting the page get "Sponsor this".
 */
export function SponsorsSection({ type, id, name, onToast }: { type: SponsorTargetType; id: string; name: string; onToast: Toast }) {
  const { t } = useLanguage();
  const tt = t.sponsors.target;
  const { user } = useSession();
  const { data } = useTargetSponsors(type, id);
  const isSponsor = user.roles.includes("sponsor");
  const mine = useMySponsor(isSponsor);
  const [offering, setOffering] = useState(false);
  if (!data) return null;
  const commissionPct = data.commissionPct;
  const alreadyMine = data.sponsors.some((s) => s.sponsorUserId === user.id) || (mine.data?.deals ?? []).some((d) => d.status === "pending" && d.target.id === id);
  const canOffer = isSponsor && !data.canManage && !alreadyMine && Boolean(mine.data?.profile?.brandName);
  if (!data.sponsors.length && !data.canManage && !canOffer) return null;

  return (
    <section className="space-y-4 rounded-2xl border border-surface-line bg-surface/40 p-4 sm:p-5" data-testid="sponsors-section">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-black text-ink">{tt.sponsors}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {data.canManage ? (
            <Link
              href={`/dashboard/efootball/sponsors?for=${type}:${id}`}
              className="rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-bg hover:brightness-110"
              data-testid="find-sponsors"
            >
              {tt.findSponsors}
            </Link>
          ) : null}
          {canOffer ? (
            <button type="button" onClick={() => setOffering(true)} className="rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-bg hover:brightness-110" data-testid="sponsor-this">
              {tt.becomeSponsor}
            </button>
          ) : null}
        </div>
      </div>

      {!data.canManage && data.call ? (
        <p className="rounded-xl bg-success-soft px-3 py-2 text-xs text-success-ink">
          ● {tt.lookingFor}
          {data.call.note ? `: ${data.call.note}` : ""}
          {data.call.askTk ? ` (${tk(data.call.askTk)})` : ""}
        </p>
      ) : null}

      {data.sponsors.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.sponsors.map((s) => (
            <SponsorTile key={s.id} s={s} large={s.tier !== "partner"} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-faint">{tt.noSponsors}</p>
      )}

      {data.canManage ? (
        <div className="space-y-3 border-t border-surface-line pt-4">
          <CallForm key={data.call?.id ?? "new"} type={type} id={id} onToast={onToast} existing={data.call} />
          {data.pending.length ? (
            <>
              <h3 className="font-display text-sm font-black text-ink">{tt.requests}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {data.pending.map((d) => (
                  <SponsorshipCard key={d.id} deal={d} side="host" commissionPct={d.commissionPct || commissionPct} onToast={onToast} />
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {offering ? (
        <SponsorshipModal
          target={{ type, id, name }}
          commissionPct={commissionPct}
          minDays={mine.data?.settings.minDays}
          maxDays={mine.data?.settings.maxDays}
          onClose={() => setOffering(false)}
          onToast={onToast}
        />
      ) : null}
    </section>
  );
}

/** "presented by <Title sponsor>" next to a tournament's or community's name. */
export function PresentedBy({ type, id, className = "" }: { type: SponsorTargetType; id: string; className?: string }) {
  const { t } = useLanguage();
  const { data } = useTargetSponsors(type, id);
  const title = data?.title;
  const { ref, onClick } = useSponsorImpression(title?.id);
  if (!title) return null;
  return (
    <Link
      ref={ref as React.Ref<HTMLAnchorElement>}
      href={`/dashboard/efootball/sponsors/${title.sponsor.id}`}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 py-0.5 pl-0.5 pr-2.5 text-[11px] font-semibold text-white backdrop-blur hover:border-accent ${className}`}
      data-testid="presented-by"
    >
      <BrandLogo name={title.sponsor.brandName} logoUrl={title.sponsor.logoUrl} size="xs" className="!rounded-full" />
      {format(t.sponsors.target.presentedBy, { brand: title.sponsor.brandName })}
    </Link>
  );
}
