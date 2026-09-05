"use client";

import { useMemo } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getClubRoundStats } from "@/lib/mock/clubMatchHistory";
import type { Club } from "@/lib/mock/types";
import { ClubStatsSummaryPanel } from "./ClubStatsSummaryPanel";

export function ClubRoundStatsTab({ club }: { club: Club }) {
  const { t } = useLanguage();
  const summary = useMemo(() => getClubRoundStats(club), [club]);

  return (
    <ClubStatsSummaryPanel
      title={t.dashboard.clubRoundStats.title}
      unitLabel={t.dashboard.clubRoundStats.roundsUnit}
      summary={summary}
    />
  );
}
