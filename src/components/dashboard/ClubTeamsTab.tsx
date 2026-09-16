"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Avatar } from "@/components/common/Avatar";
import { ClubCrest } from "@/components/common/ClubCrest";
import { useTeams, useTeam, useCreateTeam, useDeleteTeam, useSubstitutePlayer } from "@/lib/api/hooks/useTeams";
import { useClubManager } from "@/lib/api/hooks/useClubs";
import { isApiError } from "@/lib/api/axios";
import { TacticalPitch } from "./TacticalPitch";
import { PitchPlayerCard, calculateRating } from "./PitchPlayerCard";
import { EmptyState } from "./EmptyState";
import { UsersIcon, SwapIcon, PlusIcon, CloseIcon } from "@/components/icons";
import type { ClubMemberProfile } from "@/lib/api/teams";
import type { Club } from "@/lib/mock/types";

export interface ClubTeamsTabProps {
  clubId: string;
  canManage: boolean;
  club?: Club;
}

export function ClubTeamsTab({ clubId, canManage, club }: ClubTeamsTabProps) {
  const { data: teams, isLoading: isLoadingTeams, isError: isErrorTeams, error: teamsError } = useTeams(clubId);
  const { data: managerData, isLoading: isLoadingManager } = useClubManager(clubId);
  const createTeam = useCreateTeam(clubId);
  const deleteTeam = useDeleteTeam(clubId);

  // Active selected team
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [subNotice, setSubNotice] = useState<string | null>(null);

  // Substitution state: when an on-pitch player is selected to sub out
  const [selectedPitchPlayerId, setSelectedPitchPlayerId] = useState<string | null>(null);

  const activeTeamId = selectedTeamId || teams?.[0]?.id || "";
  const { data: activeTeamData, isLoading: isLoadingActiveTeam } = useTeam(clubId, activeTeamId);

  const currentTeam = activeTeamData || teams?.find((t) => t.id === activeTeamId);
  const substituteMutation = useSubstitutePlayer(clubId, activeTeamId);

  // Starters and Substitutes
  const starters = useMemo(() => {
    if (!currentTeam?.members) return [];
    return currentTeam.members.filter((m) => m.lineupStatus === "Starter");
  }, [currentTeam?.members]);

  const subs = useMemo(() => {
    if (!currentTeam?.members) return [];
    return currentTeam.members.filter((m) => m.lineupStatus === "Sub");
  }, [currentTeam?.members]);

  // Collective Strength calculation (sum of starter ratings, matching eFootball)
  const collectiveStrength = useMemo(() => {
    if (!starters.length) return 2800;
    const baseSum = starters.reduce((acc, p) => acc + calculateRating(p.points), 0);
    // Standard eFootball squad rating multiplier
    const multiplier = 11 / Math.max(starters.length, 1);
    return Math.round(baseSum * (multiplier * 0.98));
  }, [starters]);

  // Resolve Manager details
  const manager = useMemo(() => {
    if (managerData) {
      const u = (managerData as any).user || (managerData as any).manager;
      const uId = (managerData as any).userId || (managerData as any).manager?.userId;
      if (u || uId) {
        return {
          id: uId,
          name: u?.name || "Team Manager",
          dpUrl: u?.dpUrl || null,
          role: "Manager",
        };
      }
    }
    return {
      id: "unassigned",
      name: "Club Manager",
      dpUrl: null,
      role: "Manager",
    };
  }, [managerData]);

  // Handle player selection on pitch
  const handlePitchPlayerClick = (player: ClubMemberProfile) => {
    if (!canManage) return;
    if (selectedPitchPlayerId === player.id) {
      setSelectedPitchPlayerId(null);
    } else {
      setSelectedPitchPlayerId(player.id);
      setSubNotice(`Selected ${player.user?.name || "player"} to sub out. Click a bench player to swap.`);
    }
  };

  // Handle bench player click for substitution
  const handleBenchPlayerClick = async (benchPlayer: ClubMemberProfile) => {
    if (!canManage || !selectedPitchPlayerId) return;

    try {
      const outPlayer = starters.find((p) => p.id === selectedPitchPlayerId);
      const res = await substituteMutation.mutateAsync({
        outProfileId: selectedPitchPlayerId,
        inProfileId: benchPlayer.id,
      });

      setSubNotice(
        `✓ Substituted ${benchPlayer.user?.name || "Player"} IN for ${
          outPlayer?.user?.name || "Player"
        } OUT!`
      );
      setSelectedPitchPlayerId(null);

      setTimeout(() => {
        setSubNotice(null);
      }, 4000);
    } catch (err: any) {
      setSubNotice(isApiError(err) ? err.message : "Substitution failed. Please try again.");
    }
  };

  const handleCreateTeamSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    createTeam.mutate(newTeamName.trim(), {
      onSuccess: (team) => {
        setNewTeamName("");
        setIsCreatingTeam(false);
        setSelectedTeamId(team.id);
      },
    });
  };

  if (isLoadingTeams) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <span className="ml-3 text-sm text-ink-soft">Loading team formation…</span>
      </div>
    );
  }

  if (isErrorTeams) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
        {isApiError(teamsError) ? teamsError.message : "Failed to load club teams"}
      </div>
    );
  }

  // No teams created yet
  if (!teams || teams.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={UsersIcon}
          title="No teams registered yet"
          body="Form your club squad to deploy players onto the tactical football pitch."
        />
        {canManage && (
          <div className="mx-auto max-w-md rounded-2xl border border-surface-line bg-surface/50 p-5 text-center">
            <h4 className="font-display text-sm font-bold text-ink">Create Your First Squad</h4>
            <form onSubmit={handleCreateTeamSubmit} className="mt-3 flex gap-2">
              <input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g. Team A, Main Squad"
                className="flex-1 rounded-xl border border-surface-line bg-bg px-3 py-2 text-xs text-ink outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={createTeam.isPending || !newTeamName.trim()}
                className="rounded-xl bg-accent px-4 py-2 font-display text-xs font-semibold text-bg disabled:opacity-50"
              >
                {createTeam.isPending ? "Creating..." : "Create Squad"}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Team Selector & Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-line bg-surface/40 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-faint">Squad:</span>
          {teams.map((t) => {
            const isActive = t.id === activeTeamId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedTeamId(t.id);
                  setSelectedPitchPlayerId(null);
                  setSubNotice(null);
                }}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-display text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-accent text-bg shadow-[0_0_15px_rgba(217,165,68,0.3)]"
                    : "border border-surface-line-strong bg-bg text-ink-soft hover:text-ink"
                }`}
              >
                <span>{t.name}</span>
                <span className="text-[10px] opacity-75">
                  ({t.members.filter((m) => m.lineupStatus === "Starter").length}/11)
                </span>
              </button>
            );
          })}

          {canManage && teams.length < 3 && !isCreatingTeam && (
            <button
              type="button"
              onClick={() => setIsCreatingTeam(true)}
              className="flex items-center gap-1 rounded-full border border-dashed border-surface-line-strong px-3 py-1.5 text-xs text-ink-soft hover:border-accent hover:text-accent-ink"
            >
              <PlusIcon className="h-3 w-3" />
              <span>New Squad</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {canManage && (
            <Link
              href={`/dashboard/efootball/clubs/${clubId}/teams/${activeTeamId}`}
              className="rounded-full border border-surface-line-strong px-3 py-1.5 font-display text-xs font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent-ink"
            >
              Manage Full Roster →
            </Link>
          )}
        </div>
      </div>

      {/* New Team Inline Form Modal */}
      {isCreatingTeam && (
        <form
          onSubmit={handleCreateTeamSubmit}
          className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/5 p-3"
        >
          <input
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="New squad name (e.g. Team B, Academy)"
            className="flex-1 rounded-lg border border-surface-line bg-bg px-3 py-1.5 text-xs text-ink outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={createTeam.isPending || !newTeamName.trim()}
            className="rounded-lg bg-accent px-3.5 py-1.5 font-display text-xs font-semibold text-bg disabled:opacity-50"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingTeam(false)}
            className="rounded-lg p-1.5 text-ink-faint hover:text-ink"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </form>
      )}

      {/* Substitution Status Notification Banner */}
      {subNotice && (
        <div className="flex items-center justify-between rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5 text-xs font-medium text-accent-ink">
          <div className="flex items-center gap-2">
            <SwapIcon className="h-4 w-4 shrink-0 text-accent animate-spin" />
            <span>{subNotice}</span>
          </div>
          {selectedPitchPlayerId && (
            <button
              type="button"
              onClick={() => {
                setSelectedPitchPlayerId(null);
                setSubNotice(null);
              }}
              className="rounded-full bg-black/40 px-2.5 py-1 text-[10px] uppercase font-bold text-ink hover:text-danger-ink"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* MAIN GAMEPLAN / SQUAD FORMATION LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_240px] gap-5 items-start">
        {/* LEFT COLUMN: Club Crest, Manager, Collective Strength */}
        <div className="space-y-4 rounded-2xl border border-surface-line bg-surface/50 p-4">
          {/* Club Crest & Info */}
          <div className="flex items-center gap-3 border-b border-surface-line pb-4">
            {club ? (
              <ClubCrest
                name={club.name}
                color={club.color}
                initials={club.initials}
                imageUrl={club.dpUrl}
                size="md"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-accent-ink font-bold">
                FC
              </div>
            )}
            <div className="min-w-0">
              <h3 className="truncate font-display text-sm font-bold text-ink">
                {club?.name || "Club Squad"}
              </h3>
              <span className="inline-block rounded bg-bg-raised px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-ink">
                {currentTeam?.name || "Active Squad"}
              </span>
            </div>
          </div>

          {/* Manager Card */}
          <div className="rounded-xl border border-surface-line bg-bg-raised/70 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
              Tactical Head
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <div className="relative">
                <Avatar dpUrl={manager.dpUrl} name={manager.name} size="md" mode="static" />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] font-black text-bg shadow">
                  ★
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-xs font-bold text-ink">{manager.name}</p>
                <p className="text-[10px] text-accent-ink font-semibold">Manager</p>
                <p className="text-[9px] text-ink-faint">Possession Game</p>
              </div>
            </div>
          </div>

          {/* Collective Strength Card */}
          <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent p-4 text-center">
            <p className="font-display text-[10px] font-black tracking-widest text-accent uppercase">
              COLLECTIVE STRENGTH
            </p>
            <p className="mt-1 font-display text-4xl font-black tracking-tight text-ink drop-shadow-[0_0_15px_rgba(217,165,68,0.3)]">
              {collectiveStrength.toLocaleString()}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-black/45 p-2 border border-white/5">
              <div className="flex flex-col items-center justify-center border-r border-white/10 pr-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-ink-faint">Formation</span>
                <span className="font-display text-xs font-black text-ink whitespace-nowrap">4-3-3</span>
              </div>
              <div className="flex flex-col items-center justify-center pl-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-ink-faint">Starters</span>
                <span className="font-display text-xs font-black text-emerald-400 whitespace-nowrap">{starters.length}/11 Active</span>
              </div>
            </div>
          </div>

          {/* Captain Banner */}
          {currentTeam?.captain && (
            <div className="flex items-center justify-between rounded-xl border border-surface-line bg-bg px-3 py-2 text-xs">
              <span className="text-ink-faint">Team Captain:</span>
              <span className="font-bold text-accent-ink">
                {currentTeam.captain.user?.name || "Unassigned"}
              </span>
            </div>
          )}
        </div>

        {/* CENTER COLUMN: Football Playground (Tactical Pitch) */}
        <div className="flex flex-col items-center">
          <TacticalPitch
            starters={starters}
            captainProfileId={currentTeam?.captainProfileId}
            selectedPlayerId={selectedPitchPlayerId}
            onSelectPlayer={handlePitchPlayerClick}
            canManage={canManage}
          />
          {canManage && (
            <p className="mt-2.5 text-center text-[11px] text-ink-faint">
              💡 Tip: Click any starter on the pitch, then click a bench player on the right to substitute.
            </p>
          )}
        </div>

        {/* RIGHT COLUMN: Substitutes (Bench) */}
        <div className="space-y-3 rounded-2xl border border-surface-line bg-surface/50 p-4">
          <div className="flex items-center justify-between border-b border-surface-line pb-3">
            <div className="flex items-center gap-1.5">
              <h4 className="font-display text-xs font-black uppercase tracking-wider text-ink">
                Substitutes
              </h4>
              <span className="rounded-full bg-bg-raised px-2 py-0.5 text-[10px] font-bold text-accent-ink">
                {subs.length}/5
              </span>
            </div>
          </div>

          {subs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-surface-line py-10 text-center text-xs text-ink-faint">
              No substitutes assigned to the bench.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-[600px] overflow-y-auto pr-1">
              {subs.map((subPlayer) => (
                <PitchPlayerCard
                  key={subPlayer.id}
                  player={subPlayer}
                  size="bench"
                  isTargetBench={Boolean(selectedPitchPlayerId)}
                  onClick={() => handleBenchPlayerClick(subPlayer)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
