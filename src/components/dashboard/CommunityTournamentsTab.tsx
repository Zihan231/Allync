import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Tournament } from "@/lib/mock/types";
import { TournamentListItem } from "./TournamentListItem";
import { EmptyState } from "./EmptyState";
import { TrophyIcon } from "../icons";

const STATUS_ORDER: Tournament["status"][] = ["live", "open", "completed"];

export function CommunityTournamentsTab({ tournaments }: { tournaments: Tournament[] }) {
  const { t } = useLanguage();

  if (tournaments.length === 0) {
    return <EmptyState icon={TrophyIcon} title={t.dashboard.tournaments.noTournaments} body="" />;
  }

  const statusLabel: Record<Tournament["status"], string> = {
    open: t.dashboard.tournaments.statusOpen,
    live: t.dashboard.tournaments.statusLive,
    completed: t.dashboard.tournaments.statusCompleted,
  };

  return (
    <div className="space-y-7">
      {STATUS_ORDER.map((status) => {
        const list = tournaments.filter((tour) => tour.status === status);
        if (list.length === 0) return null;
        return (
          <div key={status}>
            <h3 className="font-display text-sm font-bold text-ink">{statusLabel[status]}</h3>
            <div className="mt-3 space-y-2">
              {list.map((tour) => (
                <TournamentListItem key={tour.id} tournament={tour} href={`/dashboard/efootball/tournaments/${tour.id}`} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
