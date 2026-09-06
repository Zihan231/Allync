"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Club } from "@/lib/mock/types";
import type { useMockPeople } from "@/lib/mock/communityStore";
import { Avatar } from "../common/Avatar";
import { StatusPill } from "./StatusPill";
import { EmptyState } from "./EmptyState";
import { Pagination } from "./Pagination";
import { SearchIcon, UsersIcon } from "../icons";

type Person = ReturnType<typeof useMockPeople>[number];
type CategoryFilter = "all" | "staff" | "club" | "freeAgent";

const PAGE_SIZE = 15;

export function CommunityMembersTab({ members, memberClubs }: { members: Person[]; memberClubs: Club[] }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [page, setPage] = useState(1);

  const clubById = useMemo(() => new Map(memberClubs.map((c) => [c.id, c])), [memberClubs]);

  const categorize = (p: Person): Exclude<CategoryFilter, "all"> => {
    if (p.communityRole && p.communityRole !== "Member") return "staff";
    if (!p.clubId) return "freeAgent";
    return "club";
  };

  const filtered = members.filter((p) => {
    const q = search.trim().toLowerCase();
    if (q && !p.name.toLowerCase().includes(q)) return false;
    if (category !== "all" && categorize(p) !== category) return false;
    return true;
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageMembers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleCategory = (value: CategoryFilter) => {
    setCategory(value);
    setPage(1);
  };

  const filterOptions: { key: CategoryFilter; label: string }[] = [
    { key: "all", label: t.dashboard.communityMembers.filterAll },
    { key: "staff", label: t.dashboard.communityMembers.filterStaff },
    { key: "club", label: t.dashboard.communityMembers.filterClub },
    { key: "freeAgent", label: t.dashboard.communityMembers.filterFreeAgent },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t.dashboard.communityMembers.searchPlaceholder}
            className="w-full rounded-lg border border-surface-line-strong bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleCategory(opt.key)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                category === opt.key
                  ? "border-blue bg-blue-soft text-blue-ink"
                  : "border-surface-line-strong text-ink-soft hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="font-mono text-[11px] text-ink-faint">{filtered.length} {t.dashboard.community.totalMembersLabel}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={UsersIcon} title={t.dashboard.communityMembers.noEntries} body="" />
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pageMembers.map((person) => {
            const club = person.clubId ? clubById.get(person.clubId) : undefined;
            const isStaff = person.communityRole && person.communityRole !== "Member";

            return (
              <Link
                key={person.id}
                href={`/dashboard/efootball/players/${person.id}`}
                className="flex items-center gap-3 rounded-xl border border-surface-line bg-surface/40 p-3.5 transition-colors hover:border-accent"
              >
                <Avatar dpUrl={person.dpUrl} name={person.name} size="md" mode="static" />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{person.name}</span>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {isStaff ? <StatusPill tone="accent">{person.communityRole}</StatusPill> : null}
                    {club ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold"
                        style={{ backgroundColor: `${club.color}26`, color: club.color }}
                      >
                        {club.name}
                      </span>
                    ) : !isStaff ? (
                      <StatusPill tone="warning">{t.dashboard.communityMembers.freeAgentLabel}</StatusPill>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="mt-5">
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </div>
      ) : null}
    </div>
  );
}
