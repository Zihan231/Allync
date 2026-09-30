"use client";

import { useState } from "react";
import { Avatar } from "@/components/common/Avatar";
import { CheckIcon, ChevronDownIcon, CloseIcon, PlusIcon, SearchIcon, ShieldIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format, roleLabel } from "@/lib/i18n/translations";
import { useCommunityMembers } from "@/lib/api/hooks/useCommunities";
import { useClubMembers } from "@/lib/api/hooks/useTeams";

/** Mirrors the backend limit on match officials per tournament. */
export const MAX_MATCH_OFFICIALS = 10;

/** Who hosts the tournament; decides who always reviews and who can be picked. */
export type OfficialsHost = { kind: "community" | "club"; id: string };

// Mirrors the backend role lists (tournaments.service.ts).
const ROLES = {
  community: {
    leaders: ["President", "Vice President"],
    officials: ["Team Manager", "Head of Discipline", "Scout"],
  },
  club: {
    leaders: ["President", "General Secretary"],
    officials: ["Captain", "Vice-Captain", "Academy Captain", "Manager"],
  },
} as const;

/** A community or club member, in one shape. `id` is the user id officials are stored by. */
interface Candidate {
  id: string;
  name: string;
  dpUrl: string | null;
  role: string;
  /** Extra line under the name (their club, for community members). */
  detail: string | null;
}

/**
 * Picks the tournament's match officials, who review match evidence alongside
 * the host's leaders (who always review): community officials for a community
 * tournament, club staff for a club tournament. `value` holds user ids.
 */
export function MatchOfficialsPicker({
  host,
  value,
  onChange,
}: {
  host: OfficialsHost;
  value: string[];
  onChange: (userIds: string[]) => void;
}) {
  const { t } = useLanguage();
  const mo = t.dashboard.matchOfficials;
  const isClub = host.kind === "club";
  const community = useCommunityMembers(isClub ? "" : host.id);
  const club = useClubMembers(isClub ? host.id : "");
  const isLoading = isClub ? club.isLoading : community.isLoading;
  const members: Candidate[] = isClub
    ? (club.data ?? []).map((m) => ({
        id: m.userId,
        name: m.user?.name || mo.unnamed,
        dpUrl: m.user?.dpUrl ?? null,
        role: m.clubRole ?? "",
        detail: null,
      }))
    : (community.data ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        dpUrl: m.dpUrl,
        role: m.communityRole,
        detail: m.clubName,
      }));
  const roles = ROLES[host.kind];
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const leaders = members.filter((m) => (roles.leaders as readonly string[]).includes(m.role));
  const byId = new Map(members.map((m) => [m.id, m]));
  const selected = value.map((id) => byId.get(id)).filter((m): m is Candidate => Boolean(m));
  const full = value.length >= MAX_MATCH_OFFICIALS;

  // Officials who can be picked, filtered by the search.
  const query = search.trim().toLowerCase();
  const eligible = members.filter((m) => (roles.officials as readonly string[]).includes(m.role));
  const options = eligible.filter(
    (m) => !query || m.name.toLowerCase().includes(query) || (m.detail ?? "").toLowerCase().includes(query),
  );

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else if (!full) onChange([...value, id]);
  };
  const remove = (id: string) => onChange(value.filter((x) => x !== id));

  if (!host.id) {
    return <p className="text-xs text-ink-faint">{mo.pickCommunityFirst}</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-ink-soft">{isClub ? mo.hintClub : mo.hint}</p>

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
                  {roleLabel(m.role, t)}
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
            {isClub ? mo.noneClub : mo.none}
          </p>
        )}
      </div>

      {/* Member dropdown: opens in the page flow (not floating), so parent sections never clip it */}
      <div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={isLoading}
          aria-expanded={open}
          className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-bg px-3.5 py-2.5 text-left text-sm transition-colors disabled:opacity-50 ${
            open ? "border-blue" : "border-surface-line hover:border-surface-line-strong"
          }`}
        >
          <span className="flex items-center gap-2 text-ink-soft">
            <PlusIcon className="h-4 w-4 text-blue-ink" />
            {isLoading ? mo.loading : mo.selectMembers}
          </span>
          <ChevronDownIcon className={`h-4 w-4 text-ink-faint transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open ? (
          <div className="mt-2 overflow-hidden rounded-xl border border-surface-line-strong bg-bg-raised">
            <div className="relative border-b border-surface-line p-2">
              <SearchIcon className="pointer-events-none absolute left-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
              <input
                type="search"
                value={search}
                autoFocus
                onChange={(e) => setSearch(e.target.value)}
                placeholder={mo.searchPlaceholder}
                className="w-full rounded-lg border border-surface-line bg-bg py-2 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-blue"
              />
            </div>
            {full ? (
              <p className="border-b border-surface-line bg-warning-soft px-3 py-2 text-[11px] font-semibold text-warning-ink">
                {mo.limitReached} ({MAX_MATCH_OFFICIALS})
              </p>
            ) : null}
            <ul className="max-h-64 overflow-y-auto p-1">
              {options.length ? (
                options.map((m) => {
                  const picked = value.includes(m.id);
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => toggle(m.id)}
                        disabled={!picked && full}
                        aria-pressed={picked}
                        className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors disabled:opacity-40 ${
                          picked ? "bg-blue-soft" : "hover:bg-surface-line/60"
                        }`}
                      >
                        <Avatar dpUrl={m.dpUrl} name={m.name} size="sm" mode="static" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink">{m.name}</span>
                          <span className="block truncate text-[11px] text-ink-faint">
                            {[m.detail, roleLabel(m.role, t)].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                            picked ? "border-blue bg-blue text-bg" : "border-surface-line-strong"
                          }`}
                        >
                          {picked ? <CheckIcon className="h-3.5 w-3.5" /> : null}
                        </span>
                      </button>
                    </li>
                  );
                })
              ) : (
                <li className="px-3 py-4 text-center text-xs text-ink-faint">
                  {eligible.length ? mo.noResults : isClub ? mo.noOfficialsClub : mo.noOfficials}
                </li>
              )}
            </ul>
            <div className="flex items-center justify-between border-t border-surface-line px-3 py-2">
              <span className="font-mono text-[11px] text-ink-faint">
                {value.length}/{MAX_MATCH_OFFICIALS}
              </span>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSearch("");
                }}
                className="rounded-full bg-blue px-4 py-1.5 text-xs font-bold text-bg transition-opacity hover:opacity-90"
              >
                {mo.done}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
