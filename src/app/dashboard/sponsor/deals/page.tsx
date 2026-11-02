"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { SponsorShell } from "@/components/sponsors/SponsorShell";
import { SponsorshipCard } from "@/components/sponsors/SponsorshipCard";

type Tab = "open" | "active" | "past";

/** All the sponsor's deals: open (requests and offers), active, and past. */
export default function SponsorDealsPage() {
  const { t } = useLanguage();
  const td = t.sponsors.deals;
  const [tab, setTab] = useState<Tab>("open");

  return (
    <SponsorShell title={td.title} subtitle={td.subtitle}>
      {(data, toast) => {
        const groups: Record<Tab, typeof data.deals> = {
          open: data.deals.filter((d) => d.status === "pending"),
          active: data.deals.filter((d) => d.status === "active"),
          past: data.deals.filter((d) => !["pending", "active"].includes(d.status)),
        };
        const labels: Record<Tab, string> = { open: td.open, active: td.activeTab, past: td.past };
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(groups) as Tab[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={tab === k}
                  onClick={() => setTab(k)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    tab === k ? "border-accent bg-accent text-bg" : "border-surface-line-strong text-ink-soft hover:text-ink"
                  }`}
                >
                  {labels[k]} · {groups[k].length}
                </button>
              ))}
            </div>
            {groups[tab].length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {groups[tab].map((d) => (
                  <SponsorshipCard key={d.id} deal={d} side="sponsor" commissionPct={data.settings.commissionPct} onToast={toast} />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-surface-line-strong py-10 text-center text-sm text-ink-faint">{td.empty}</p>
            )}
          </div>
        );
      }}
    </SponsorShell>
  );
}
