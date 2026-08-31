"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockMatches } from "@/lib/mock/store";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DisputeCard } from "@/components/dashboard/DisputeCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { GavelIcon } from "@/components/icons";

export default function DisputesPage() {
  const { t } = useLanguage();
  const matches = useMockMatches();
  const c = t.dashboard.organizer.disputes;

  const disputed = matches.filter((m) => m.status === "disputed");
  const recentlyRuled = matches.filter((m) => m.status === "verified" && m.evidenceA && m.evidenceB);

  return (
    <div>
      <PageHeader eyebrow={t.dashboard.shell.modeOrganizer} title={c.queueTitle} />

      <div className="mt-8 space-y-4">
        {disputed.length > 0 ? (
          disputed.map((m) => <DisputeCard key={m.id} match={m} />)
        ) : (
          <EmptyState icon={GavelIcon} title={c.noDisputes} body="" />
        )}
      </div>

      {recentlyRuled.length > 0 ? (
        <div className="mt-10">
          <h2 className="font-display mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
            {c.recentlyRuled}
          </h2>
          <div className="space-y-2">
            {recentlyRuled.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-surface-line bg-surface/40 px-4 py-2.5"
              >
                <span className="text-sm text-ink-soft">
                  {m.tournamentName} · vs {m.opponent}
                </span>
                <StatusPill tone="success">{t.dashboard.matches.filterVerified}</StatusPill>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
