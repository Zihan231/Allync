"use client";

import { useMemo } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getClubRoundStats } from "@/lib/mock/clubMatchHistory";
import type { Club } from "@/lib/mock/types";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { ClubStatsSummaryPanel } from "./ClubStatsSummaryPanel";
import { ClubOpponentStatsTable } from "./ClubOpponentStatsTable";

type Person = ReturnType<typeof useMockPeople>[number];

export function ClubRoundStatsTab({ club, members }: { club: Club; members: Person[] }) {
  const { t } = useLanguage();
  const summary = useMemo(() => getClubRoundStats(club), [club]);

  return (
    <div className="space-y-5">
      <ClubStatsSummaryPanel
        title={t.dashboard.clubRoundStats.title}
        unitLabel={t.dashboard.clubRoundStats.roundsUnit}
        summary={summary}
      />
      <ClubOpponentStatsTable club={club} members={members} />
    </div>
  );
}
