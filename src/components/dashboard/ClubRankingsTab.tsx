"use client";

import type { Club } from "@/lib/mock/types";
import { STATS_PERIODS, type StatsPeriod } from "@/lib/api/stats";
import { useClubStats } from "@/lib/api/hooks/useStats";

const LABELS: Record<StatsPeriod, string> = { "all-time": "All time", "this-week": "This week", "last-week": "Last week", "this-month": "This month", "last-month": "Last month" };

/** Rankings computed by the backend from approved tournament results. */
export function ClubRankingsTab({ club }: { club: Club; members?: unknown[] }) {
  const { data, isLoading, isError } = useClubStats(club.id);
  if (isLoading) return <div className="h-40 animate-pulse rounded-xl border border-surface-line bg-surface/40" />;
  if (isError || !data) return <p className="rounded-xl border border-danger/30 p-5 text-sm text-danger-ink">Unable to load live club statistics.</p>;
  return <div className="overflow-x-auto rounded-xl border border-surface-line bg-surface/30"><table className="w-full min-w-[760px] text-sm">
    <thead className="border-b border-surface-line text-left font-mono text-[10px] uppercase text-ink-faint"><tr>{["Period", "Rank", "M", "W", "D", "L", "GF", "GA", "GD", "Win %", "PTS"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
    <tbody>{STATS_PERIODS.map((period) => { const row = data.periods[period]; return <tr key={period} className="border-b border-surface-line/60 last:border-0">
      <td className="px-4 py-3 font-semibold text-ink">{LABELS[period]}</td><td className="px-4 py-3">{row.rank ?? "—"}</td><td className="px-4 py-3">{row.M}</td><td className="px-4 py-3">{row.W}</td><td className="px-4 py-3">{row.D}</td><td className="px-4 py-3">{row.L}</td><td className="px-4 py-3">{row.GF}</td><td className="px-4 py-3">{row.GA}</td><td className="px-4 py-3">{row.GD}</td><td className="px-4 py-3">{row.winPct}%</td><td className="px-4 py-3 font-bold text-accent-ink">{row.PTS}</td>
    </tr>; })}</tbody>
  </table></div>;
}
