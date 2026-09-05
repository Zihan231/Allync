"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getClubTransferLog } from "@/lib/mock/clubTransferLog";
import type { Club } from "@/lib/mock/types";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { Avatar } from "../common/Avatar";
import { StatusPill } from "./StatusPill";
import { EmptyState } from "./EmptyState";
import { SwapIcon } from "../icons";

type Person = ReturnType<typeof useMockPeople>[number];
type FilterKey = "all" | "transfer" | "unregister";

export function ClubTransfersTab({ club, allPeople }: { club: Club; allPeople: Person[] }) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<FilterKey>("all");

  const entries = useMemo(() => getClubTransferLog(club, allPeople), [club, allPeople]);
  const realIds = useMemo(() => new Set(allPeople.map((p) => p.id)), [allPeople]);

  const filtered = filter === "all" ? entries : entries.filter((e) => e.type === filter);

  const options: { key: FilterKey; label: string }[] = [
    { key: "all", label: t.dashboard.clubTransfers.filterAll },
    { key: "transfer", label: t.dashboard.clubTransfers.filterTransfer },
    { key: "unregister", label: t.dashboard.clubTransfers.filterUnregister },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setFilter(opt.key)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filter === opt.key
                ? "border-blue bg-blue-soft text-blue-ink"
                : "border-surface-line-strong text-ink-soft hover:text-ink"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={SwapIcon} title={t.dashboard.clubTransfers.noEntries} body="" />
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-surface-line">
          {filtered.map((entry, i) => {
            const nameNode = realIds.has(entry.playerId) ? (
              <Link
                href={`/dashboard/efootball/players/${entry.playerId}`}
                className="truncate text-sm font-semibold text-ink hover:text-accent-ink"
              >
                {entry.playerName}
              </Link>
            ) : (
              <span className="truncate text-sm font-semibold text-ink">{entry.playerName}</span>
            );

            return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 p-3 ${i % 2 === 0 ? "bg-surface/40" : ""}`}
              >
                <Avatar dpUrl={entry.playerDpUrl} name={entry.playerName} size="sm" mode="static" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {nameNode}
                    <StatusPill tone={entry.type === "transfer" ? "info" : "neutral"}>{entry.type}</StatusPill>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink-faint">
                    {entry.team} #{entry.shirtNumber}
                    {entry.type === "transfer" && entry.fromClub
                      ? ` · ${t.dashboard.clubTransfers.incomingFromLabel.replace("{club}", entry.fromClub)}`
                      : ""}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-ink-faint">{entry.date}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
