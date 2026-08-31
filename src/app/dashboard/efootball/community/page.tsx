"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { mockClubs, mockCommunities } from "@/lib/mock";
import { useMockTournaments } from "@/lib/mock/store";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StaffRow } from "@/components/dashboard/StaffRow";
import { TournamentListItem } from "@/components/dashboard/TournamentListItem";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ShieldIcon } from "@/components/icons";

export default function CommunityPage() {
  const { t } = useLanguage();
  const { user } = useSession();
  const tournaments = useMockTournaments();
  const community = user.community ? mockCommunities.find((c) => c.id === user.community!.id) : null;

  if (!community) {
    return <EmptyState icon={ShieldIcon} title={t.dashboard.club.noClub} body="" />;
  }

  const memberClubs = mockClubs.filter((c) => community.memberClubIds.includes(c.id));
  const communityTournaments = tournaments.filter((tour) => tour.communityId === community.id);

  return (
    <div>
      <PageHeader eyebrow={t.dashboard.shell.navCommunity} title={community.name} />

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="font-display mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
            {t.dashboard.community.staffTitle}
          </h2>
          <StaffRow staff={community.staff} />
        </section>

        <section>
          <h2 className="font-display mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
            {t.dashboard.community.memberClubsTitle}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {memberClubs.map((club) => (
              <div
                key={club.id}
                className="flex items-center gap-3 rounded-xl border border-surface-line bg-surface/40 p-3.5"
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full font-display text-xs font-bold"
                  style={{ backgroundColor: `${club.color}22`, color: club.color }}
                >
                  {club.initials}
                </div>
                <div>
                  <div className="text-sm font-medium text-ink">{club.name}</div>
                  <div className="text-xs text-ink-faint">{club.roster.length} players</div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-xs text-ink-faint">
            {t.dashboard.community.freeAgentsTitle}: {community.freeAgentCount}
          </p>
        </section>

        <section>
          <h2 className="font-display mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
            {t.dashboard.community.tournamentsTitle}
          </h2>
          <div className="space-y-2">
            {communityTournaments.map((tour) => (
              <TournamentListItem key={tour.id} tournament={tour} href={`/dashboard/efootball/tournaments/${tour.id}`} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
