"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSponsorCalls } from "@/lib/api/hooks/useSponsors";
import { useTournaments } from "@/lib/api/hooks/useTournaments";
import { getCommunities } from "@/lib/api/communities";
import type { SponsorTargetType } from "@/lib/api/sponsors";
import { Avatar } from "@/components/common/Avatar";
import { formatShortDate } from "@/components/dashboard/fixtures/labels";
import { tk } from "@/components/dashboard/transfers/shared";
import { SponsorShell } from "@/components/sponsors/SponsorShell";
import { SponsorshipModal } from "@/components/sponsors/SponsorshipModal";

type Target = { type: SponsorTargetType; id: string; name: string };

/** Where to sponsor: open calls first, then upcoming tournaments (community and general) and communities. */
export default function SponsorOpportunitiesPage() {
  const { t, locale } = useLanguage();
  const to = t.sponsors.opportunities;
  const calls = useSponsorCalls();
  const tournaments = useTournaments({ status: "registration_open" });
  const communities = useQuery({ queryKey: ["communities", "sponsor-opportunities"], queryFn: () => getCommunities() });
  const [target, setTarget] = useState<Target | null>(null);
  const card = "flex items-center gap-3 rounded-2xl border border-surface-line bg-surface/50 p-3";
  const offerBtn = "shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-xs font-bold text-bg hover:brightness-110";

  return (
    <SponsorShell title={to.title} subtitle={to.subtitle}>
      {(data, toast) => (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="font-display text-base font-black text-ink">{to.calls}</h2>
            {calls.data?.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {calls.data.map((c) => (
                  <article key={c.id} className="space-y-2 rounded-2xl border border-success/40 bg-success-soft/30 p-4" data-testid="sponsor-call">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={c.link ?? "#"} className="block truncate font-display text-sm font-black text-ink hover:underline">
                          {c.name}
                        </Link>
                        <div className="text-[11px] text-ink-faint">
                          {c.targetType === "tournament" ? t.sponsors.deals.tournament : t.sponsors.deals.community}
                          {c.hostName ? ` · ${c.hostName}` : ""}
                          {c.startAt ? ` · ${formatShortDate(c.startAt, locale)}` : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        className={offerBtn}
                        onClick={() => setTarget({ type: c.targetType, id: (c.tournamentId ?? c.communityId)!, name: c.name ?? "" })}
                      >
                        {to.sponsor}
                      </button>
                    </div>
                    <div className="text-xs text-ink-soft">
                      {format(to.wants, { tiers: c.tiers.map((x) => t.sponsors.tiers[x]).join(", ") })}
                      {c.askTk ? ` · ${format(to.ask, { amount: tk(c.askTk) })}` : ""}
                    </div>
                    {c.note ? <p className="text-xs text-ink">{c.note}</p> : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-faint">{to.noCalls}</p>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-base font-black text-ink">{to.upcoming}</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(tournaments.data ?? [])
                .filter((x) => !x.hostClubId)
                .slice(0, 12)
                .map((x) => (
                  <div key={x.id} className={card}>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-ink">{x.name}</div>
                      <div className="truncate text-[11px] text-ink-faint">
                        {x.community?.name ?? x.creator?.name ?? ""}
                        {x.startAt ? ` · ${formatShortDate(x.startAt, locale)}` : ""}
                      </div>
                    </div>
                    <button type="button" className={offerBtn} onClick={() => setTarget({ type: "tournament", id: x.id, name: x.name })}>
                      {to.sponsor}
                    </button>
                  </div>
                ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-base font-black text-ink">{to.communities}</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(communities.data ?? []).slice(0, 12).map((c) => (
                <div key={c.id} className={card}>
                  <Avatar dpUrl={c.dpUrl ?? null} name={c.name} size="sm" mode="static" />
                  <div className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{c.name}</div>
                  <button type="button" className={offerBtn} onClick={() => setTarget({ type: "community", id: c.id, name: c.name })}>
                    {to.sponsor}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {target ? (
            <SponsorshipModal
              target={target}
              commissionPct={data.settings.commissionPct}
              minDays={data.settings.minDays}
              maxDays={data.settings.maxDays}
              onClose={() => setTarget(null)}
              onToast={toast}
            />
          ) : null}
        </div>
      )}
    </SponsorShell>
  );
}
