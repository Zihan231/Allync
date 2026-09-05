"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getClubTeamUpHistory } from "@/lib/mock/clubMatchHistory";
import type { Club } from "@/lib/mock/types";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { Avatar } from "../common/Avatar";
import { StatusPill } from "./StatusPill";
import { EmptyState } from "./EmptyState";
import { UsersIcon } from "../icons";

type Person = ReturnType<typeof useMockPeople>[number];

const RESULT_TONE = { W: "success", D: "neutral", L: "danger" } as const;

export function ClubTeamUpTab({ club, members }: { club: Club; members: Person[] }) {
  const { t } = useLanguage();
  const [playerId, setPlayerId] = useState<string>("all");

  const entries = useMemo(() => getClubTeamUpHistory(club, members), [club, members]);
  const filtered = playerId === "all" ? entries : entries.filter((e) => e.playerAId === playerId);

  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs text-ink-soft">
        {t.dashboard.clubTeamUp.ownPlayerLabel}
        <select
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          className="rounded-lg border border-surface-line-strong bg-surface px-2 py-1.5 text-xs text-ink"
        >
          <option value="all">{t.dashboard.clubTeamUp.allPlayers}</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={UsersIcon} title={t.dashboard.clubTeamUp.noEntries} body="" />
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => (
            <div key={entry.id} className="min-w-0 rounded-xl border border-surface-line bg-surface/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{entry.date}</span>
                <StatusPill tone={RESULT_TONE[entry.result]}>{entry.result}</StatusPill>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar dpUrl={entry.playerADpUrl} name={entry.playerAName} size="sm" mode="static" />
                  <span className="truncate text-xs font-semibold text-ink">{entry.playerAName}</span>
                </div>
                <span className="shrink-0 font-mono text-sm font-bold text-ink">
                  {entry.scoreFor}–{entry.scoreAgainst}
                </span>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-xs font-semibold text-ink">{entry.playerBName}</span>
                  <Avatar dpUrl={null} name={entry.playerBName} size="sm" mode="static" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
