"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAllPlayerStats } from "@/lib/api/hooks/useStats";
import { useClubLoans, useClubTransfers } from "@/lib/api/hooks/useTransfers";
import { format } from "@/lib/i18n/translations";
import { formatShortDate } from "./fixtures/labels";
import type { PlayerStatsRow } from "@/lib/api/stats";
import type { Club } from "@/lib/mock/types";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { SquadContractPill, SquadPlayerCard } from "./SquadPlayerCard";
import { StatsInfoPanel } from "./StatsInfoPanel";
import { EmptyState } from "./EmptyState";
import { Pagination } from "./Pagination";
import { StatusPill } from "./StatusPill";
import { Avatar } from "../common/Avatar";
import { UsersIcon, SearchIcon } from "../icons";

type Person = ReturnType<typeof useMockPeople>[number];
type TeamFilter = "all" | "Main" | "Academy" | "Legend";
type LineupFilter = "all" | "Starter" | "Sub" | "Staff";
type DataScope = "alltime" | "season";
type SortBy = "rank" | "az" | "w" | "pl" | "gf" | "pts";
type ViewMode = "grid" | "table";
/** Loans: everyone, players borrowed from other clubs, or our players away on loan. */
type LoanFilter = "all" | "borrowed" | "lent";

const PAGE_SIZE_OPTIONS = [8, 12, 24];

export function ClubSquadTab({
  club,
  members,
}: {
  club: Club;
  members: Person[];
}) {
  const { t, locale } = useLanguage();
  const tr = t.dashboard.transfers;
  const [loanFilter, setLoanFilter] = useState<LoanFilter>("all");
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("all");
  const [lineupFilter, setLineupFilter] = useState<LineupFilter>("all");
  const [dataScope, setDataScope] = useState<DataScope>("alltime");
  const [sortBy, setSortBy] = useState<SortBy>("rank");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [pageSize, setPageSize] = useState(8);
  const [page, setPage] = useState(1);

  // Every member's stats from confirmed results; members who haven't played get a zero line.
  const { data: stats } = useAllPlayerStats({
    clubId: club.id,
    period: dataScope === "alltime" ? "all-time" : "this-month",
  });
  // This endpoint deliberately exposes squad contracts publicly; wallet and
  // offer details are still returned only to the club's President / GS.
  const { data: transferData } = useClubTransfers(club.id);
  const contractByUserId = useMemo(
    () => new Map((transferData?.squad ?? []).map((member) => [member.userId, member.contract])),
    [transferData?.squad],
  );
  // Borrowed players are members here (with an "on loan from" note); lent ones play elsewhere.
  const loanByUserId = useMemo(
    () => new Map((transferData?.squad ?? []).filter((m) => m.onLoanFrom).map((m) => [m.userId, m.onLoanFrom!])),
    [transferData?.squad],
  );
  const { data: clubLoans } = useClubLoans(club.id);
  const lentOut = useMemo(
    () => (clubLoans?.loansOut ?? []).filter((l) => l.status === "active" || l.status === "returning" || l.status === "scheduled"),
    [clubLoans?.loansOut],
  );
  const rows: PlayerStatsRow[] = useMemo(() => {
    const byId = new Map((stats ?? []).map((r) => [r.id, r]));
    return members.map((p) => byId.get(p.id) ?? emptyStatsRow(p, club.name));
  }, [members, stats, club.name]);

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

      if (loanFilter === "borrowed" && !loanByUserId.has(person.id)) return false;

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
    if (sortBy === "rank") list.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
    else if (sortBy === "az") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "pts") list.sort((a, b) => b.PTS - a.PTS);
    else if (sortBy === "w") list.sort((a, b) => b.W - a.W);
    else if (sortBy === "pl") list.sort((a, b) => b.PL - a.PL);
    else if (sortBy === "gf") list.sort((a, b) => b.GF - a.GF);

    return list;
  }, [rows, search, teamFilter, lineupFilter, sortBy, personById, loanFilter, loanByUserId]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const pageRows = filtered.slice(startIndex, startIndex + pageSize);

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
      <StatsInfoPanel variant="players" />

      {/* Loans quick filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            ["all", tr.loanFilterAll, members.length],
            ["borrowed", tr.loanFilterBorrowed, loanByUserId.size],
            ["lent", tr.loanFilterLent, lentOut.length],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setLoanFilter(key);
              setPage(1);
            }}
            className={`rounded-full border px-3.5 py-1 text-xs font-semibold transition-colors ${
              loanFilter === key ? "border-accent bg-accent-soft text-accent-ink" : "border-surface-line-strong text-ink-soft hover:text-ink"
            }`}
          >
            {label} <span className="opacity-70">({count})</span>
          </button>
        ))}
      </div>

      {loanFilter === "lent" ? (
        lentOut.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lentOut.map((loan) => (
              <Link
                key={loan.id}
                href={`/dashboard/efootball/players/${loan.player.id}`}
                className="flex items-center gap-3 rounded-xl border border-surface-line bg-surface/50 p-3.5 transition-colors hover:border-accent/50"
              >
                <Avatar dpUrl={loan.player.dpUrl} name={loan.player.name} size="md" mode="static" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-ink">{loan.player.name}</div>
                  <div className="truncate text-[11px] text-accent-ink">{format(tr.loanAt, { club: loan.borrowClub.name })}</div>
                  <div className="mt-1 flex flex-wrap gap-x-2 text-[11px] text-ink-faint">
                    <span>{format(tr.loanProgress, { played: loan.matchesPlayed, total: loan.matches })}</span>
                    {loan.endsBy ? <span>{format(tr.loanEndsBy, { date: formatShortDate(loan.endsBy, locale) })}</span> : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon={UsersIcon} title={tr.loanNoneLent} body="" />
        )
      ) : null}
      {loanFilter === "lent" ? null : (<>
      {/* Top Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-surface-line bg-surface/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
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
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
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
              onClick={() => {
                setTeamFilter(opt.key);
                setPage(1);
              }}
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
              onClick={() => {
                setLineupFilter(opt.key);
                setPage(1);
              }}
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
              onChange={(e) => {
                setSortBy(e.target.value as SortBy);
                setPage(1);
              }}
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
              onChange={(e) => {
                setDataScope(e.target.value as DataScope);
                setPage(1);
              }}
              className="rounded-lg border border-surface-line-strong bg-surface px-2 py-1 text-xs text-ink focus:border-accent focus:outline-none"
            >
              <option value="alltime">{t.dashboard.clubSquad.dataScopeAllTime}</option>
              <option value="season">{t.dashboard.rankings.periodThisMonth}</option>
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
                <div key={row.id} className="relative">
                  <SquadPlayerCard
                    person={person}
                    row={row}
                    contract={transferData ? (contractByUserId.get(person.id) ?? null) : undefined}
                  />
                  {loanByUserId.has(person.id) ? (
                    <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-full border border-accent/50 bg-bg/90 px-2 py-0.5 text-[10px] font-bold text-accent-ink backdrop-blur">
                      {format(tr.loanFrom, { club: loanByUserId.get(person.id)!.clubName })} ·{" "}
                      {format(tr.loanProgress, {
                        played: loanByUserId.get(person.id)!.matchesPlayed,
                        total: loanByUserId.get(person.id)!.matches,
                      })}
                    </span>
                  ) : null}
                </div>
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
                  <th className="px-4 py-3">{t.dashboard.clubSquad.contractExpiresLabel}</th>
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
                        {person.shirtNumber ? `#${person.shirtNumber}` : (row.rank ?? "—")}
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
                        {loanByUserId.has(person.id) ? (
                          <div className="mt-1 text-[10px] font-bold text-accent-ink">
                            {format(tr.loanFrom, { club: loanByUserId.get(person.id)!.clubName })}
                          </div>
                        ) : null}
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
                      <td className="px-4 py-3 text-xs">
                        <SquadContractPill
                          contract={transferData ? (contractByUserId.get(person.id) ?? null) : undefined}
                        />
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
      </>)}
    </div>
  );
}

/** A member with no confirmed games in the period. */
function emptyStatsRow(p: Person, clubName: string): PlayerStatsRow {
  return {
    id: p.id,
    name: p.name,
    dpUrl: p.dpUrl ?? null,
    clubName,
    rank: null,
    PL: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, CS: 0, HT: 0, DHT: 0,
    streak: 0, motm: 0, winPct: 0, PTS: 0,
  };
}
