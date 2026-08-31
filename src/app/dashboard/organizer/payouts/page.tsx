"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockTournaments, updateTournament } from "@/lib/mock/store";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { WalletIcon } from "@/components/icons";

export default function PayoutsPage() {
  const { t } = useLanguage();
  const c = t.dashboard.organizer.payouts;
  const tournaments = useMockTournaments().filter((tour) => tour.prizePoolBdt);

  return (
    <div>
      <PageHeader eyebrow={t.dashboard.shell.modeOrganizer} title={t.dashboard.shell.navPayouts} />

      <div className="mt-8 space-y-3">
        {tournaments.length > 0 ? (
          tournaments.map((tour) => {
            const commission = Math.round((tour.prizePoolBdt ?? 0) * 0.05);
            const net = (tour.prizePoolBdt ?? 0) - commission;
            const released = tour.status === "completed";
            return (
              <div key={tour.id} className="rounded-xl border border-surface-line bg-surface/40 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium text-ink">{tour.name}</span>
                  <StatusPill tone={released ? "success" : "warning"}>
                    {released ? c.statusReleased : c.statusEscrowed}
                  </StatusPill>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4 font-mono text-xs text-ink-soft">
                  <div>
                    <div className="text-ink-faint">{c.prizePoolLabel}</div>
                    <div className="mt-0.5 text-ink">৳ {(tour.prizePoolBdt ?? 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-ink-faint">{c.commissionLabel}</div>
                    <div className="mt-0.5 text-ink">৳ {commission.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-ink-faint">{c.netLabel}</div>
                    <div className="mt-0.5 font-semibold text-accent-ink">৳ {net.toLocaleString()}</div>
                  </div>
                </div>
                {!released ? (
                  <button
                    onClick={() => updateTournament(tour.id, { status: "completed" })}
                    className="mt-4 rounded-full bg-accent px-4 py-2 font-display text-xs font-semibold text-bg"
                  >
                    {c.releaseButton}
                  </button>
                ) : null}
              </div>
            );
          })
        ) : (
          <EmptyState icon={WalletIcon} title={c.noPayouts} body="" />
        )}
      </div>
    </div>
  );
}
