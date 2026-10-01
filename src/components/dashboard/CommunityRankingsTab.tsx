"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useClubRankings } from "@/lib/api/hooks/useStats";
import { ClubRankingsTable } from "./ClubRankingsTable";
import { EmptyState } from "./EmptyState";
import { Pagination } from "./Pagination";
import { StatsInfoPanel } from "./StatsInfoPanel";
import { TrophyIcon } from "../icons";

const PAGE_SIZE = 20;

/** The community's member clubs, ranked by their CvC results (global rank shown). */
export function CommunityRankingsTab({ communityId }: { communityId: string }) {
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useClubRankings({ communityId, page, limit: PAGE_SIZE });
  const rows = data?.data ?? [];

  return (
    <div>
      <h3 className="font-display text-sm font-bold text-ink">{t.dashboard.communityRankings.title}</h3>
      <StatsInfoPanel variant="clubs" className="mt-3" />
      <div className="mt-4 space-y-5">
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-xl border border-surface-line bg-surface/40" />
        ) : rows.length === 0 ? (
          <EmptyState icon={TrophyIcon} title={t.dashboard.rankings.noResults} body="" />
        ) : (
          <>
            <ClubRankingsTable rows={rows} />
            {(data?.meta.totalPages ?? 1) > 1 ? (
              <Pagination page={page} pageCount={data!.meta.totalPages} onPageChange={setPage} />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
