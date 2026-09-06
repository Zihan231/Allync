import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { Avatar } from "../common/Avatar";
import { EmptyState } from "./EmptyState";
import { UsersIcon } from "../icons";

type Person = ReturnType<typeof useMockPeople>[number];

export function CommunityFreeAgentsTab({ freeAgents }: { freeAgents: Person[] }) {
  const { t } = useLanguage();

  if (freeAgents.length === 0) {
    return <EmptyState icon={UsersIcon} title={t.dashboard.communityFreeAgents.noEntries} body="" />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {freeAgents.map((person) => (
        <Link
          key={person.id}
          href={`/dashboard/efootball/players/${person.id}`}
          className="flex items-center gap-3 rounded-xl border border-surface-line bg-surface/40 p-3.5 transition-colors hover:border-accent"
        >
          <Avatar dpUrl={person.dpUrl} name={person.name} size="md" mode="static" />
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">{person.name}</span>
            <div className="mt-1 flex items-center gap-3 font-mono text-[11px] text-ink-faint">
              {person.gamePosition ? (
                <span>
                  {t.dashboard.communityFreeAgents.positionLabel}: {person.gamePosition}
                </span>
              ) : null}
              <span>{person.points.toLocaleString()} pts</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
