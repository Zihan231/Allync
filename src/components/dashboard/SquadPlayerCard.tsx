import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { PlayerRankingRow } from "@/lib/mock/rankingsData";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { Avatar } from "../common/Avatar";
import { RankBadge } from "./RankBadge";
import { StatusPill } from "./StatusPill";
import { FacebookIcon } from "../icons";

type Person = ReturnType<typeof useMockPeople>[number];

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
  const squadTeam = person.squadTeam ?? "Main";

  return (
    <div className="rounded-2xl border border-surface-line bg-surface/40 p-4">
      <div className="flex items-center justify-between">
        <RankBadge rank={row.rank} />
        {person.shirtNumber ? (
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-accent-soft px-2 font-mono text-xs font-bold text-accent-ink">
            #{person.shirtNumber}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col items-center text-center">
        <Avatar dpUrl={person.dpUrl} name={person.name} size="lg" mode="static" />
        <Link
          href={`/dashboard/efootball/players/${person.id}`}
          className="mt-2 truncate text-sm font-semibold text-ink hover:text-accent-ink"
        >
          {person.name}
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
          <StatusPill tone="neutral">
            {squadTeam === "Main"
              ? t.dashboard.clubSquad.squadTeamMain
              : squadTeam === "Academy"
                ? t.dashboard.clubSquad.squadTeamAcademy
                : t.dashboard.clubSquad.squadTeamLegend}
          </StatusPill>
          <StatusPill tone={contractDays < 30 ? "warning" : "neutral"}>
            {t.dashboard.clubSquad.contractExpiresLabel}: {contractDays}d
          </StatusPill>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 divide-x divide-surface-line rounded-lg border border-surface-line bg-surface/60 text-center">
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

      <div className="mt-3 space-y-1 font-mono text-[10px] text-ink-faint">
        <div>
          {t.dashboard.clubSquad.uidLabel}: <span className="text-ink-soft">{person.konamiUid ?? "—"}</span>
        </div>
        <div>
          {t.dashboard.clubSquad.deviceLabel}:{" "}
          <span className="text-ink-soft">{person.deviceModel ?? person.deviceName ?? "—"}</span>
        </div>
      </div>

      {person.facebookUrl ? (
        <div className="mt-3 flex items-center gap-2">
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
