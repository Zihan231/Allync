import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Club } from "@/lib/mock/types";
import { getCommunityClubRankings } from "@/lib/mock/rankingsData";
import { ClubRankingsTable } from "./ClubRankingsTable";
import { EmptyState } from "./EmptyState";
import { TrophyIcon } from "../icons";

export function CommunityRankingsTab({ memberClubs }: { memberClubs: Club[] }) {
  const { t } = useLanguage();
  const rows = getCommunityClubRankings(memberClubs);

  return (
    <div>
      <h3 className="font-display text-sm font-bold text-ink">{t.dashboard.communityRankings.title}</h3>
      <div className="mt-4">
        {rows.length === 0 ? (
          <EmptyState icon={TrophyIcon} title={t.dashboard.rankings.noResults} body="" />
        ) : (
          <ClubRankingsTable rows={rows} />
        )}
      </div>
    </div>
  );
}
