"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSaveSponsorProfile } from "@/lib/api/hooks/useSponsors";
import type { SponsorProfile } from "@/lib/api/sponsors";
import { apiMessage } from "@/lib/api/creators";
import { BrandLogo, VerifiedTick } from "./BrandLogo";

/** The sponsor's brand: name, tagline, links, logo and banner (with previews). */
export function SponsorProfileForm({
  profile,
  onSaved,
  onError,
}: {
  profile: SponsorProfile | null;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const { t } = useLanguage();
  const tp = t.sponsors.profile;
  const save = useSaveSponsorProfile();
  const [form, setForm] = useState({
    brandName: profile?.brandName ?? "",
    tagline: profile?.tagline ?? "",
    about: profile?.about ?? "",
    industry: profile?.industry ?? "",
    website: profile?.website ?? "",
    facebookUrl: profile?.facebookUrl ?? "",
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const logoUrl = useMemo(() => (logo ? URL.createObjectURL(logo) : (profile?.logoUrl ?? null)), [logo, profile?.logoUrl]);
  const bannerUrl = useMemo(() => (banner ? URL.createObjectURL(banner) : (profile?.bannerUrl ?? null)), [banner, profile?.bannerUrl]);
  useEffect(() => () => [logo && logoUrl, banner && bannerUrl].forEach((u) => u && URL.revokeObjectURL(u)), [logo, banner, logoUrl, bannerUrl]);

  const field = "w-full rounded-xl border border-surface-line-strong bg-bg-raised px-3 py-2.5 text-sm text-ink outline-none focus:border-accent";
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form
      className="space-y-5 rounded-2xl border border-surface-line bg-surface/50 p-4 sm:p-6"
      data-testid="sponsor-profile-form"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await save.mutateAsync({ ...form, logo, banner });
          setLogo(null);
          setBanner(null);
          onSaved(tp.saved);
        } catch (err) {
          onError(apiMessage(err, t.coaching.deals.errGeneric));
        }
      }}
    >
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg font-black text-ink">{tp.title}</h2>
        {profile?.verifiedAt ? <VerifiedTick label={tp.verified} /> : null}
      </div>

      {/* Banner + logo, as they appear on sponsored pages */}
      <div className="overflow-hidden rounded-2xl border border-surface-line bg-bg-raised">
        <div className="relative aspect-[4/1] w-full bg-gradient-to-r from-surface to-surface-line">
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="flex items-center gap-3 p-3">
          <BrandLogo name={form.brandName || "?"} logoUrl={logoUrl} size="lg" />
          <div className="min-w-0">
            <div className="truncate font-display text-base font-black text-ink">{form.brandName || tp.brandName}</div>
            <div className="truncate text-xs text-ink-soft">{form.tagline}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { key: "logo", label: tp.logo, hint: tp.logoHint, set: setLogo },
          { key: "banner", label: tp.banner, hint: tp.bannerHint, set: setBanner },
        ].map((f) => (
          <label key={f.key} className="flex cursor-pointer flex-col gap-1 rounded-xl border border-dashed border-surface-line-strong p-3 hover:border-accent">
            <span className="text-xs font-semibold text-ink">
              {f.label} · <span className="text-accent-ink">{tp.upload}</span>
            </span>
            <span className="text-[11px] text-ink-faint">{f.hint}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              data-testid={`sponsor-${f.key}`}
              onChange={(e) => f.set(e.target.files?.[0] ?? null)}
            />
          </label>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-ink-soft">{tp.brandName}</span>
          <input required minLength={2} maxLength={80} value={form.brandName} onChange={set("brandName")} className={field} data-testid="sponsor-brand-name" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-ink-soft">{tp.industry}</span>
          <input maxLength={60} value={form.industry} onChange={set("industry")} placeholder={tp.industryPlaceholder} className={field} />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-xs font-semibold text-ink-soft">{tp.tagline}</span>
          <input maxLength={140} value={form.tagline} onChange={set("tagline")} placeholder={tp.taglinePlaceholder} className={field} />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-xs font-semibold text-ink-soft">{tp.about}</span>
          <textarea rows={3} maxLength={2000} value={form.about} onChange={set("about")} className={field} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-ink-soft">{tp.website}</span>
          <input type="url" maxLength={500} value={form.website} onChange={set("website")} placeholder="https://" className={field} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-ink-soft">{tp.facebook}</span>
          <input type="url" maxLength={500} value={form.facebookUrl} onChange={set("facebookUrl")} placeholder="https://facebook.com/…" className={field} />
        </label>
      </div>

      <button type="submit" disabled={save.isPending} className="rounded-full bg-accent px-6 py-2.5 font-display text-sm font-black text-bg disabled:opacity-50">
        {save.isPending ? "…" : tp.save}
      </button>
    </form>
  );
}
