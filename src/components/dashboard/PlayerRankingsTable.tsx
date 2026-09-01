import Link from "next/link";
import { Avatar } from "@/components/common/Avatar";
import { RankBadge } from "./RankBadge";
import type { PlayerRankingRow } from "@/lib/mock/rankingsData";

const HEAD_CELLS: { key: string; label: string; align?: "right" }[] = [
  { key: "pl", label: "PL" },
  { key: "w", label: "W" },
  { key: "d", label: "D" },
  { key: "l", label: "L" },
  { key: "gf", label: "GF" },
  { key: "ga", label: "GA" },
  { key: "cs", label: "CS" },
  { key: "ht", label: "HT" },
  { key: "dht", label: "DHT" },
  { key: "streak", label: "🔥" },
  { key: "motm", label: "👑" },
  { key: "winpct", label: "Win%", align: "right" },
  { key: "pts", label: "PTS", align: "right" },
];

export function PlayerRankingsTable({ rows }: { rows: PlayerRankingRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-surface-line">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="bg-surface-line/40 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
          <tr>
            <th className="px-3 py-2.5 font-medium">#</th>
            <th className="px-3 py-2.5 font-medium">Player Info</th>
            {HEAD_CELLS.map((c) => (
              <th key={c.key} className={`px-3 py-2.5 font-medium ${c.align === "right" ? "text-right" : "text-center"}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const nameCell = (
              <div className="flex items-center gap-2.5">
                <Avatar dpUrl={row.dpUrl} name={row.name} size="sm" mode="static" />
                <div className="min-w-0">
                  <div className="truncate font-medium text-ink">{row.name}</div>
                  {row.clubName ? <div className="truncate text-xs text-ink-faint">{row.clubName}</div> : null}
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
                    <Link href={`/dashboard/efootball/players/${row.id}`} className="block">
                      {nameCell}
                    </Link>
                  ) : (
                    nameCell
                  )}
                </td>
                <td className="px-3 py-2.5 text-center font-mono text-ink-soft">{row.PL}</td>
                <td className="px-3 py-2.5 text-center font-mono text-ink-soft">{row.W}</td>
                <td className="px-3 py-2.5 text-center font-mono text-ink-soft">{row.D}</td>
                <td className="px-3 py-2.5 text-center font-mono text-ink-soft">{row.L}</td>
                <td className="px-3 py-2.5 text-center font-mono text-ink-soft">{row.GF}</td>
                <td className="px-3 py-2.5 text-center font-mono text-ink-soft">{row.GA}</td>
                <td className="px-3 py-2.5 text-center font-mono text-ink-soft">{row.CS}</td>
                <td className="px-3 py-2.5 text-center font-mono text-ink-soft">{row.HT}</td>
                <td className="px-3 py-2.5 text-center font-mono text-ink-soft">{row.DHT}</td>
                <td className="px-3 py-2.5 text-center font-mono text-ink-soft">{row.streak > 0 ? row.streak : "—"}</td>
                <td className="px-3 py-2.5 text-center font-mono text-ink-soft">{row.motm > 0 ? row.motm : "—"}</td>
                <td className="px-3 py-2.5 text-right font-mono text-ink-soft">{row.winPct.toFixed(1)}%</td>
                <td className="px-3 py-2.5 text-right font-mono font-semibold text-accent-ink">{row.PTS.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
