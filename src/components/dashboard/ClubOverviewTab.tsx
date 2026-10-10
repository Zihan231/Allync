"use client";

import type { Club } from "@/lib/mock/types";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { useClubStats } from "@/lib/api/hooks/useStats";
import { ClubLatestTournaments } from "./ClubLatestTournaments";
import { SquadCompositionDonut } from "./SquadCompositionDonut";
import { ClubTopPerformers } from "./ClubTopPerformers";

type Person = ReturnType<typeof useMockPeople>[number];

/** Club overview backed only by persisted membership, tournament and approved-result data. */
export function ClubOverviewTab({ club, members, onViewTournaments }: { club: Club; members: Person[]; onViewTournaments: () => void }) {
  const { data, isLoading } = useClubStats(club.id);
  const stats = data?.periods["all-time"];
  const metrics = [
    ["Matches", stats?.M ?? 0], ["Wins", stats?.W ?? 0], ["Draws", stats?.D ?? 0],
    ["Losses", stats?.L ?? 0], ["Goals", `${stats?.GF ?? 0}:${stats?.GA ?? 0}`], ["Win rate", `${stats?.winPct ?? 0}%`],
  ];
  return <div className="space-y-5">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {metrics.map(([label, value]) => <div key={label} className="rounded-xl border border-surface-line bg-surface/40 p-4">
        <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
        <div className="mt-1.5 font-display text-xl font-bold text-accent-ink">{isLoading ? "…" : value}</div>
      </div>)}
    </div>
    <div className="grid gap-5 lg:grid-cols-2"><SquadCompositionDonut members={members} /></div>
    <ClubLatestTournaments clubId={club.id} onViewAll={onViewTournaments} />
    <ClubTopPerformers clubId={club.id} />
  </div>;
}
