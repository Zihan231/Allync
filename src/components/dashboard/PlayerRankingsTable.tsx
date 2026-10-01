"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Avatar } from "@/components/common/Avatar";
import { RankBadge } from "./RankBadge";
import type { PlayerStatsRow } from "@/lib/api/stats";

type Col = {
  key: keyof PlayerStatsRow;
  label: string;
  align?: "right" | "center";
  hideClass?: string;
};

const COLS: Col[] = [
  { key: "PL", label: "PL", align: "center" },
  { key: "W", label: "W", align: "center" },
  { key: "D", label: "D", align: "center", hideClass: "hidden sm:table-cell" },
  { key: "L", label: "L", align: "center", hideClass: "hidden sm:table-cell" },
  { key: "GF", label: "GF", align: "center", hideClass: "hidden md:table-cell" },
  { key: "GA", label: "GA", align: "center", hideClass: "hidden md:table-cell" },
  { key: "CS", label: "CS", align: "center", hideClass: "hidden lg:table-cell" },
  { key: "HT", label: "HT", align: "center", hideClass: "hidden lg:table-cell" },
  { key: "DHT", label: "DHT", align: "center", hideClass: "hidden xl:table-cell" },
  { key: "streak", label: "🔥", align: "center", hideClass: "hidden xl:table-cell" },
  { key: "motm", label: "👑", align: "center", hideClass: "hidden xl:table-cell" },
  { key: "winPct", label: "Win%", align: "right" },
  { key: "PTS", label: "PTS", align: "right" },
];

function cellValue(row: PlayerStatsRow, key: Col["key"]) {
  if (key === "streak") return row.streak > 0 ? row.streak : "—";
  if (key === "motm") return row.motm > 0 ? row.motm : "—"; // MOTM isn't recorded yet
  if (key === "winPct") return `${row.winPct.toFixed(1)}%`;
  if (key === "PTS") return row.PTS.toLocaleString();
  return String(row[key] ?? "");
}

/** Player stats table; rows come from the stats API (computed from confirmed results). */
export function PlayerRankingsTable({ rows }: { rows: PlayerStatsRow[] }) {
  const si = useLanguage().t.dashboard.statsInfo;
  // Hover hints for the less obvious columns.
  const hints: Partial<Record<Col["key"], string>> = {
    HT: si.colHT,
    DHT: si.colDHT,
    streak: si.colStreak,
    motm: si.colMotm,
    PTS: si.colPlayerPts,
  };

  return (
    <div className="overflow-hidden rounded-xl border border-surface-line">
      <table className="w-full table-auto text-left text-xs sm:text-sm">
        <thead className="bg-surface-line/40 font-mono text-[10px] uppercase tracking-wide text-ink-faint sm:text-[11px]">
          <tr>
            <th className="whitespace-nowrap px-1.5 py-2 font-medium sm:px-2.5">#</th>
            <th className="px-1.5 py-2 font-medium sm:px-2.5">Player</th>
            {COLS.map((c) => (
              <th
                key={c.key}
                title={hints[c.key]}
                className={`whitespace-nowrap px-1 py-2 font-medium sm:px-1.5 ${c.align === "right" ? "text-right" : "text-center"} ${c.hideClass ?? ""}`}
              >
                {hints[c.key] ? <span className="cursor-help underline decoration-dotted underline-offset-2">{c.label}</span> : c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} className={i % 2 === 0 ? "bg-surface/40" : ""}>
              <td className="whitespace-nowrap px-1.5 py-2 sm:px-2.5">
                {row.rank != null ? <RankBadge rank={row.rank} /> : <span className="font-mono text-ink-faint">—</span>}
              </td>
              <td className="min-w-0 px-1.5 py-2 sm:px-2.5">
                <Link href={`/dashboard/efootball/players/${row.id}`} className="block min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar dpUrl={row.dpUrl} name={row.name} size="sm" mode="static" className="hidden sm:flex" />
                    <div className="min-w-0">
                      <div className="max-w-[110px] truncate font-medium text-ink sm:max-w-[180px]">{row.name}</div>
                      {row.clubName ? (
                        <div className="max-w-[110px] truncate text-[10px] text-ink-faint sm:max-w-[180px] sm:text-xs">
                          {row.clubName}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </td>
              {COLS.map((c) => (
                <td
                  key={c.key}
                  title={c.key === "motm" ? si.notRecorded : undefined}
                  className={`whitespace-nowrap px-1 py-2 font-mono text-ink-soft sm:px-1.5 ${
                    c.align === "right" ? "text-right" : "text-center"
                  } ${c.key === "PTS" ? "font-semibold text-accent-ink" : ""} ${c.hideClass ?? ""}`}
                >
                  {cellValue(row, c.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
