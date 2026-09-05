"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getPlayerRankings, type PlayerRankingRow } from "@/lib/mock/rankingsData";
import type { Club } from "@/lib/mock/types";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { Avatar } from "../common/Avatar";

type Person = ReturnType<typeof useMockPeople>[number];
type RangeKey = "alltime" | "season";

const CATEGORIES: { key: string; labelKey: "topMatchWinners" | "topGoalScorer" | "topCleanSheets" | "topHatTricks" | "topDoubleHatTricks"; metric: (r: PlayerRankingRow) => number }[] = [
  { key: "winners", labelKey: "topMatchWinners", metric: (r) => r.W },
  { key: "goals", labelKey: "topGoalScorer", metric: (r) => r.GF },
  { key: "cs", labelKey: "topCleanSheets", metric: (r) => r.CS },
  { key: "ht", labelKey: "topHatTricks", metric: (r) => r.HT },
  { key: "dht", labelKey: "topDoubleHatTricks", metric: (r) => r.DHT },
];

export function ClubTopPerformers({ club, members }: { club: Club; members: Person[] }) {
  const { t } = useLanguage();
  const [range, setRange] = useState<RangeKey>("alltime");

  const clubNameById = useMemo(() => new Map([[club.id, club.name]]), [club.id, club.name]);
  const rows = useMemo(() => {
    if (members.length === 0) return [];
    const all = getPlayerRankings(range === "alltime" ? "all-time" : "season-2026", members, clubNameById);
    return all.filter((r) => r.isReal && r.clubName === club.name);
  }, [members, clubNameById, club.name, range]);

  return (
    <div className="rounded-xl border border-surface-line bg-surface/30 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-sm font-bold text-ink">{t.dashboard.clubOverview.topPerformersTitle}</h3>
        <div className="flex gap-1.5 rounded-full border border-surface-line-strong p-1">
          {(["alltime", "season"] as RangeKey[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                range === r ? "bg-accent-soft text-accent-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              {r === "alltime" ? t.dashboard.clubOverview.allTimeTab : t.dashboard.clubOverview.seasonTab}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {CATEGORIES.map((cat) => {
          const best = rows.length
            ? rows.reduce((a, b) => (cat.metric(b) > cat.metric(a) ? b : a))
            : null;
          return (
            <div key={cat.key} className="rounded-xl border border-surface-line bg-surface/40 p-4">
              <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                {t.dashboard.clubOverview[cat.labelKey]}
              </div>
              {best ? (
                <>
                  <div className="mt-2 flex items-center gap-2">
                    <Avatar dpUrl={best.dpUrl} name={best.name} size="sm" mode="static" />
                    <span className="truncate text-sm font-semibold text-ink">{best.name}</span>
                  </div>
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
