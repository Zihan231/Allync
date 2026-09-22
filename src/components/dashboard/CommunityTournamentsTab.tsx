import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Tournament } from "@/lib/mock/types";
import type { BackendTournament } from "@/lib/api/tournaments";
import { TournamentListItem } from "./TournamentListItem";
import { EmptyState } from "./EmptyState";
import { TrophyIcon } from "../icons";

const STATUS_GROUPS: { key: string; label: string; matches: string[] }[] = [
  { key: "live", label: "Live Now", matches: ["ongoing", "live"] },
  { key: "open", label: "Registration Open", matches: ["open"] },
  { key: "registration_closed", label: "Registration Closed", matches: ["registration_closed"] },
  { key: "completed", label: "Completed", matches: ["completed"] },
];

export function CommunityTournamentsTab({
  tournaments,
}: {
  tournaments: (Tournament | BackendTournament | any)[];
}) {
  const { t } = useLanguage();

  if (!tournaments || tournaments.length === 0) {
    return <EmptyState icon={TrophyIcon} title={t.dashboard.tournaments.noTournaments || "No tournaments yet"} body="" />;
  }

  return (
    <div className="space-y-7">
      {STATUS_GROUPS.map((group) => {
        const list = tournaments.filter((tour) => {
          const status = tour.status || "open";
          return group.matches.includes(status);
        });
        if (list.length === 0) return null;

        return (
          <div key={group.key}>
            <h3 className="font-display text-sm font-bold text-ink">{group.label}</h3>
            <div className="mt-3 space-y-2">
              {list.map((tour) => (
                <TournamentListItem
                  key={tour.id}
                  tournament={tour}
                  href={`/dashboard/efootball/tournaments/${tour.id}`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
