"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { usePublicSettings } from "@/lib/api/hooks/useAdmin";

/** Shown to everyone while ALLYNQ staff have turned on maintenance mode. */
export function MaintenanceBanner() {
  const { t } = useLanguage();
  const { data } = usePublicSettings();
  if (!data?.maintenance.enabled) return null;
  return (
    <div className="mb-6 rounded-xl border border-warning/50 bg-warning-soft px-4 py-3 text-sm text-warning-ink" role="status">
      <span className="font-bold">⚠ {t.admin.maintenanceBanner}</span>
      {data.maintenance.message ? <span className="block text-ink-soft sm:inline"> {data.maintenance.message}</span> : null}
    </div>
  );
}
