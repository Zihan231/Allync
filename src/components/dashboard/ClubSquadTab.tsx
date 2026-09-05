"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getPlayerRankings } from "@/lib/mock/rankingsData";
import type { Club } from "@/lib/mock/types";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { SquadPlayerCard } from "./SquadPlayerCard";
import { EmptyState } from "./EmptyState";
import { Pagination } from "./Pagination";
import { UsersIcon } from "../icons";

type Person = ReturnType<typeof useMockPeople>[number];
type TeamFilter = "all" | "Main" | "Academy" | "Legend";
type DataScope = "alltime" | "season";
type SortBy = "rank" | "az" | "w" | "pl" | "gf";

const PAGE_SIZE = 12;

export function ClubSquadTab({
  club,
  members,
  contractDaysById,
}: {
  club: Club;
  members: Person[];
  contractDaysById: Map<string, number>;
}) {
  const { t } = useLanguage();
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("all");
  const [dataScope, setDataScope] = useState<DataScope>("alltime");
  const [sortBy, setSortBy] = useState<SortBy>("rank");
  const [page, setPage] = useState(1);

  const clubNameById = useMemo(() => new Map([[club.id, club.name]]), [club.id, club.name]);

  const rows = useMemo(() => {
    if (members.length === 0) return [];
    return getPlayerRankings(dataScope === "alltime" ? "all-time" : "season-2026", members, clubNameById).filter(
      (r) => r.isReal && r.clubName === club.name
    );
  }, [members, clubNameById, club.name, dataScope]);

  const personById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const filtered = useMemo(() => {
    let list = rows.filter((r) => {
      if (teamFilter === "all") return true;
      const person = personById.get(r.id);
      return (person?.squadTeam ?? "Main") === teamFilter;
    });
    list = [...list];
    if (sortBy === "rank") list.sort((a, b) => a.rank - b.rank);
    else if (sortBy === "az") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "w") list.sort((a, b) => b.W - a.W);
    else if (sortBy === "pl") list.sort((a, b) => b.PL - a.PL);
    else if (sortBy === "gf") list.sort((a, b) => b.GF - a.GF);
    return list;
  }, [rows, teamFilter, sortBy, personById]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [teamFilter, dataScope, sortBy]);

  const teamOptions: { key: TeamFilter; label: string }[] = [
    { key: "all", label: t.dashboard.clubSquad.teamFilterAll },
    { key: "Main", label: t.dashboard.clubSquad.squadTeamMain },
    { key: "Academy", label: t.dashboard.clubSquad.squadTeamAcademy },
    { key: "Legend", label: t.dashboard.clubSquad.squadTeamLegend },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {teamOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setTeamFilter(opt.key)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                teamFilter === opt.key
                  ? "border-blue bg-blue-soft text-blue-ink"
                  : "border-surface-line-strong text-ink-soft hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-1.5 text-xs text-ink-soft">
          {t.dashboard.clubSquad.dataScopeLabel}
          <select
            value={dataScope}
            onChange={(e) => setDataScope(e.target.value as DataScope)}
            className="rounded-lg border border-surface-line-strong bg-surface px-2 py-1.5 text-xs text-ink"
          >
            <option value="alltime">{t.dashboard.clubSquad.dataScopeAllTime}</option>
            <option value="season">{t.dashboard.clubSquad.dataScopeSeason}</option>
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-xs text-ink-soft">
          {t.dashboard.clubSquad.sortByLabel}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="rounded-lg border border-surface-line-strong bg-surface px-2 py-1.5 text-xs text-ink"
          >
            <option value="rank">Rank</option>
            <option value="az">A-Z</option>
            <option value="w">{t.dashboard.clubSquad.winsLabel}</option>
            <option value="pl">{t.dashboard.clubSquad.playedLabel}</option>
            <option value="gf">{t.dashboard.clubSquad.goalsLabel}</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={UsersIcon} title={t.dashboard.clubs.emptyState} body="" />
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageRows.map((row) => {
              const person = personById.get(row.id);
              if (!person) return null;
              return (
                <SquadPlayerCard
                  key={row.id}
                  person={person}
                  row={row}
                  contractDays={contractDaysById.get(person.id) ?? 30}
                />
              );
            })}
          </div>
          <div className="mt-5">
            <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
