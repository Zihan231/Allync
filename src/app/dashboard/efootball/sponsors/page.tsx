"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import { useSponsors, useTargetSponsors } from "@/lib/api/hooks/useSponsors";
import type { SponsorCard, SponsorTargetType } from "@/lib/api/sponsors";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { BrandLogo, VerifiedTick } from "@/components/sponsors/BrandLogo";
import { SponsorshipModal } from "@/components/sponsors/SponsorshipModal";

/** The target an organizer came from ("Find sponsors" on a tournament or community: ?for=tournament:<id>). */
function useAskTarget(): { type: SponsorTargetType; id: string; name: string; commissionPct: number } | null {
  const raw = useSearchParams().get("for");
  const { user } = useSession();
  const [type, id] = raw?.split(":") ?? [];
  const valid = (type === "tournament" || type === "community") && Boolean(id);
  const { data } = useTargetSponsors(valid ? (type as SponsorTargetType) : "community", valid ? id : user.community?.id);
  if (!data?.canManage) return null;
  // From a tournament or community page, or else the community the user leads.
  return { type: data.target.type, id: data.target.id, name: data.target.name, commissionPct: data.commissionPct };
}

function SponsorDirectory() {
  const { t } = useLanguage();
  const td = t.sponsors.directory;
  const [search, setSearch] = useState("");
  const [verified, setVerified] = useState(false);
  const { data, isLoading } = useSponsors({ search: search || undefined, verified, limit: 40 });
  const askTarget = useAskTarget();
  const { toasts, toast, dismiss } = useToast();
  const [asking, setAsking] = useState<SponsorCard | null>(null);

  return (
    <div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <PageHeader eyebrow="ALLYNQ" title={td.title} description={td.subtitle} />
      {askTarget ? (
        <p className="mt-4 rounded-xl bg-accent-soft px-4 py-2.5 text-sm text-accent-ink">
          {format(td.askingFor, { name: askTarget.name })}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={td.search}
          className="w-full max-w-xs rounded-full border border-surface-line-strong bg-bg-raised px-4 py-2 text-sm text-ink outline-none focus:border-accent"
        />
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
          {td.verifiedOnly}
        </label>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? [0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-surface" />)
          : (data?.data ?? []).map((s) => (
              <article key={s.userId} className="flex flex-col overflow-hidden rounded-2xl border border-surface-line bg-surface/60" data-testid="sponsor-card">
                <Link href={`/dashboard/efootball/sponsors/${s.userId}`} className="block">
                  <div className="relative aspect-[4/1] w-full bg-gradient-to-r from-surface to-surface-line">
                    {s.bannerUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3 p-4">
                    <BrandLogo name={s.brandName} logoUrl={s.logoUrl} size="lg" className="relative z-10 -mt-10 border-4 border-bg" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-display text-base font-black text-ink">{s.brandName}</span>
                        {s.verified ? <VerifiedTick label={t.sponsors.profile.verified} /> : null}
                      </div>
                      <div className="truncate text-xs text-ink-soft">{s.tagline || s.industry}</div>
                    </div>
                  </div>
                </Link>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-surface-line px-4 py-3">
                  <span className="text-[11px] text-ink-faint">{format(td.sponsorships, { n: s.sponsorships })}</span>
                  {askTarget ? (
                    <button type="button" onClick={() => setAsking(s)} className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-bold text-bg" data-testid="ask-sponsor">
                      {td.ask}
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
      </div>
      {!isLoading && !data?.data.length ? <p className="mt-10 text-center text-sm text-ink-faint">{td.empty}</p> : null}

      {asking && askTarget ? (
        <SponsorshipModal
          target={askTarget}
          sponsor={{ id: asking.userId, brandName: asking.brandName }}
          commissionPct={askTarget.commissionPct}
          onClose={() => setAsking(null)}
          onToast={toast}
        />
      ) : null}
    </div>
  );
}

/** The sponsor directory; organizers coming from "Find sponsors" can ask a sponsor from here. */
export default function SponsorsPage() {
  return (
    <Suspense fallback={null}>
      <SponsorDirectory />
    </Suspense>
  );
}
