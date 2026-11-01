"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { CoachShell } from "@/components/coaching/CoachShell";
import { CoachingDealCard } from "@/components/coaching/CoachingDealCard";
import { SwapIcon } from "@/components/icons";

/** Every coaching deal: offers and requests to answer, running and past deals. */
export default function CoachDealsPage() {
  const { t } = useLanguage();
  const td = t.coaching.deals;
  return (
    <CoachShell title={td.title} subtitle={td.clubPays}>
      {(data, toast) =>
        data.deals.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {data.deals.map((d) => (
              <CoachingDealCard key={d.id} deal={d} viewer="coach" canAct settings={data.settings} onToast={toast} />
            ))}
          </div>
        ) : (
          <EmptyState icon={SwapIcon} title={td.empty} body="" />
        )
      }
    </CoachShell>
  );
}
