import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { PlayerRankingRow } from "@/lib/mock/rankingsData";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { Avatar } from "../common/Avatar";
import { RankBadge } from "./RankBadge";
import { StatusPill, type StatusTone } from "./StatusPill";
import { FacebookIcon } from "../icons";

type Person = ReturnType<typeof useMockPeople>[number];
type SquadTeam = "Main" | "Academy" | "Legend";

const TEAM_ACCENT: Record<SquadTeam, { bar: string; card: string; ring: string; pillTone: StatusTone }> = {
  Main: {
    bar: "bg-accent",
    card: "border-accent/40 bg-gradient-to-b from-accent/15 via-surface/50 to-surface/50",
    ring: "ring-accent/50",
    pillTone: "accent",
  },
  Academy: {
    bar: "bg-blue",
    card: "border-blue/40 bg-gradient-to-b from-blue/15 via-surface/50 to-surface/50",
    ring: "ring-blue/50",
    pillTone: "info",
  },
  Legend: {
    bar: "bg-success",
    card: "border-success/40 bg-gradient-to-b from-success/15 via-surface/50 to-surface/50",
    ring: "ring-success/50",
    pillTone: "success",
  },
};

export function SquadPlayerCard({
  person,
  row,
  contractDays,
}: {
  person: Person;
  row: PlayerRankingRow;
  contractDays: number;
}) {
  const { t } = useLanguage();
  const squadTeam: SquadTeam = person.squadTeam ?? "Main";
  const accent = TEAM_ACCENT[squadTeam];

  const roleLabel =
    person.clubRole === "President"
      ? t.dashboard.club.presidentLabel
      : person.clubRole === "General Secretary"
        ? t.dashboard.club.generalSecretaryLabel
        : person.clubRole === "Captain"
          ? t.dashboard.club.captainLabel
          : person.clubRole === "Vice-Captain"
            ? t.dashboard.club.viceCaptainLabel
            : person.clubRole === "Academy Captain"
              ? t.dashboard.club.academyCaptainLabel
              : null;

  const teamLabel =
    squadTeam === "Main"
      ? t.dashboard.clubSquad.squadTeamMain
      : squadTeam === "Academy"
        ? t.dashboard.clubSquad.squadTeamAcademy
        : t.dashboard.clubSquad.squadTeamLegend;

  return (
    <div className={`relative overflow-hidden rounded-2xl border pb-4 pt-5 ${accent.card}`}>
      <div className={`absolute inset-x-0 top-0 h-1.5 ${accent.bar}`} />

      <div className="flex items-center justify-between px-4">
        <RankBadge rank={row.rank} />
        {person.shirtNumber ? (
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-accent-soft px-2 font-mono text-xs font-bold text-accent-ink">
            #{person.shirtNumber}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col items-center px-4 text-center">
        <Avatar dpUrl={person.dpUrl} name={person.name} size="lg" mode="static" className={`ring-2 ${accent.ring}`} />
        <Link
          href={`/dashboard/efootball/players/${person.id}`}
          className="mt-2 truncate text-sm font-semibold text-ink hover:text-accent-ink"
        >
          {person.name}
        </Link>

        {roleLabel ? (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-warning-ink">
            ★ {roleLabel}
          </span>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
          <StatusPill tone={accent.pillTone}>{teamLabel}</StatusPill>
          <StatusPill tone={contractDays < 30 ? "warning" : "neutral"}>
            {t.dashboard.clubSquad.contractExpiresLabel}: {contractDays}d
          </StatusPill>
        </div>
      </div>

      <div className="mx-4 mt-4 grid grid-cols-3 divide-x divide-surface-line rounded-lg border border-surface-line bg-bg/40 text-center">
        <div className="px-2 py-2">
          <div className="font-display text-sm font-bold text-ink">{row.PL}</div>
          <div className="font-mono text-[9px] uppercase tracking-wide text-ink-faint">
            {t.dashboard.clubSquad.playedLabel}
          </div>
        </div>
        <div className="px-2 py-2">
          <div className="font-display text-sm font-bold text-ink">{row.W}</div>
          <div className="font-mono text-[9px] uppercase tracking-wide text-ink-faint">
            {t.dashboard.clubSquad.winsLabel}
          </div>
        </div>
        <div className="px-2 py-2">
          <div className="font-display text-sm font-bold text-accent-ink">{row.GF}</div>
          <div className="font-mono text-[9px] uppercase tracking-wide text-ink-faint">
            {t.dashboard.clubSquad.goalsLabel}
          </div>
        </div>
      </div>

      <div className="mx-4 mt-3 space-y-1 font-mono text-[10px] text-ink-faint">
        <div>
          {t.dashboard.clubSquad.uidLabel}: <span className="text-ink-soft">{person.konamiUid ?? "—"}</span>
        </div>
        <div>
          {t.dashboard.clubSquad.deviceLabel}:{" "}
          <span className="text-ink-soft">{person.deviceModel ?? person.deviceName ?? "—"}</span>
        </div>
      </div>

      {person.facebookUrl ? (
        <div className="mx-4 mt-3 flex items-center gap-2">
          <a
            href={person.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-surface-line-strong text-ink-soft hover:text-ink"
            aria-label="Facebook"
          >
            <FacebookIcon className="h-3.5 w-3.5" />
          </a>
        </div>
      ) : null}
    </div>
  );
}
