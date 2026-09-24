import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Tournament } from "@/lib/mock/types";
import type { BackendTournament } from "@/lib/api/tournaments";
import { TournamentListItem } from "./TournamentListItem";
import { EmptyState } from "./EmptyState";
import { TrophyIcon } from "../icons";

const STATUS_GROUPS: { key: string; label: string; matches: string[] }[] = [
  { key: "live", label: "Live Now", matches: ["ongoing", "live"] },
  { key: "open", label: "Registration Open", matches: ["open", "registration_open"] },
  { key: "registration_closed", label: "Registration Closed", matches: ["registration_closed", "submission_phase"] },
  { key: "completed", label: "Completed", matches: ["completed"] },
];

export function CommunityTournamentsTab({
  tournaments,
  isLoading = false,
}: {
  tournaments: (Tournament | BackendTournament | any)[];
  isLoading?: boolean;
}) {
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-accent-ink animate-pulse">
            Loading tournaments...
          </span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 rounded-xl border border-surface-line bg-surface/40 p-4 animate-pulse"
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-surface-line/70" />
                <div className="space-y-2">
                  <div className="h-4 w-48 rounded bg-surface-line/80" />
                  <div className="h-3 w-28 rounded bg-surface-line/50" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-24 rounded-full bg-surface-line/60" />
                <div className="h-6 w-16 rounded-full bg-surface-line/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
