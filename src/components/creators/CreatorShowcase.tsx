"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useCreator } from "@/lib/api/hooks/useCreators";
import type { CreatorCategory } from "@/lib/api/creators";
import { Avatar } from "@/components/common/Avatar";
import { CoverPhoto } from "@/components/common/CoverPhoto";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { formatShortDate } from "@/components/dashboard/fixtures/labels";
import { tk } from "@/components/dashboard/transfers/shared";
import { SpikeIcon } from "@/components/icons";
import { DesignPreview } from "./DesignPreview";

/** A creator's public page: who they are and their designs on sale, each linking to the store. */
export function CreatorShowcase({ userId }: { userId: string }) {
  const { t, locale } = useLanguage();
  const tp = t.creators.publicPage;
  const { data, isLoading, isError } = useCreator(userId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-48 animate-pulse rounded-2xl bg-surface" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      </div>
    );
  }
  if (isError || !data) return <EmptyState icon={SpikeIcon} title={tp.notFound} body="" />;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-surface-line bg-surface/50">
        <CoverPhoto coverUrl={data.user.coverUrl} name={data.user.name} className="h-36 sm:h-48" hideInitial />
        <div className="-mt-10 flex flex-wrap items-end gap-4 px-4 pb-4 sm:px-6">
          <div className="rounded-full border-4 border-bg">
            <Avatar dpUrl={data.user.dpUrl} name={data.user.name} size="xl" mode="lightbox" />
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <h1 className="truncate font-display text-2xl font-black text-ink">{data.user.name}</h1>
            <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-soft">
              <span className="font-semibold text-accent-ink">{t.coaching.roles.names.creative}</span>
              <span>{format(tp.totalSales, { n: data.sales })}</span>
              <span>{format(tp.joined, { date: formatShortDate(data.user.joinedAt, locale) })}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-black text-ink">{tp.designsOnSale}</h2>
        {data.designs.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.designs.map((d) => (
              <Link
                key={d.id}
                href={`/dashboard/efootball/store?cat=${d.category}&creator=${data.user.id}`}
                className="space-y-2 rounded-2xl border border-surface-line bg-surface/50 p-3 transition-colors hover:border-accent/50"
              >
                <DesignPreview category={d.category as CreatorCategory} name={d.name} assets={d.assets} rarity={d.metadata?.rarity} size="sm" />
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold text-ink">{d.name}</span>
                  <span className="font-mono text-xs font-bold text-accent-ink">{d.priceTk ? tk(d.priceTk) : t.dashboard.store.free}</span>
                </div>
                <div className="text-[11px] text-ink-faint">{t.creators.categories[d.category as CreatorCategory]}</div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-surface-line-strong py-10 text-center text-sm text-ink-faint">{tp.empty}</p>
        )}
      </section>
    </div>
  );
}
