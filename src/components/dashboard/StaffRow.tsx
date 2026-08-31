import Link from "next/link";
import type { Person } from "@/lib/mock/types";
import { Avatar } from "@/components/common/Avatar";

export function StaffRow({ people }: { people: Person[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {people.map((p) => (
        <Link
          key={p.id}
          href={`/dashboard/efootball/players/${p.id}`}
          className="flex items-center gap-2 rounded-full border border-surface-line-strong bg-bg-raised py-1 pl-1 pr-3 text-xs transition-colors hover:border-accent"
        >
          <Avatar dpUrl={p.dpUrl} name={p.name} size="sm" mode="static" />
          <span className="font-medium text-ink">{p.name}</span>
          <span className="text-ink-faint">· {p.clubRole ?? p.communityRole}</span>
        </Link>
      ))}
    </div>
  );
}
