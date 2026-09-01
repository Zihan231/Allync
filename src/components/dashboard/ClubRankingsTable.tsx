import Link from "next/link";
import { Avatar } from "@/components/common/Avatar";
import { RankBadge } from "./RankBadge";
import type { ClubRankingRow } from "@/lib/mock/rankingsData";

export function ClubRankingsTable({ rows }: { rows: ClubRankingRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-surface-line">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-surface-line/40 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
          <tr>
            <th className="px-3 py-2.5 font-medium">#</th>
            <th className="px-3 py-2.5 font-medium">Club Info</th>
            <th className="px-3 py-2.5 text-center font-medium">M</th>
            <th className="px-3 py-2.5 text-center font-medium">W</th>
            <th className="px-3 py-2.5 text-center font-medium">D</th>
            <th className="px-3 py-2.5 text-center font-medium">L</th>
            <th className="px-3 py-2.5 text-right font-medium">Win%</th>
            <th className="px-3 py-2.5 text-center font-medium">GF</th>
            <th className="px-3 py-2.5 text-center font-medium">GA</th>
            <th className="px-3 py-2.5 text-center font-medium">GD</th>
            <th className="px-3 py-2.5 text-right font-medium">Rating</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const infoCell = (
              <div className="flex items-center gap-2.5">
                <Avatar dpUrl={row.dpUrl} name={row.name} size="sm" mode="static" shape="square" />
                <div className="min-w-0">
                  <div className="truncate font-medium text-ink">{row.name}</div>
                  <div className="truncate text-xs text-ink-faint">{row.tier}</div>
                </div>
              </div>
            );
            return (
              <tr key={row.id} className={i % 2 === 0 ? "bg-surface/40" : ""}>
                <td className="px-3 py-2.5">
                  <RankBadge rank={row.rank} />
                </td>
                <td className="px-3 py-2.5">
                  {row.isReal ? (
                    <Link href={`/dashboard/efootball/clubs/${row.id}`} className="block">
                      {infoCell}
                    </Link>
                  ) : (
                    infoCell
                  )}
                </td>
                <td className="px-3 py-2.5 text-center font-mono text-ink-soft">{row.M}</td>
                <td className="px-3 py-2.5 text-center font-mono text-ink-soft">{row.W}</td>
                <td className="px-3 py-2.5 text-center font-mono text-ink-soft">{row.D}</td>
                <td className="px-3 py-2.5 text-center font-mono text-ink-soft">{row.L}</td>
                <td className="px-3 py-2.5 text-right font-mono text-ink-soft">{row.winPct.toFixed(1)}%</td>
                <td className="px-3 py-2.5 text-center font-mono text-ink-soft">{row.GF}</td>
                <td className="px-3 py-2.5 text-center font-mono text-ink-soft">{row.GA}</td>
                <td className={`px-3 py-2.5 text-center font-mono ${row.GD >= 0 ? "text-success-ink" : "text-danger-ink"}`}>
                  {row.GD >= 0 ? `+${row.GD}` : row.GD}
                </td>
                <td className="px-3 py-2.5 text-right font-mono font-semibold text-accent-ink">{row.rating.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
