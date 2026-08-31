import Link from "next/link";
import type { Person } from "@/lib/mock/types";
import { Avatar } from "@/components/common/Avatar";

export function RosterTable({ roster }: { roster: Person[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-surface-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-line/40 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
          <tr>
            <th className="px-4 py-2.5 font-medium">Player</th>
            <th className="px-4 py-2.5 font-medium">Role</th>
          </tr>
        </thead>
        <tbody>
          {roster.map((p, i) => (
            <tr key={p.id} className={i % 2 === 0 ? "bg-surface/40" : ""}>
              <td className="px-4 py-2.5">
                <Link href={`/dashboard/efootball/players/${p.id}`} className="flex items-center gap-2.5">
                  <Avatar dpUrl={p.dpUrl} name={p.name} size="sm" mode="static" />
                  <span className="text-ink">{p.name}</span>
                </Link>
              </td>
              <td className="px-4 py-2.5 text-ink-soft">{p.clubRole}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
