import type { Club } from "@/lib/mock/types";
import type { useMockPeople } from "@/lib/mock/communityStore";
import type { ClubInsights } from "@/lib/mock/clubInsights";
import { ClubUpcomingFixturesSlider } from "./ClubUpcomingFixturesSlider";
import { ClubMatchCalendar } from "./ClubMatchCalendar";
import { ClubNewsFeed } from "./ClubNewsFeed";
import { SquadCompositionDonut } from "./SquadCompositionDonut";
import { ClubTopPerformers } from "./ClubTopPerformers";

type Person = ReturnType<typeof useMockPeople>[number];

export function ClubOverviewTab({
  club,
  members,
  insights,
}: {
  club: Club;
  members: Person[];
  insights: ClubInsights;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="min-w-0">
          <ClubUpcomingFixturesSlider fixtures={insights.upcomingFixtures} />
        </div>
        <div className="min-w-0">
          <ClubMatchCalendar events={insights.calendarEvents} />
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="min-w-0">
          <SquadCompositionDonut members={members} />
        </div>
        <div className="min-w-0">
          <ClubNewsFeed items={insights.newsFeed} />
        </div>
      </div>
      <ClubTopPerformers club={club} members={members} />
    </div>
  );
}
