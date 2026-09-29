"use client";

import { useState } from "react";
import { Avatar } from "@/components/common/Avatar";
import { CloseIcon, PlusIcon, SearchIcon, ShieldIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format, roleLabel } from "@/lib/i18n/translations";
import { useCommunityMembers } from "@/lib/api/hooks/useCommunities";
import type { BackendCommunityMember } from "@/lib/api/types";

/** Mirrors the backend limit on match officials per tournament. */
export const MAX_MATCH_OFFICIALS = 10;
const LEADER_ROLES = ["President", "Vice President"];

/**
 * Picks the tournament's match officials: community members who review match
 * evidence alongside the President and Vice President (who always review).
 * `value` holds user ids.
 */
export function MatchOfficialsPicker({
  communityId,
  value,
  onChange,
}: {
  communityId: string;
  value: string[];
  onChange: (userIds: string[]) => void;
}) {
  const { t } = useLanguage();
  const mo = t.dashboard.matchOfficials;
  const { data: members = [], isLoading } = useCommunityMembers(communityId);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const leaders = members.filter((m) => LEADER_ROLES.includes(m.communityRole));
  const byId = new Map(members.map((m) => [m.id, m]));
  const selected = value.map((id) => byId.get(id)).filter((m): m is BackendCommunityMember => Boolean(m));
  const full = value.length >= MAX_MATCH_OFFICIALS;

  // Everyone who can be picked (not the President / VP), filtered by the search.
  const query = search.trim().toLowerCase();
  const options = members.filter(
    (m) =>
      !LEADER_ROLES.includes(m.communityRole) &&
      (!query || m.name.toLowerCase().includes(query) || (m.clubName ?? "").toLowerCase().includes(query)),
  );

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else if (!full) onChange([...value, id]);
  };
  const remove = (id: string) => onChange(value.filter((x) => x !== id));

  if (!communityId) {
    return <p className="text-xs text-ink-faint">{mo.pickCommunityFirst}</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-ink-soft">{mo.hint}</p>

      {/* Always reviewing */}
      {leaders.length ? (
        <div>
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{mo.alwaysReview}</div>
          <div className="flex flex-wrap gap-2">
            {leaders.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-2 rounded-full border border-surface-line bg-surface/60 py-1 pl-1 pr-3 text-xs"
              >
                <Avatar dpUrl={m.dpUrl} name={m.name} size="sm" mode="static" />
                <span className="font-semibold text-ink">{m.name}</span>
                <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent-ink">
                  {roleLabel(m.communityRole, t)}
                </span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Chosen officials */}
      <div>
        <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">
          <span>{mo.officials}</span>
          <span>
            {value.length}/{MAX_MATCH_OFFICIALS}
          </span>
        </div>
        {selected.length ? (
          <div className="flex flex-wrap gap-2">
            {selected.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-2 rounded-full border border-blue/40 bg-blue-soft py-1 pl-1 pr-1.5 text-xs"
              >
                <Avatar dpUrl={m.dpUrl} name={m.name} size="sm" mode="static" />
                <span className="font-semibold text-ink">{m.name}</span>
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  aria-label={format(mo.remove, { name: m.name })}
                  className="rounded-full p-1 text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger-ink"
                >
                  <CloseIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="flex items-center gap-2 rounded-xl border border-dashed border-surface-line px-3 py-2.5 text-xs text-ink-faint">
            <ShieldIcon className="h-3.5 w-3.5 shrink-0" />
            {mo.none}
          </p>
        )}
      </div>

      {/* Search community members */}
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
        <input
          type="search"
          value={search}
          disabled={full || isLoading}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={full ? mo.limitReached : isLoading ? mo.loading : mo.searchPlaceholder}
          className="w-full rounded-xl border border-surface-line bg-bg py-2.5 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-blue disabled:opacity-50"
        />
        {query ? (
          <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-surface-line-strong bg-bg-raised p-1 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8)]">
            {results.length ? (
              results.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => add(m.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-line/60"
                  >
                    <Avatar dpUrl={m.dpUrl} name={m.name} size="sm" mode="static" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{m.name}</span>
                      <span className="block truncate text-[11px] text-ink-faint">
                        {[m.clubName, roleLabel(m.communityRole, t)].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <PlusIcon className="h-4 w-4 shrink-0 text-blue-ink" />
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-3 text-center text-xs text-ink-faint">{mo.noResults}</li>
            )}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
