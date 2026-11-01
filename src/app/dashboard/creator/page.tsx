"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { tk } from "@/components/dashboard/transfers/shared";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SpikeIcon } from "@/components/icons";
import { FeedPreview } from "@/components/feed/FeedPreview";
import { CreatorShell } from "@/components/creators/CreatorShell";
import { DesignPreview, DesignStatusChip, designStatus } from "@/components/creators/DesignPreview";
import type { CreatorCategory } from "@/lib/api/creators";

/** Creator dashboard: earnings after the cut, best sellers, and designs that need the creator. */
export default function CreatorOverviewPage() {
  const { t } = useLanguage();
  const tc = t.creators;
  const td = tc.dashboard;

  return (
    <CreatorShell title={tc.shell.title} subtitle={tc.shell.subtitle}>
      {(data) => {
        const best = data.designs.filter((d) => d.salesCount > 0).sort((a, b) => b.salesCount - a.salesCount).slice(0, 4);
        const attention = data.designs.filter((d) => ["rejected", "pending", "changePending"].includes(designStatus(d))).slice(0, 4);
        const stats = [
          { label: td.earned, value: tk(data.stats.earnedTk), hint: format(td.earnedHint, { pct: data.commissionPct }), testId: "creator-earned" },
          { label: td.sales, value: String(data.stats.sales) },
          { label: td.live, value: String(data.stats.live) },
          { label: td.inReview, value: String(data.stats.inReview) },
        ];
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-surface-line bg-surface/50 p-4">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{s.label}</div>
                  <div className="mt-2 font-display text-2xl font-black text-ink" data-testid={s.testId}>
                    {s.value}
                  </div>
                  {s.hint ? <div className="text-[11px] text-ink-faint">{s.hint}</div> : null}
                </div>
              ))}
            </div>

            {!data.designs.length ? (
              <EmptyState icon={SpikeIcon} title={td.noDesigns} body={td.noDesignsBody} action={{ label: td.submitFirst, href: "/dashboard/creator/new" }} />
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {[
                  { title: td.needsYou, list: attention },
                  { title: td.bestSellers, list: best },
                ].map(({ title, list }) =>
                  list.length ? (
                    <section key={title} className="space-y-3">
                      <h2 className="font-display text-base font-black text-ink">{title}</h2>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {list.map((d) => (
                          <Link
                            key={d.id}
                            href="/dashboard/creator/designs"
                            className="space-y-2 rounded-2xl border border-surface-line bg-surface/50 p-3 transition-colors hover:border-accent/50"
                          >
                            <DesignPreview category={d.category as CreatorCategory} name={d.name} assets={d.assets} rarity={d.metadata?.rarity} size="sm" />
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-bold text-ink">{d.name}</span>
                              <DesignStatusChip design={d} />
                            </div>
                            <div className="text-[11px] text-ink-faint">
                              {format(tc.designs.salesCount, { n: d.salesCount })} · {tk(d.priceTk)}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </section>
                  ) : null,
                )}
              </div>
            )}
            <FeedPreview />
          </div>
        );
      }}
    </CreatorShell>
  );
}
