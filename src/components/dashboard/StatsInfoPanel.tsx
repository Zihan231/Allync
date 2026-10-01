"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { InfoIcon } from "@/components/icons";

type Tip =
  | "confirmedOnly"
  | "walkovers"
  | "hatTricks"
  | "streak"
  | "playerPts"
  | "clubPts"
  | "notYet"
  | "periods"
  | "emptyFields";

/** Which tips each view shows. */
const TIPS: Record<"players" | "clubs" | "profile", Tip[]> = {
  players: ["confirmedOnly", "walkovers", "hatTricks", "streak", "playerPts", "notYet", "periods"],
  clubs: ["confirmedOnly", "walkovers", "clubPts", "periods"],
  profile: ["confirmedOnly", "walkovers", "hatTricks", "streak", "playerPts", "notYet", "emptyFields", "periods"],
};

/** Collapsible "How stats are counted" tips for a stats view. */
export function StatsInfoPanel({ variant, className = "" }: { variant: keyof typeof TIPS; className?: string }) {
  const { t } = useLanguage();
  const si = t.dashboard.statsInfo;

  return (
    <details className={`group rounded-xl border border-blue/30 bg-blue-soft/30 ${className}`}>
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-blue-ink [&::-webkit-details-marker]:hidden">
        <InfoIcon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{si.title}</span>
        <span className="text-xs text-ink-faint transition-transform group-open:rotate-180" aria-hidden="true">
          ▾
        </span>
      </summary>
      <ul className="space-y-1.5 px-4 pb-4 pl-10 text-xs leading-relaxed text-ink-soft">
        {TIPS[variant].map((tip) => (
          <li key={tip} className="list-disc">
            {si[tip]}
          </li>
        ))}
      </ul>
    </details>
  );
}
