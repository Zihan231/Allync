"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SpikeIcon } from "@/components/icons";
import { CreatorShell } from "@/components/creators/CreatorShell";
import { DesignRow } from "@/components/creators/DesignRow";
import { designStatus } from "@/components/creators/DesignPreview";

type Filter = "all" | ReturnType<typeof designStatus>;
const FILTERS: Filter[] = ["all", "approved", "pending", "changePending", "paused", "rejected"];

/** All the creator's designs, filtered by status. */
export default function CreatorDesignsPage() {
  const { t } = useLanguage();
  const tc = t.creators;
  const [filter, setFilter] = useState<Filter>("all");

  return (
    <CreatorShell title={tc.designs.title} subtitle={tc.designs.subtitle}>
      {(data, toast) => {
        const count = (f: Filter) => (f === "all" ? data.designs.length : data.designs.filter((d) => designStatus(d) === f).length);
        const shown = filter === "all" ? data.designs : data.designs.filter((d) => designStatus(d) === filter);
        if (!data.designs.length) {
          return (
            <EmptyState
              icon={SpikeIcon}
              title={tc.dashboard.noDesigns}
              body={tc.dashboard.noDesignsBody}
              action={{ label: tc.dashboard.submitFirst, href: "/dashboard/creator/new" }}
            />
          );
        }
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {FILTERS.filter((f) => f === "all" || count(f) > 0).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    filter === f ? "border-accent bg-accent text-bg" : "border-surface-line-strong text-ink-soft hover:text-ink"
                  }`}
                >
                  {f === "all" ? tc.designs.all : tc.status[f]} · {count(f)}
                </button>
              ))}
            </div>
            {shown.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {shown.map((d) => (
                  <DesignRow key={`${d.id}-${d.updatedAt}`} design={d} onToast={toast} />
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-ink-faint">{tc.designs.empty}</p>
            )}
          </div>
        );
      }}
    </CreatorShell>
  );
}
