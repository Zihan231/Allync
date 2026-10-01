"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { usePlayerRankings } from "@/lib/api/hooks/useStats";
import type { PlayerStatsRow, StatsPeriod } from "@/lib/api/stats";
import { Avatar } from "../common/Avatar";

type Metric = (r: PlayerStatsRow) => number;

const CATEGORIES: {
  key: string;
  labelKey: "topMatchWinners" | "topGoalScorer" | "topCleanSheets" | "topHatTricks" | "topDoubleHatTricks";
  metric: Metric;
}[] = [
  { key: "winners", labelKey: "topMatchWinners", metric: (r) => r.W },
  { key: "goals", labelKey: "topGoalScorer", metric: (r) => r.GF },
  { key: "cs", labelKey: "topCleanSheets", metric: (r) => r.CS },
  { key: "ht", labelKey: "topHatTricks", metric: (r) => r.HT },
  { key: "dht", labelKey: "topDoubleHatTricks", metric: (r) => r.DHT },
];

const PERIODS: StatsPeriod[] = ["all-time", "this-month"];

/** Best player per category among a club's or a community's members, from confirmed results. */
export function ClubTopPerformers({ clubId, communityId, title }: { clubId?: string; communityId?: string; title?: string }) {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<StatsPeriod>("all-time");
  // Ranked members come first, so the top 100 cover everyone who has played.
  const { data } = usePlayerRankings({ clubId, communityId, period, limit: 100 }, Boolean(clubId || communityId));
  const rows = data?.data ?? [];

  return (
    <div className="rounded-xl border border-surface-line bg-surface/30 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-sm font-bold text-ink">{title ?? t.dashboard.clubOverview.topPerformersTitle}</h3>
        <div className="flex gap-1.5 rounded-full border border-surface-line-strong p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                period === p ? "bg-accent-soft text-accent-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              {p === "all-time" ? t.dashboard.clubOverview.allTimeTab : t.dashboard.rankings.periodThisMonth}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {CATEGORIES.map((cat) => {
          // Nobody tops a category they haven't scored in.
          const best = rows.reduce<PlayerStatsRow | null>(
            (top, r) => (cat.metric(r) > (top ? cat.metric(top) : 0) ? r : top),
            null,
          );
          return (
            <div key={cat.key} className="rounded-xl border border-surface-line bg-surface/40 p-4">
              <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                {t.dashboard.clubOverview[cat.labelKey]}
              </div>
              {best ? (
                <>
                  <Link href={`/dashboard/efootball/players/${best.id}`} className="mt-2 flex items-center gap-2">
                    <Avatar dpUrl={best.dpUrl} name={best.name} size="sm" mode="static" />
                    <span className="truncate text-sm font-semibold text-ink hover:text-accent-ink">{best.name}</span>
                  </Link>
                  <div className="mt-2 font-display text-2xl font-bold text-accent-ink">{cat.metric(best)}</div>
                </>
              ) : (
                <div className="mt-2 text-sm font-semibold text-ink-faint">—</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
