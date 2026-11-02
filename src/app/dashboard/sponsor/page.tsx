"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { tk } from "@/components/dashboard/transfers/shared";
import { FeedPreview } from "@/components/feed/FeedPreview";
import { SponsorShell } from "@/components/sponsors/SponsorShell";
import { SponsorshipCard } from "@/components/sponsors/SponsorshipCard";

/** Sponsor dashboard: reach (logo / banner views, clicks, post reach), money spent, and deals that need an answer. */
export default function SponsorOverviewPage() {
  const { t } = useLanguage();
  const ts = t.sponsors;
  const st = ts.stats;

  return (
    <SponsorShell title={ts.shell.title} subtitle={ts.shell.subtitle}>
      {(data, toast) => {
        const waiting = data.deals.filter((d) => d.status === "pending" && d.turn === "sponsor");
        const active = data.deals.filter((d) => d.status === "active");
        const max = Math.max(1, ...data.stats.daily.map((d) => d.views));
        const tiles = [
          { label: st.views, value: data.stats.views.toLocaleString() },
          { label: st.clicks, value: data.stats.clicks.toLocaleString() },
          { label: st.postReach, value: data.stats.posts.reach.toLocaleString(), hint: `${st.engagement}: ${data.stats.posts.likes} · ${data.stats.posts.comments} · ${data.stats.posts.saves}` },
          { label: st.spent, value: tk(data.spentTk), testId: "sponsor-spent" },
        ];
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {tiles.map((s) => (
                <div key={s.label} className="rounded-2xl border border-surface-line bg-surface/50 p-4">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{s.label}</div>
                  <div className="mt-2 font-display text-2xl font-black text-ink" data-testid={s.testId}>
                    {s.value}
                  </div>
                  {s.hint ? <div className="text-[11px] text-ink-faint">{s.hint}</div> : null}
                </div>
              ))}
            </div>

            {data.stats.daily.length ? (
              <section className="rounded-2xl border border-surface-line bg-surface/50 p-4">
                <h2 className="font-display text-sm font-black text-ink">
                  {st.views} · {st.last14}
                </h2>
                <div className="mt-3 flex h-24 items-end gap-1.5">
                  {data.stats.daily.map((d) => (
                    <div key={d.day} className="flex flex-1 flex-col items-center gap-1" title={`${d.day}: ${d.views} / ${d.clicks}`}>
                      <div className="w-full rounded-t bg-accent/70" style={{ height: `${Math.max(4, (d.views / max) * 80)}px` }} />
                      <span className="font-mono text-[9px] text-ink-faint">{d.day.slice(8)}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {[
              { title: st.waiting, list: waiting },
              { title: st.active, list: active },
            ].map(({ title, list }) =>
              list.length ? (
                <section key={title} className="space-y-3">
                  <h2 className="font-display text-base font-black text-ink">{title}</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {list.map((d) => (
                      <SponsorshipCard key={d.id} deal={d} side="sponsor" commissionPct={data.settings.commissionPct} onToast={toast} />
                    ))}
                  </div>
                </section>
              ) : null,
            )}

            {!waiting.length && !active.length ? (
              <Link
                href="/dashboard/sponsor/opportunities"
                className="flex items-center justify-between rounded-2xl border border-dashed border-surface-line-strong p-5 text-sm text-ink-soft hover:border-accent"
              >
                <span>{ts.opportunities.subtitle}</span>
                <span className="font-bold text-accent-ink">{ts.nav.opportunities} →</span>
              </Link>
            ) : null}
            <FeedPreview />
          </div>
        );
      }}
    </SponsorShell>
  );
}
