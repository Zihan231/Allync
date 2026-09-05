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
import { SwapIcon, PlusIcon, CloseIcon, ArrowRightIcon } from "../icons";

type Person = ReturnType<typeof useMockPeople>[number];
type FilterKey = "all" | "transfer" | "unregister";

const TYPE_ACCENT = {
  transfer: {
    bar: "bg-success",
    card: "border-success/40 bg-gradient-to-b from-success/15 via-surface/50 to-surface/50",
    ring: "ring-success/50",
    iconBg: "bg-success text-bg",
  },
  unregister: {
    bar: "bg-danger",
    card: "border-danger/40 bg-gradient-to-b from-danger/15 via-surface/50 to-surface/50",
    ring: "ring-danger/50",
    iconBg: "bg-danger text-bg",
  },
} as const;

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
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((entry) => {
            const nameNode = realIds.has(entry.playerId) ? (
              <Link
                href={`/dashboard/efootball/players/${entry.playerId}`}
                className="truncate text-base font-semibold text-ink hover:text-accent-ink"
              >
                {entry.playerName}
              </Link>
            ) : (
              <span className="truncate text-base font-semibold text-ink">{entry.playerName}</span>
            );

            const accent = TYPE_ACCENT[entry.type];

            return (
              <div
                key={entry.id}
                className={`relative flex min-w-0 flex-col items-center gap-1.5 overflow-hidden rounded-xl border pb-3 pt-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${accent.card}`}
              >
                <div className={`absolute inset-x-0 top-0 h-1.5 ${accent.bar}`} />

                <div className="relative">
                  <Avatar dpUrl={entry.playerDpUrl} name={entry.playerName} size="md" mode="static" className={`ring-2 ${accent.ring}`} />
                  <span
                    className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${accent.iconBg}`}
                  >
                    {entry.type === "transfer" ? <PlusIcon className="h-3 w-3" /> : <CloseIcon className="h-3 w-3" />}
                  </span>
                </div>

                <div className="w-full min-w-0 px-2">{nameNode}</div>

                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <StatusPill tone={entry.type === "transfer" ? "success" : "danger"}>{entry.type}</StatusPill>
                  <StatusPill tone="info">
                    {entry.team} #{entry.shirtNumber}
                  </StatusPill>
                </div>

                {entry.type === "transfer" && entry.fromClub ? (
                  <p className="flex w-full min-w-0 items-center justify-center gap-1 truncate px-2 text-xs text-ink-soft">
                    <ArrowRightIcon className="h-3 w-3 shrink-0 text-success-ink" />
                    <span className="truncate">{entry.fromClub}</span>
                  </p>
                ) : null}

                <span className="font-mono text-[11px] text-ink-faint">{entry.date}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
