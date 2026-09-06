import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Club, Community } from "@/lib/mock/types";
import type { useMockPeople } from "@/lib/mock/communityStore";
import {
  getCommunityCalendarEvents,
  getCommunityNewsFeed,
  getCommunityUpcomingFixtures,
} from "@/lib/mock/communityInsights";
import { ClubUpcomingFixturesSlider } from "./ClubUpcomingFixturesSlider";
import { ClubMatchCalendar } from "./ClubMatchCalendar";
import { ClubNewsFeed } from "./ClubNewsFeed";
import { SquadCompositionDonut } from "./SquadCompositionDonut";
import { ClubTopPerformers } from "./ClubTopPerformers";
import { GavelIcon } from "../icons";

type Person = ReturnType<typeof useMockPeople>[number];

export function CommunityOverviewTab({
  community,
  memberClubs,
  peopleByClub,
  clubMembers,
}: {
  community: Community;
  memberClubs: Club[];
  peopleByClub: Map<string, Person[]>;
  clubMembers: Person[];
}) {
  const { t } = useLanguage();

  const upcomingFixtures = getCommunityUpcomingFixtures(memberClubs, peopleByClub);
  const calendarEvents = getCommunityCalendarEvents(memberClubs, peopleByClub);
  const newsFeed = getCommunityNewsFeed(community, memberClubs);

  const ruleItems = community.rules
    .split(/\s*\d+\.\s+/)
    .map((r) => r.trim())
    .filter(Boolean);

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-warning/30 bg-gradient-to-b from-warning/10 via-surface/40 to-surface/40 shadow-sm">
        <div className="flex items-center gap-2 border-b border-warning/20 bg-warning-soft/40 px-4 py-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning-ink">
            <GavelIcon className="h-3.5 w-3.5" />
          </span>
          <h3 className="font-display text-sm font-bold text-warning-ink">
            {t.dashboard.communityOverview.rulesTitle}
          </h3>
        </div>
        <ul className="divide-y divide-surface-line/60">
          {ruleItems.map((rule, i) => (
            <li key={i} className="flex items-start gap-3 px-4 py-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warning-soft font-mono text-xs font-bold text-warning-ink">
                {i + 1}
              </span>
              <p className="pt-0.5 text-sm leading-relaxed text-ink">{rule}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="min-w-0">
          <ClubUpcomingFixturesSlider fixtures={upcomingFixtures} />
        </div>
        <div className="min-w-0">
          <ClubMatchCalendar events={calendarEvents} />
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="min-w-0">
          <SquadCompositionDonut members={clubMembers} />
        </div>
        <div className="min-w-0">
          <ClubNewsFeed items={newsFeed} title={t.dashboard.communityOverview.newsFeedTitle} />
        </div>
      </div>
      <ClubTopPerformers
        clubs={memberClubs}
        members={clubMembers}
        title={t.dashboard.communityOverview.topPerformersTitle}
      />
    </div>
  );
}
