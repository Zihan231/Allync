import Link from "next/link";
import { Avatar } from "@/components/common/Avatar";
import { RankBadge } from "./RankBadge";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function LeaderboardTable({
  rows,
  hrefBuilder,
}: {
  rows: { id: string; name: string; dpUrl: string | null; points: number; meta?: string }[];
  hrefBuilder: (id: string) => string;
}) {
  const { t } = useLanguage();

  return (
    <div className="overflow-hidden rounded-xl border border-surface-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-line/40 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
          <tr>
            <th className="px-4 py-2.5 font-medium">{t.dashboard.rankings.colRank}</th>
            <th className="px-4 py-2.5 font-medium">{t.dashboard.rankings.colName}</th>
            <th className="px-4 py-2.5 text-right font-medium">{t.dashboard.rankings.colPoints}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} className={i % 2 === 0 ? "bg-surface/40" : ""}>
              <td className="px-4 py-2.5">
                <RankBadge rank={i + 1} />
              </td>
              <td className="px-4 py-2.5">
                <Link href={hrefBuilder(row.id)} className="flex items-center gap-2.5">
                  <Avatar dpUrl={row.dpUrl} name={row.name} size="sm" mode="static" />
                  <span className="font-medium text-ink">{row.name}</span>
                  {row.meta ? <span className="text-xs text-ink-faint">{row.meta}</span> : null}
                </Link>
              </td>
              <td className="px-4 py-2.5 text-right font-mono font-semibold text-accent-ink">
                {row.points.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
