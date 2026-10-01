import Link from "next/link";
import { Avatar } from "@/components/common/Avatar";
import { RankBadge } from "./RankBadge";
import type { ClubStatsRow } from "@/lib/api/stats";

type Col = {
  key: keyof ClubStatsRow;
  label: string;
  align?: "right" | "center";
  hideClass?: string;
};

const COLS: Col[] = [
  { key: "M", label: "M", align: "center" },
  { key: "W", label: "W", align: "center" },
  { key: "D", label: "D", align: "center", hideClass: "hidden sm:table-cell" },
  { key: "L", label: "L", align: "center", hideClass: "hidden sm:table-cell" },
  { key: "winPct", label: "Win%", align: "right" },
  { key: "GF", label: "GF", align: "center", hideClass: "hidden md:table-cell" },
  { key: "GA", label: "GA", align: "center", hideClass: "hidden md:table-cell" },
  { key: "GD", label: "GD", align: "center", hideClass: "hidden lg:table-cell" },
  { key: "PTS", label: "PTS", align: "right" },
];

function cellValue(row: ClubStatsRow, key: Col["key"]) {
  if (key === "winPct") return `${row.winPct.toFixed(1)}%`;
  if (key === "GD") return row.GD > 0 ? `+${row.GD}` : String(row.GD);
  if (key === "PTS") return row.PTS.toLocaleString();
  return String(row[key] ?? "");
}

/** Club stats table (CvC fixtures); rows come from the stats API. */
export function ClubRankingsTable({ rows }: { rows: ClubStatsRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-surface-line">
      <table className="w-full table-auto text-left text-xs sm:text-sm">
        <thead className="bg-surface-line/40 font-mono text-[10px] uppercase tracking-wide text-ink-faint sm:text-[11px]">
          <tr>
            <th className="whitespace-nowrap px-1.5 py-2 font-medium sm:px-2.5">#</th>
            <th className="px-1.5 py-2 font-medium sm:px-2.5">Club</th>
            {COLS.map((c) => (
              <th
                key={c.key}
                className={`whitespace-nowrap px-1 py-2 font-medium sm:px-1.5 ${c.align === "right" ? "text-right" : "text-center"} ${c.hideClass ?? ""}`}
              >
                {c.label}
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
                <Link href={`/dashboard/efootball/clubs/${row.id}`} className="block min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar dpUrl={row.dpUrl} name={row.name} size="sm" mode="static" shape="square" className="hidden sm:flex" />
                    <div className="min-w-0">
                      <div className="max-w-[110px] truncate font-medium text-ink sm:max-w-[220px]">{row.name}</div>
                      {row.stage ? (
                        <div className="max-w-[110px] truncate text-[10px] text-ink-faint sm:max-w-[220px] sm:text-xs">
                          {row.stage}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </td>
              {COLS.map((c) => (
                <td
                  key={c.key}
                  className={`whitespace-nowrap px-1 py-2 font-mono text-ink-soft sm:px-1.5 ${
                    c.align === "right" ? "text-right" : "text-center"
                  } ${c.key === "PTS" ? "font-semibold text-accent-ink" : ""} ${
                    c.key === "GD" ? (row.GD >= 0 ? "text-success-ink" : "text-danger-ink") : ""
                  } ${c.hideClass ?? ""}`}
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
