import Link from "next/link";
import type { Club } from "@/lib/mock/types";
import type { ClubRole } from "@/lib/session/SessionContext";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { getClubRankings } from "@/lib/mock/rankingsData";
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

export function ClubMetaGrid({ club, members }: { club: Club; members: Person[] }) {
  const { t } = useLanguage();

  const byRole = (role: ClubRole) => members.find((p) => p.clubRole === role);
  const teamStrength = getClubRankings([club])[0]?.rating ?? club.points;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <PersonCell label={t.dashboard.club.presidentLabel} person={byRole("President")} />
      <PersonCell label={t.dashboard.club.generalSecretaryLabel} person={byRole("General Secretary")} />
      <PersonCell label={t.dashboard.club.captainLabel} person={byRole("Captain")} />
      <PersonCell label={t.dashboard.club.viceCaptainLabel} person={byRole("Vice-Captain")} />
      <PersonCell label={t.dashboard.club.academyCaptainLabel} person={byRole("Academy Captain")} />
      <StatCell label={t.dashboard.club.locationLabel} value={club.location ?? "—"} />
      <StatCell label={t.dashboard.club.teamStrengthLabel} value={teamStrength.toLocaleString()} />
      <StatCell label={t.dashboard.club.playersLabel} value={`${members.length}/${club.maxRoster}`} />
    </div>
  );
}
