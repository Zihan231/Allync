"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { Avatar } from "@/components/common/Avatar";
import { formatShortDate } from "@/components/dashboard/fixtures/labels";
import { tk } from "@/components/dashboard/transfers/shared";
import { CoachShell } from "@/components/coaching/CoachShell";
import { CoachProfileForm } from "@/components/coaching/CoachProfileForm";
import { CoachingDealCard } from "@/components/coaching/CoachingDealCard";

/** Coach dashboard: where he coaches now, what he earned, and the deals that need him. */
export default function CoachOverviewPage() {
  const { t, locale } = useLanguage();
  const tc = t.coaching.coach;

  return (
    <CoachShell title={tc.title} subtitle={tc.subtitle}>
      {(data, toast) => {
        const pending = data.posts.filter((p) => p.status === "pending").length;
        const approved = data.posts.filter((p) => p.status === "approved").length;
        const openDeals = data.deals.filter((d) => d.status === "pending").length;
        const live = data.deals.filter((d) => ["pending", "scheduled", "active"].includes(d.status));
        return (
          <div className="space-y-6">
            {!data.profile ? <CoachProfileForm profile={null} onSaved={(m) => toast(m, "success")} /> : null}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-surface-line bg-surface/50 p-4 sm:col-span-2">
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{tc.currentClub}</div>
                {data.current ? (
                  <Link href={`/dashboard/efootball/clubs/${data.current.club.id}`} className="mt-2 flex items-center gap-3">
                    <Avatar dpUrl={data.current.club.dpUrl} name={data.current.club.name} size="md" mode="static" shape="square" />
                    <div>
                      <div className="font-display text-base font-black text-ink">{data.current.club.name}</div>
                      {data.current.endsAt ? (
                        <div className="text-xs text-ink-soft">{format(tc.endsOn, { date: formatShortDate(data.current.endsAt, locale) })}</div>
                      ) : null}
                    </div>
                  </Link>
                ) : (
                  <p className="mt-2 text-sm text-ink-soft">{tc.noClub}</p>
                )}
              </div>
              <div className="rounded-2xl border border-surface-line bg-surface/50 p-4">
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{tc.earned}</div>
                <div className="mt-2 font-display text-2xl font-black text-ink" data-testid="coach-earned">
                  {tk(data.earnedTk)}
                </div>
                <div className="text-[11px] text-ink-faint">{format(tc.earnedHint, { pct: data.settings.commissionPct })}</div>
              </div>
              <Link href="/dashboard/coach/deals" className="rounded-2xl border border-surface-line bg-surface/50 p-4 hover:border-accent/50">
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{tc.openDeals}</div>
                <div className="mt-2 font-display text-2xl font-black text-ink">{openDeals}</div>
                <div className="text-[11px] text-ink-faint">
                  {tc.approvedPosts}: {approved} · {tc.pendingPosts}: {pending}
                </div>
              </Link>
            </div>
            {live.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {live.map((d) => (
                  <CoachingDealCard key={d.id} deal={d} viewer="coach" canAct settings={data.settings} onToast={toast} />
                ))}
              </div>
            ) : null}
          </div>
        );
      }}
    </CoachShell>
  );
}
