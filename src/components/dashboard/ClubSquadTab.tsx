"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getPlayerRankings, type PlayerRankingRow } from "@/lib/mock/rankingsData";
import type { Club } from "@/lib/mock/types";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { SquadPlayerCard } from "./SquadPlayerCard";
import { EmptyState } from "./EmptyState";
import { Pagination } from "./Pagination";
import { StatusPill } from "./StatusPill";
import { Avatar } from "../common/Avatar";
import { UsersIcon, SearchIcon, TrophyIcon } from "../icons";

type Person = ReturnType<typeof useMockPeople>[number];
type TeamFilter = "all" | "Main" | "Academy" | "Legend";
type LineupFilter = "all" | "Starter" | "Sub" | "Staff";
type DataScope = "alltime" | "season";
type SortBy = "rank" | "az" | "w" | "pl" | "gf" | "pts";
type ViewMode = "grid" | "table";

const PAGE_SIZE_OPTIONS = [8, 12, 24];

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
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("all");
  const [lineupFilter, setLineupFilter] = useState<LineupFilter>("all");
  const [dataScope, setDataScope] = useState<DataScope>("alltime");
  const [sortBy, setSortBy] = useState<SortBy>("rank");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [pageSize, setPageSize] = useState(8);
  const [page, setPage] = useState(1);

  // Robustly build rows for every member in this club
  const rows: PlayerRankingRow[] = useMemo(() => {
    if (members.length === 0) return [];
    const clubMap = new Map([
      [club.id, club.name],
      [club.name, club.name],
    ]);

    const rankings = getPlayerRankings(
      dataScope === "alltime" ? "all-time" : "season-2026",
      members,
      clubMap
    );
    const rankingsById = new Map(rankings.map((r) => [r.id, r]));

    return members.map((p, idx) => {
      const existing = rankingsById.get(p.id);
      if (existing) {
        return {
          ...existing,
          clubName: club.name,
        };
      }
      const pts = p.points || 500;
      return {
        id: p.id,
        rank: idx + 1,
        name: p.name,
        dpUrl: p.dpUrl,
        clubName: club.name,
        PTS: pts,
        PL: Math.max(1, Math.round(pts / 50)),
        W: Math.max(0, Math.round(pts / 80)),
        D: 2,
        L: 1,
        GF: Math.max(0, Math.round(pts / 30)),
        GA: 8,
        CS: 3,
        HT: 1,
        DHT: 0,
        streak: 2,
        motm: 1,
        winPct: 60,
        VP: Math.round(pts * 0.8),
        isReal: true,
      };
    });
  }, [members, club.id, club.name, dataScope]);

  const personById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  // Filter and sort members
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = rows.filter((r) => {
      const person = personById.get(r.id);
      if (!person) return false;

      // Text Search
      if (q) {
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesPosition = (person.gamePosition ?? "").toLowerCase().includes(q);
        const matchesRole = (person.clubRole ?? "").toLowerCase().includes(q);
        const matchesShirt = String(person.shirtNumber ?? "").includes(q);
        if (!matchesName && !matchesPosition && !matchesRole && !matchesShirt) {
          return false;
        }
      }

      // Squad Team filter
      if (teamFilter !== "all" && (person.squadTeam ?? "Main") !== teamFilter) {
        return false;
      }

      // Lineup / Role filter
      if (lineupFilter === "Starter" && person.lineupStatus !== "Starter") return false;
      if (lineupFilter === "Sub" && person.lineupStatus !== "Sub") return false;
      if (
        lineupFilter === "Staff" &&
        person.clubRole !== "President" &&
        person.clubRole !== "Manager" &&
        person.clubRole !== "General Secretary"
      ) {
        return false;
      }

      return true;
    });

    list = [...list];
    if (sortBy === "rank") list.sort((a, b) => a.rank - b.rank);
    else if (sortBy === "az") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "pts") list.sort((a, b) => b.PTS - a.PTS);
    else if (sortBy === "w") list.sort((a, b) => b.W - a.W);
    else if (sortBy === "pl") list.sort((a, b) => b.PL - a.PL);
    else if (sortBy === "gf") list.sort((a, b) => b.GF - a.GF);

    return list;
  }, [rows, search, teamFilter, lineupFilter, sortBy, personById]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const pageRows = filtered.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, teamFilter, lineupFilter, dataScope, sortBy, pageSize]);

  const teamOptions: { key: TeamFilter; label: string }[] = [
    { key: "all", label: t.dashboard.clubSquad.teamFilterAll },
    { key: "Main", label: t.dashboard.clubSquad.squadTeamMain },
    { key: "Academy", label: t.dashboard.clubSquad.squadTeamAcademy },
    { key: "Legend", label: t.dashboard.clubSquad.squadTeamLegend },
  ];

  const lineupOptions: { key: LineupFilter; label: string }[] = [
    { key: "all", label: "All Roles" },
    { key: "Starter", label: "Starters" },
    { key: "Sub", label: "Substitutes" },
    { key: "Staff", label: "Management / Staff" },
  ];

  return (
    <div className="space-y-5">
      {/* Top Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-surface-line bg-surface/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players by name, #, position..."
            className="w-full rounded-lg border border-surface-line-strong bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
          />
        </div>

        {/* View Toggle & Count info */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-surface-line-strong bg-surface p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                viewMode === "grid" ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                viewMode === "table" ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"
              }`}
            >
              Table
            </button>
          </div>

          <label className="flex items-center gap-1.5 text-xs text-ink-soft">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-surface-line-strong bg-surface px-2 py-1 text-xs text-ink focus:border-accent focus:outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Filter Tabs & Sorts */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Team options */}
        <div className="flex flex-wrap items-center gap-1.5">
          {teamOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setTeamFilter(opt.key)}
              className={`rounded-full border px-3.5 py-1 text-xs font-medium transition-colors ${
                teamFilter === opt.key
                  ? "border-blue bg-blue-soft text-blue-ink"
                  : "border-surface-line-strong text-ink-soft hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Role options */}
        <div className="flex flex-wrap items-center gap-1.5">
          {lineupOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setLineupFilter(opt.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                lineupFilter === opt.key
                  ? "border-accent bg-accent-soft text-accent-ink"
                  : "border-surface-line-strong text-ink-soft hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Sort & Scope Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-ink-soft">
            {t.dashboard.clubSquad.sortByLabel}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="rounded-lg border border-surface-line-strong bg-surface px-2 py-1 text-xs text-ink focus:border-accent focus:outline-none"
            >
              <option value="rank">Rank</option>
              <option value="pts">Points</option>
              <option value="az">A-Z</option>
              <option value="w">{t.dashboard.clubSquad.winsLabel}</option>
              <option value="pl">{t.dashboard.clubSquad.playedLabel}</option>
              <option value="gf">{t.dashboard.clubSquad.goalsLabel}</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs text-ink-soft">
            {t.dashboard.clubSquad.dataScopeLabel}
            <select
              value={dataScope}
              onChange={(e) => setDataScope(e.target.value as DataScope)}
              className="rounded-lg border border-surface-line-strong bg-surface px-2 py-1 text-xs text-ink focus:border-accent focus:outline-none"
            >
              <option value="alltime">{t.dashboard.clubSquad.dataScopeAllTime}</option>
              <option value="season">{t.dashboard.clubSquad.dataScopeSeason}</option>
            </select>
          </label>
        </div>
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between text-xs text-ink-faint">
        <span>
          Showing {filtered.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, filtered.length)} of {filtered.length} players
        </span>
        {club.minRoster && club.maxRoster ? (
          <span className="font-mono">
            Roster limit: {club.minRoster}–{club.maxRoster} players
          </span>
        ) : null}
      </div>

      {/* Main Players Content */}
      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={UsersIcon}
            title={search ? "No players match your search" : t.dashboard.clubs.emptyState}
            body={search ? "Try searching for a different name, jersey number, or position." : ""}
          />
        </div>
      ) : viewMode === "grid" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

          <div className="mt-6">
            <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
          </div>
        </>
      ) : (
        /* Table View */
        <div className="overflow-hidden rounded-xl border border-surface-line bg-surface/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-surface-line bg-surface/80 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Squad Team</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Points</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-line/70">
                {pageRows.map((row) => {
                  const person = personById.get(row.id);
                  if (!person) return null;
                  return (
                    <tr key={row.id} className="transition-colors hover:bg-surface/60">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-ink-faint">
                        {person.shirtNumber ? `#${person.shirtNumber}` : `${row.rank}`}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/efootball/players/${person.id}`}
                          className="flex items-center gap-3 font-medium text-ink hover:text-accent-ink"
                        >
                          <Avatar dpUrl={person.dpUrl} name={person.name} size="sm" mode="static" />
                          <div className="min-w-0">
                            <div className="truncate font-semibold">{person.name}</div>
                            {person.bio ? <div className="truncate text-xs text-ink-faint">{person.bio}</div> : null}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-accent">
                        {person.gamePosition ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {person.clubRole ? (
                          <span className="inline-flex rounded bg-warning-soft px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-warning-ink">
                            {person.clubRole}
                          </span>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-soft">
                        {person.squadTeam ?? "Main"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <StatusPill
                          tone={
                            person.lineupStatus === "Starter"
                              ? "success"
                              : person.lineupStatus === "Sub"
                              ? "info"
                              : "neutral"
                          }
                        >
                          {person.lineupStatus ?? "None"}
                        </StatusPill>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold text-ink">
                        {row.PTS.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/efootball/players/${person.id}`}
                          className="rounded-lg border border-surface-line-strong px-2.5 py-1 text-xs font-medium text-ink-soft hover:border-accent hover:text-accent-ink"
                        >
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-surface-line p-4">
            <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
