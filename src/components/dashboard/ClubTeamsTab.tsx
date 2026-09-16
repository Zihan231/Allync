"use client";

import { useMemo, useState, useEffect } from "react";
import { Avatar } from "@/components/common/Avatar";
import { ClubCrest } from "@/components/common/ClubCrest";
import { PlusIcon, SwapIcon, CloseIcon } from "@/components/icons";
import {
  useTeams,
  useTeam,
  useCreateTeam,
  useShiftPosition,
  useSwapPositions,
  useSubstitutePlayer,
  useApplyFormation,
  useAddTeamPlayer,
  useRemoveTeamPlayer,
  useFreeClubPlayers,
} from "@/lib/api/hooks/useTeams";
import { TacticalPitch } from "./TacticalPitch";
import { PitchPlayerCard } from "./PitchPlayerCard";
import { PositionPickerModal } from "./PositionPickerModal";
import { AddPlayerModal } from "./AddPlayerModal";
import type { ClubMemberProfile, Team } from "@/lib/api/teams";

export const FORMATIONS_LIST = [
  { id: "4-4-2", label: "4-4-2", summary: "2 CB, 1 LB, 1 RB, 2 CMF/DMF, 1 LMF, 1 RMF, 2 CF" },
  { id: "4-3-3", label: "4-3-3", summary: "2 CB, 1 LB, 1 RB, 3 CMF/DMF, 1 LWF, 1 RWF, 1 CF" },
  { id: "4-3-2-1", label: "4-3-2-1", summary: "2 CB, 1 LB, 1 RB, 3 CMF/DMF, 2 AMF/SS, 1 CF" },
  { id: "4-3-1-2", label: "4-3-1-2", summary: "2 CB, 1 LB, 1 RB, 3 CMF/DMF, 1 AMF, 2 CF" },
  { id: "4-2-3-1", label: "4-2-3-1", summary: "2 CB, 1 LB, 1 RB, 2 CMF/DMF, 1 LMF, 1 AMF, 1 RMF, 1 CF" },
  { id: "4-2-1-3", label: "4-2-1-3", summary: "2 CB, 1 LB, 1 RB, 2 CMF/DMF, 1 AMF, 1 LWF, 1 RWF, 1 CF" },
  { id: "4-1-4-1", label: "4-1-4-1", summary: "2 CB, 1 LB, 1 RB, 1 DMF, 2 CMF, 1 LMF, 1 RMF, 1 CF" },
  { id: "4-1-2-3", label: "4-1-2-3", summary: "2 CB, 1 LB, 1 RB, 1 DMF, 2 CMF/AMF, 1 LWF, 1 RWF, 1 CF" },
  { id: "3-4-3", label: "3-4-3", summary: "3 CB, 2 CMF/DMF, 1 LMF, 1 RMF, 1 LWF, 1 RWF, 1 CF" },
  { id: "3-2-4-1", label: "3-2-4-1", summary: "3 CB, 2 CMF/DMF, 1 LMF, 2 AMF, 1 RMF, 1 CF" },
  { id: "3-2-3-2", label: "3-2-3-2", summary: "3 CB, 2 CMF/DMF, 1 LMF, 1 AMF, 1 RMF, 2 CF" },
  { id: "3-1-4-2", label: "3-1-4-2", summary: "3 CB, 1 DMF, 2 CMF/AMF, 1 LMF, 1 RMF, 2 CF" },
  { id: "5-3-2", label: "5-3-2", summary: "3 CB, 1 LB, 1 RB, 3 CMF/DMF, 2 CF" },
  { id: "5-2-2-1", label: "5-2-2-1", summary: "3 CB, 1 LB, 1 RB, 2 CMF/DMF, 2 AMF/SS, 1 CF" },
  { id: "5-2-1-2", label: "5-2-1-2", summary: "3 CB, 1 LB, 1 RB, 2 CMF/DMF, 1 AMF, 2 CF" },
];

export interface ClubTeamsTabProps {
  clubId: string;
  canManage?: boolean;
  club?: {
    name: string;
    color?: string;
    initials?: string;
    dpUrl?: string | null;
  };
}

export function ClubTeamsTab({ clubId, canManage = false, club }: ClubTeamsTabProps) {
  const { data: teams = [], isLoading: isTeamsLoading } = useTeams(clubId);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Active Team ID
  const activeTeamId = selectedTeamId ?? teams[0]?.id ?? null;
  const { data: teamDetail, isLoading: isTeamLoading } = useTeam(clubId, activeTeamId ?? "");

  // Mutations
  const createTeam = useCreateTeam(clubId);
  const shiftPositionMutation = useShiftPosition(clubId, activeTeamId ?? "");
  const swapPositionsMutation = useSwapPositions(clubId, activeTeamId ?? "");
  const substituteMutation = useSubstitutePlayer(clubId, activeTeamId ?? "");
  const applyFormationMutation = useApplyFormation(clubId, activeTeamId ?? "");
  const addPlayerMutation = useAddTeamPlayer(clubId, activeTeamId ?? "");
  const removePlayerMutation = useRemoveTeamPlayer(clubId, activeTeamId ?? "");

  // Free Players for this club
  const { data: freePlayers = [] } = useFreeClubPlayers(clubId);

  // Local optimistic state for immediate UI changes
  const [optimisticMembers, setOptimisticMembers] = useState<ClubMemberProfile[]>([]);
  const [selectedFormation, setSelectedFormation] = useState<string>("4-3-3");

  // Sync with teamDetail when loaded
  useEffect(() => {
    if (teamDetail?.members) {
      setOptimisticMembers(teamDetail.members);
    }
    if (teamDetail?.formation) {
      setSelectedFormation(teamDetail.formation);
    }
  }, [teamDetail]);

  // UI States
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedPitchPlayerId, setSelectedPitchPlayerId] = useState<string | null>(null);
  const [positionTargetPlayer, setPositionTargetPlayer] = useState<ClubMemberProfile | null>(null);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const currentTeam: Team | undefined = teamDetail ?? teams.find((t) => t.id === activeTeamId);

  // Categorize optimistic members into Starters & Subs
  const { starters, subs } = useMemo(() => {
    const s: ClubMemberProfile[] = [];
    const b: ClubMemberProfile[] = [];

    optimisticMembers.forEach((m) => {
      if (m.lineupStatus === "Starter") {
        s.push(m);
      } else if (m.lineupStatus === "Sub") {
        b.push(m);
      }
    });

    return { starters: s, subs: b };
  }, [optimisticMembers]);

  const totalSquadCount = starters.length + subs.length;
  const isSquadFull = totalSquadCount >= 16;

  // Collective Strength calculation
  const collectiveStrength = useMemo(() => {
    if (starters.length === 0) return 2850;
    const starterPoints = starters.reduce((acc, p) => acc + (p.points || 900), 0);
    const subPoints = subs.reduce((acc, p) => acc + (p.points || 850), 0) * 0.4;
    return Math.round(starterPoints * 0.28 + subPoints * 0.1);
  }, [starters, subs]);

  // Find manager from optimistic members
  const manager = useMemo(() => {
    const mgr = optimisticMembers.find(
      (m) => m.clubRole?.toLowerCase().includes("manager") || m.user?.name?.toLowerCase().includes("tamim"),
    );
    return {
      name: mgr?.user?.name || "Tamim Iqbal",
      dpUrl: mgr?.user?.dpUrl || null,
    };
  }, [optimisticMembers]);

  // Handle Team Creation
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      const created = await createTeam.mutateAsync(newTeamName.trim());
      setNewTeamName("");
      setIsCreatingTeam(false);
      setSelectedTeamId(created.id);
      setStatusNotice(`Squad ${created.name} created! Add members from the free players pool.`);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create squad");
    }
  };

  // Handle Formation Change (Instant UI & Backend Update)
  const handleFormationChange = async (formation: string) => {
    setSelectedFormation(formation);
    setStatusNotice(`Applying tactical formation ${formation}...`);
    try {
      const updated = await applyFormationMutation.mutateAsync(formation);
      if (updated.members) {
        setOptimisticMembers(updated.members);
      }
      setStatusNotice(`Formation changed to ${formation}!`);
      setTimeout(() => setStatusNotice(null), 3000);
    } catch (err: any) {
      setStatusNotice("Failed to update formation");
      setTimeout(() => setStatusNotice(null), 3000);
    }
  };

  // Handle Pitch Player Click (Swap or Selection)
  const handlePitchPlayerClick = async (player: ClubMemberProfile) => {
    if (!canManage) return;

    // If no player selected, select this one
    if (!selectedPitchPlayerId) {
      setSelectedPitchPlayerId(player.id);
      setStatusNotice(
        `Selected ${player.user?.name || "Player"} (${player.gamePosition}). Click another starter to SWAP, or click a bench player to SUB.`
      );
      return;
    }

    // If clicking the same player, deselect
    if (selectedPitchPlayerId === player.id) {
      setSelectedPitchPlayerId(null);
      setStatusNotice(null);
      return;
    }

    // Clicking a DIFFERENT starter on pitch -> ON-PITCH SWAP!
    const playerA = starters.find((p) => p.id === selectedPitchPlayerId);
    const playerB = player;

    if (!playerA) {
      setSelectedPitchPlayerId(null);
      setStatusNotice(null);
      return;
    }

    // Immediate optimistic swap
    const posA = playerA.gamePosition;
    const posB = playerB.gamePosition;

    setOptimisticMembers((prev) =>
      prev.map((m) => {
        if (m.id === playerA.id) return { ...m, gamePosition: posB };
        if (m.id === playerB.id) return { ...m, gamePosition: posA };
        return m;
      })
    );

    setSelectedPitchPlayerId(null);
    setStatusNotice(`Swapped ${playerA.user?.name || "Player"} and ${playerB.user?.name || "Player"}!`);
    setTimeout(() => setStatusNotice(null), 3000);

    try {
      await swapPositionsMutation.mutateAsync({
        profileId1: playerA.id,
        profileId2: playerB.id,
      });
    } catch (err) {
      // Revert on error
      if (teamDetail?.members) setOptimisticMembers(teamDetail.members);
      setStatusNotice("Swap failed, reverted position");
    }
  };

  // Handle Bench Player Click (Substitution)
  const handleBenchPlayerClick = async (benchPlayer: ClubMemberProfile) => {
    if (!canManage || !selectedPitchPlayerId) return;

    const outPlayer = starters.find((p) => p.id === selectedPitchPlayerId);
    if (!outPlayer) return;

    const pitchPos = outPlayer.gamePosition;

    // Immediate optimistic sub: bench player gets pitch position, starter moves to bench positionless
    setOptimisticMembers((prev) =>
      prev.map((m) => {
        if (m.id === benchPlayer.id) {
          return { ...m, lineupStatus: "Starter", gamePosition: pitchPos };
        }
        if (m.id === outPlayer.id) {
          return { ...m, lineupStatus: "Sub", gamePosition: null };
        }
        return m;
      })
    );

    const outName = outPlayer.user?.name || "Player";
    const inName = benchPlayer.user?.name || "Player";
    setSelectedPitchPlayerId(null);
    setStatusNotice(`Substituted ${inName} IN for ${outName} (${pitchPos})!`);
    setTimeout(() => setStatusNotice(null), 3500);

    try {
      await substituteMutation.mutateAsync({
        outProfileId: outPlayer.id,
        inProfileId: benchPlayer.id,
      });
    } catch (err) {
      if (teamDetail?.members) setOptimisticMembers(teamDetail.members);
      setStatusNotice("Substitution failed, reverted");
    }
  };

  // Handle Position Shifting (CF to SS, etc.)
  const handlePositionSelected = async (newPos: string) => {
    if (!positionTargetPlayer) return;

    const targetId = positionTargetPlayer.id;
    const oldPos = positionTargetPlayer.gamePosition;

    // Immediate optimistic update
    setOptimisticMembers((prev) =>
      prev.map((m) => (m.id === targetId ? { ...m, gamePosition: newPos } : m))
    );

    setPositionTargetPlayer(null);
    setStatusNotice(`Position changed from ${oldPos} to ${newPos}!`);
    setTimeout(() => setStatusNotice(null), 3000);

    try {
      await shiftPositionMutation.mutateAsync({
        profileId: targetId,
        gamePosition: newPos,
      });
    } catch (err: any) {
      if (teamDetail?.members) setOptimisticMembers(teamDetail.members);
      setStatusNotice("Position change failed");
    }
  };

  // Handle Adding Free Player to Squad
  const handleAddPlayer = async (player: ClubMemberProfile) => {
    if (isSquadFull) {
      alert("Squad is full (16/16). Remove a substitute before adding another player.");
      return;
    }

    // Optimistic addition to subs
    const newMember: ClubMemberProfile = {
      ...player,
      lineupStatus: "Sub",
      gamePosition: null,
    };
    setOptimisticMembers((prev) => [...prev, newMember]);
    setIsAddPlayerOpen(false);
    setStatusNotice(`Added ${player.user?.name || "Player"} to the bench!`);
    setTimeout(() => setStatusNotice(null), 3000);

    try {
      await addPlayerMutation.mutateAsync({
        profileId: player.id,
        lineupStatus: "Sub",
        gamePosition: null,
      });
    } catch (err: any) {
      if (teamDetail?.members) setOptimisticMembers(teamDetail.members);
      setStatusNotice(err.response?.data?.message || "Failed to add player");
    }
  };

  // Handle Removing Player from Squad
  const handleRemovePlayer = async (player: ClubMemberProfile) => {
    if (!canManage) return;
    if (totalSquadCount <= 11) {
      alert("A team must have at least 11 players. Cannot remove starters.");
      return;
    }

    const confirmRemove = confirm(
      `Remove ${player.user?.name || "this player"} from the squad? They will become a free club member.`
    );
    if (!confirmRemove) return;

    // Optimistic removal
    setOptimisticMembers((prev) => prev.filter((m) => m.id !== player.id));
    setStatusNotice(`Removed ${player.user?.name || "Player"} from squad.`);
    setTimeout(() => setStatusNotice(null), 3000);

    try {
      await removePlayerMutation.mutateAsync(player.id);
    } catch (err: any) {
      if (teamDetail?.members) setOptimisticMembers(teamDetail.members);
      setStatusNotice("Failed to remove player");
    }
  };

  if (isTeamsLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-faint">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header: Team Switcher & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-line pb-4">
        {/* Team Tabs (Team A, Team B, Team C) */}
        <div className="flex flex-wrap items-center gap-2">
          {teams.map((t) => {
            const isSelected = t.id === activeTeamId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedTeamId(t.id);
                  setSelectedPitchPlayerId(null);
                }}
                className={`rounded-xl px-4 py-2 font-display text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-accent text-bg shadow-[0_0_20px_rgba(217,165,68,0.4)]"
                    : "border border-surface-line bg-surface/50 text-ink-soft hover:border-surface-line-strong hover:text-ink"
                }`}
              >
                {t.name}
              </button>
            );
          })}

          {canManage && teams.length < 3 && !isCreatingTeam && (
            <button
              type="button"
              onClick={() => setIsCreatingTeam(true)}
              className="flex items-center gap-1.5 rounded-xl border border-dashed border-surface-line px-3 py-2 text-xs font-bold text-ink-faint hover:border-accent hover:text-accent-ink transition-colors"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>New Team</span>
            </button>
          )}
        </div>

        {/* Formation Selector & Roster Badge */}
        <div className="flex items-center gap-3">
          {/* Formation Dropdown */}
          <div className="flex items-center gap-2 rounded-xl border border-surface-line bg-surface/60 px-3 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
              Formation:
            </span>
            <select
              value={selectedFormation}
              disabled={!canManage || applyFormationMutation.isPending}
              onChange={(e) => handleFormationChange(e.target.value)}
              className="bg-transparent font-display text-xs font-black text-accent-ink focus:outline-none cursor-pointer"
            >
              {FORMATIONS_LIST.map((f) => (
                <option key={f.id} value={f.id} className="bg-bg-raised text-ink">
                  {f.label} ({f.summary})
                </option>
              ))}
            </select>
          </div>

          {/* Squad Count Badge */}
          <span
            className={`rounded-xl px-3 py-1.5 font-display text-xs font-bold border ${
              isSquadFull
                ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
            }`}
          >
            {totalSquadCount}/16 Squad
          </span>
        </div>
      </div>

      {/* New Team Creation Form */}
      {isCreatingTeam && (
        <form
          onSubmit={handleCreateTeam}
          className="flex items-center gap-2 rounded-2xl border border-accent/40 bg-accent/5 p-3"
        >
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Squad Name (e.g. Team B)"
            className="rounded-lg border border-surface-line bg-bg px-3 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
            autoFocus
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

      {/* Real-time Status / Instruction Banner */}
      {statusNotice && (
        <div className="flex items-center justify-between rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5 text-xs font-medium text-accent-ink animate-fadeIn">
          <div className="flex items-center gap-2">
            <SwapIcon className="h-4 w-4 shrink-0 text-accent" />
            <span>{statusNotice}</span>
          </div>
          {selectedPitchPlayerId && (
            <button
              type="button"
              onClick={() => {
                setSelectedPitchPlayerId(null);
                setStatusNotice(null);
              }}
              className="rounded-full bg-black/40 px-2.5 py-1 text-[10px] uppercase font-bold text-ink hover:text-danger-ink"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* MAIN GAMEPLAN / SQUAD FORMATION LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr_260px] gap-5 items-start">
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
                <p className="text-[9px] text-ink-faint">Tactical Gameplan</p>
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
                <span className="font-display text-xs font-black text-accent-ink whitespace-nowrap">
                  {selectedFormation}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center pl-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-ink-faint">Starters</span>
                <span className="font-display text-xs font-black text-emerald-400 whitespace-nowrap">
                  {starters.length}/11 Active
                </span>
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
        <div className="flex flex-col items-center w-full">
          <TacticalPitch
            starters={starters}
            captainProfileId={currentTeam?.captainProfileId}
            selectedPlayerId={selectedPitchPlayerId}
            onSelectPlayer={handlePitchPlayerClick}
            onChangePosition={(player) => setPositionTargetPlayer(player)}
            canManage={canManage}
          />
          {canManage && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-[11px] text-ink-faint">
              <span>🔄 <b>Click starter</b> to select, then click another starter to <b>SWAP</b></span>
              <span>⚡ <b>Click starter</b>, then click bench player to <b>SUB</b></span>
              <span>⚙️ <b>Click gear</b> on player card to change compatible position</span>
            </div>
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

            {canManage && (
              <button
                type="button"
                disabled={isSquadFull}
                onClick={() => setIsAddPlayerOpen(true)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                  isSquadFull
                    ? "bg-surface text-ink-faint/50 cursor-not-allowed"
                    : "bg-accent text-bg hover:brightness-110"
                }`}
                title={isSquadFull ? "Squad full (16/16)" : "Add free member"}
              >
                <PlusIcon className="h-3 w-3" />
                <span>{isSquadFull ? "Full" : "Add"}</span>
              </button>
            )}
          </div>

          {subs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-surface-line py-10 text-center text-xs text-ink-faint">
              No substitutes on the bench.
              {canManage && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddPlayerOpen(true)}
                    className="text-accent-ink underline font-bold"
                  >
                    + Add from free members
                  </button>
                </div>
              )}
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
                  onRemove={() => handleRemovePlayer(subPlayer)}
                  canManage={canManage}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Position Picker Modal (Strict Compatibility) */}
      <PositionPickerModal
        open={Boolean(positionTargetPlayer)}
        player={positionTargetPlayer}
        onClose={() => setPositionTargetPlayer(null)}
        onSelectPosition={handlePositionSelected}
        isPending={shiftPositionMutation.isPending}
      />

      {/* Add Free Player Modal (Free Club Members Only) */}
      <AddPlayerModal
        open={isAddPlayerOpen}
        onClose={() => setIsAddPlayerOpen(false)}
        freePlayers={freePlayers}
        onAddPlayer={handleAddPlayer}
        isPending={addPlayerMutation.isPending}
        currentCount={totalSquadCount}
      />
    </div>
  );
}
