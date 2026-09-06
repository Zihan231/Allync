import Link from "next/link";
import type { Club, Community } from "@/lib/mock/types";
import type { CommunityRole } from "@/lib/session/SessionContext";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { getCommunityClubRankings, rankCommunities } from "@/lib/mock/rankingsData";
import { getCommunityFreeAgents } from "@/lib/mock/communityInsights";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Avatar } from "../common/Avatar";

type Person = ReturnType<typeof useMockPeople>[number];

function PersonCell({ label, person }: { label: string; person: Person | undefined }) {
  return (
    <div className="rounded-xl border border-surface-line bg-surface/40 p-4">
      <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
      {person ? (
        <Link
          href={`/dashboard/efootball/players/${person.id}`}
          className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-ink hover:text-accent-ink"
        >
          <Avatar dpUrl={person.dpUrl} name={person.name} size="sm" mode="static" />
          <span className="truncate">{person.name}</span>
        </Link>
      ) : (
        <div className="mt-1.5 text-sm font-semibold text-ink-faint">—</div>
      )}
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-surface-line bg-surface/40 p-4">
      <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="mt-1.5 truncate font-display text-lg font-bold text-accent-ink">{value}</div>
    </div>
  );
}

export function CommunityMetaGrid({
  community,
  memberClubs,
  allPeople,
  allCommunities,
}: {
  community: Community;
  memberClubs: Club[];
  allPeople: Person[];
  allCommunities: Community[];
}) {
  const { t } = useLanguage();

  const byRole = (role: CommunityRole) =>
    allPeople.find((p) => p.communityId === community.id && p.communityRole === role);

  const totalPlayers =
    allPeople.filter((p) => p.clubId && memberClubs.some((c) => c.id === p.clubId)).length +
    getCommunityFreeAgents(community, allPeople).length;

  const clubRatings = getCommunityClubRankings(memberClubs);
  const communityRating = clubRatings.length
    ? Math.round(clubRatings.reduce((sum, r) => sum + r.rating, 0) / clubRatings.length)
    : community.points;

  const globalRank = rankCommunities(allCommunities).find((r) => r.id === community.id)?.rank ?? "—";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <PersonCell label={t.dashboard.community.presidentLabel} person={byRole("President")} />
      <PersonCell label={t.dashboard.community.vicePresidentLabel} person={byRole("Vice President")} />
      <PersonCell label={t.dashboard.community.teamManagerLabel} person={byRole("Team Manager")} />
      <PersonCell label={t.dashboard.community.headOfDisciplineLabel} person={byRole("Head of Discipline")} />
      <PersonCell label={t.dashboard.community.scoutLabel} person={byRole("Scout")} />
      <StatCell label={t.dashboard.community.totalClubsLabel} value={`${memberClubs.length}`} />
      <StatCell label={t.dashboard.community.totalPlayersLabel} value={`${totalPlayers}`} />
      <StatCell label={t.dashboard.community.communityRatingLabel} value={communityRating.toLocaleString()} />
      <StatCell label={t.dashboard.community.communityGlobalRankLabel} value={`#${globalRank}`} />
    </div>
  );
}
