"use client";

import { useMemo, useState } from "react";
import { CheckIcon, CloseIcon, SearchIcon, ShieldIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import type { ClubMemberProfile, Team } from "@/lib/api/teams";
import type { SubmitLineupPayload, TournamentLineupPlayer } from "@/lib/api/tournaments";

type Role = "starter" | "sub";

/**
 * Picks a tournament team that must match the preset exactly: `startersCount`
 * starters and `subsCount` substitutes, chosen from the club's members.
 * A saved squad (Team A/B…) can be loaded as a starting point and then tweaked.
 */
export function TeamSubmissionForm({
  startersCount,
  subsCount,
  members,
  teams,
  initialLineup,
  submitLabel,
  submittingLabel,
  isSubmitting,
  error,
  onSubmit,
}: {
  startersCount: number;
  subsCount: number;
  members: ClubMemberProfile[];
  teams: Team[];
  initialLineup?: { starters: TournamentLineupPlayer[]; substitutes: TournamentLineupPlayer[] } | null;
  submitLabel: string;
  submittingLabel: string;
  isSubmitting: boolean;
  error?: string;
  onSubmit: (payload: SubmitLineupPayload) => void;
}) {
  const { t } = useLanguage();
  const ts = t.dashboard.teamSubmission;

  const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);
  const [starterIds, setStarterIds] = useState<string[]>(() =>
    (initialLineup?.starters ?? []).map((p) => p.profileId).filter((id) => memberIds.has(id)),
  );
  const [subIds, setSubIds] = useState<string[]>(() =>
    (initialLineup?.substitutes ?? []).map((p) => p.profileId).filter((id) => memberIds.has(id)),
  );
  // The saved squad the current selection came from, until it is edited by hand.
  const [loadedTeam, setLoadedTeam] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState("");

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const nameOf = (m?: ClubMemberProfile) => m?.user?.name || ts.playerFallback;

  const startersLeft = Math.max(0, startersCount - starterIds.length);
  const subsLeft = Math.max(0, subsCount - subIds.length);
  const isComplete = startersLeft === 0 && subsLeft === 0;

  const roleOf = (id: string): Role | null =>
    starterIds.includes(id) ? "starter" : subIds.includes(id) ? "sub" : null;

  function toggle(id: string, role: Role) {
    setLoadedTeam(null);
    const current = roleOf(id);
    if (current === role) {
      if (role === "starter") setStarterIds((ids) => ids.filter((x) => x !== id));
      else setSubIds((ids) => ids.filter((x) => x !== id));
      return;
    }
    if (role === "starter" && starterIds.length >= startersCount) return;
    if (role === "sub" && subIds.length >= subsCount) return;
    if (current === "starter") setStarterIds((ids) => ids.filter((x) => x !== id));
    if (current === "sub") setSubIds((ids) => ids.filter((x) => x !== id));
    if (role === "starter") setStarterIds((ids) => [...ids, id]);
    else setSubIds((ids) => [...ids, id]);
  }

  function loadTeam(team: Team) {
    const starters = team.members.filter((m) => m.lineupStatus === "Starter").map((m) => m.id);
    const subs = team.members.filter((m) => m.lineupStatus === "Sub").map((m) => m.id);
    setStarterIds(starters.filter((id) => memberIds.has(id)).slice(0, startersCount));
    setSubIds(subs.filter((id) => memberIds.has(id)).slice(0, subsCount));
    setLoadedTeam({ id: team.id, name: team.name });
  }

  function handleSubmit() {
    if (!isComplete || isSubmitting) return;
    const toPlayer = (id: string): TournamentLineupPlayer => {
      const m = memberById.get(id);
      return { profileId: id, name: nameOf(m), gamePosition: m?.gamePosition ?? undefined };
    };
    onSubmit({
      starters: starterIds.map(toPlayer),
      substitutes: subIds.map(toPlayer),
      ...(loadedTeam ? { teamId: loadedTeam.id, teamName: loadedTeam.name } : {}),
    });
  }

  const query = search.trim().toLowerCase();
  const visibleMembers = query
    ? members.filter(
        (m) => nameOf(m).toLowerCase().includes(query) || (m.gamePosition ?? "").toLowerCase().includes(query),
      )
    : members;

  return (
    <div className="space-y-5">
      {/* Requirement meters */}
      <div className="grid grid-cols-2 gap-3">
        <Meter label={ts.starters} value={starterIds.length} total={startersCount} tone="success" />
        <Meter label={ts.substitutes} value={subIds.length} total={subsCount} tone="blue" />
      </div>

      {/* Saved squads */}
      {teams.length > 0 ? (
        <div>
          <div className="flex items-center gap-2">
            <ShieldIcon className="h-3.5 w-3.5 text-accent" />
            <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{ts.loadSaved}</h4>
          </div>
          <p className="mt-1 text-xs text-ink-faint">{ts.loadSavedHint}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {teams.map((team) => {
              const starters = team.members.filter((m) => m.lineupStatus === "Starter").length;
              const subs = team.members.filter((m) => m.lineupStatus === "Sub").length;
              const fits = starters === startersCount && subs === subsCount;
              const active = loadedTeam?.id === team.id;
              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => loadTeam(team)}
                  className={`rounded-xl border px-3.5 py-2 text-left transition-all ${
                    active
                      ? "border-accent bg-accent-soft ring-1 ring-accent/40"
                      : "border-surface-line bg-surface/50 hover:border-surface-line-strong"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-display text-sm font-bold text-ink">
                    {team.name}
                    {active ? <CheckIcon className="h-3.5 w-3.5 text-accent" /> : null}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
                    {format(ts.squadCounts, { starters, subs })}
                  </div>
                  <div className={`mt-0.5 text-[11px] font-semibold ${fits ? "text-success-ink" : "text-warning-ink"}`}>
                    {fits ? ts.squadMatches : format(ts.squadMismatch, { starters: startersCount, subs: subsCount })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Player picker */}
        <div className="rounded-2xl border border-surface-line bg-surface/40 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="font-display text-sm font-bold text-ink">{ts.pickPlayers}</h4>
            {members.length > 8 ? (
              <div className="relative sm:w-56">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={ts.searchPlaceholder}
                  className="w-full rounded-lg border border-surface-line bg-bg py-1.5 pl-8 pr-3 text-xs text-ink placeholder:text-ink-faint outline-none focus:border-accent"
                />
              </div>
            ) : null}
          </div>

          {members.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-surface-line py-8 text-center text-xs text-ink-faint">
              {ts.noMembers}
            </p>
          ) : visibleMembers.length === 0 ? (
            <p className="mt-4 py-8 text-center text-xs text-ink-faint">{ts.noMatch}</p>
          ) : (
            <ul className="mt-3 max-h-[26rem] space-y-1.5 overflow-y-auto pr-1">
              {visibleMembers.map((member) => {
                const role = roleOf(member.id);
                return (
                  <li
                    key={member.id}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors ${
                      role === "starter"
                        ? "border-success/50 bg-success-soft"
                        : role === "sub"
                          ? "border-blue/50 bg-blue-soft"
                          : "border-surface-line bg-bg/40"
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-line font-display text-[11px] font-bold text-ink-soft">
                      {nameOf(member).slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink">{nameOf(member)}</div>
                      {member.gamePosition ? (
                        <div className="font-mono text-[10px] font-bold text-accent-ink">{member.gamePosition}</div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 overflow-hidden rounded-lg border border-surface-line-strong">
                      <RoleButton
                        label={ts.asStarter}
                        active={role === "starter"}
                        disabled={role !== "starter" && startersLeft === 0}
                        activeClass="bg-success text-bg"
                        onClick={() => toggle(member.id, "starter")}
                      />
                      <RoleButton
                        label={ts.asSub}
                        active={role === "sub"}
                        disabled={role !== "sub" && subsLeft === 0}
                        activeClass="bg-blue text-bg"
                        onClick={() => toggle(member.id, "sub")}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Lineup preview with preset slots */}
        <div className="space-y-4 rounded-2xl border border-surface-line bg-bg/50 p-4">
          {loadedTeam ? (
            <div className="rounded-lg bg-accent-soft px-3 py-1.5 text-[11px] font-semibold text-accent-ink">
              {format(ts.basedOn, { team: loadedTeam.name })}
            </div>
          ) : null}
          <SlotList
            title={ts.startingLineup}
            ids={starterIds}
            total={startersCount}
            tone="success"
            emptyLabel={ts.emptySlot}
            memberById={memberById}
            nameOf={nameOf}
            removeLabel={(name) => format(ts.removePlayer, { name })}
            onRemove={(id) => toggle(id, "starter")}
          />
          {subsCount > 0 ? (
            <SlotList
              title={ts.bench}
              ids={subIds}
              total={subsCount}
              tone="blue"
              emptyLabel={ts.emptySlot}
              memberById={memberById}
              nameOf={nameOf}
              removeLabel={(name) => format(ts.removePlayer, { name })}
              onRemove={(id) => toggle(id, "sub")}
            />
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-danger/40 bg-danger-soft p-3 text-xs font-semibold text-danger-ink" role="alert">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-surface-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-xs font-semibold ${isComplete ? "text-success-ink" : "text-ink-faint"}`}>
          {isComplete ? ts.ready : format(ts.needMore, { starters: startersLeft, subs: subsLeft })}
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isComplete || isSubmitting}
          className="rounded-full bg-accent px-7 py-3 font-display text-sm font-black text-bg shadow-[0_0_22px_rgba(217,165,68,0.35)] transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none"
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </div>
  );
}

const METER_TONES = {
  success: { text: "text-success-ink", bar: "bg-success", border: "border-success/30" },
  blue: { text: "text-blue-ink", bar: "bg-blue", border: "border-blue/30" },
} as const;

function Meter({ label, value, total, tone }: { label: string; value: number; total: number; tone: keyof typeof METER_TONES }) {
  const styles = METER_TONES[tone];
  const done = value === total;
  return (
    <div className={`rounded-xl border bg-surface/40 p-3 ${styles.border}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{label}</span>
        <span className={`flex items-center gap-1 font-display text-sm font-black ${styles.text}`}>
          {done ? <CheckIcon className="h-3.5 w-3.5" /> : null}
          {value}/{total}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-line">
        <div
          className={`h-full rounded-full transition-all duration-300 ${styles.bar}`}
          style={{ width: `${total ? Math.min(100, (value / total) * 100) : 100}%` }}
        />
      </div>
    </div>
  );
}

function RoleButton({
  label,
  active,
  disabled,
  activeClass,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  activeClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`px-2.5 py-1.5 text-[11px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        active ? activeClass : "text-ink-soft hover:bg-surface-line/60 hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

function SlotList({
  title,
  ids,
  total,
  tone,
  emptyLabel,
  memberById,
  nameOf,
  removeLabel,
  onRemove,
}: {
  title: string;
  ids: string[];
  total: number;
  tone: keyof typeof METER_TONES;
  emptyLabel: string;
  memberById: Map<string, ClubMemberProfile>;
  nameOf: (m?: ClubMemberProfile) => string;
  removeLabel: (name: string) => string;
  onRemove: (id: string) => void;
}) {
  const styles = METER_TONES[tone];
  return (
    <div>
      <div className={`mb-2 font-mono text-[11px] font-bold uppercase tracking-wider ${styles.text}`}>
        {title} ({ids.length}/{total})
      </div>
      <ol className="space-y-1.5">
        {Array.from({ length: total }, (_, index) => {
          const id = ids[index];
          const member = id ? memberById.get(id) : undefined;
          return id ? (
            <li key={id} className={`flex items-center gap-2 rounded-lg border bg-surface/70 px-2.5 py-1.5 text-xs ${styles.border}`}>
              <span className="w-4 shrink-0 text-right font-mono text-[10px] text-ink-faint">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate font-semibold text-ink">{nameOf(member)}</span>
              {member?.gamePosition ? (
                <span className="font-mono text-[10px] font-bold text-accent-ink">{member.gamePosition}</span>
              ) : null}
              <button
                type="button"
                onClick={() => onRemove(id)}
                aria-label={removeLabel(nameOf(member))}
                className="rounded p-0.5 text-ink-faint transition-colors hover:text-danger-ink"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </li>
          ) : (
            <li
              key={`empty-${index}`}
              className="flex items-center gap-2 rounded-lg border border-dashed border-surface-line px-2.5 py-1.5 text-xs text-ink-faint"
            >
              <span className="w-4 shrink-0 text-right font-mono text-[10px]">{index + 1}</span>
              {emptyLabel}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
