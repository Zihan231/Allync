"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session/SessionContext";
import { isApiError } from "@/lib/api/axios";
import {
  useTeam,
  useClubMembers,
  useUpdateTeam,
  useDeleteTeam,
  useSetLineup,
  useSubstitutePlayer,
} from "@/lib/api/hooks/useTeams";
import type { BackendLineupStatus, LineupPlayerInput, ClubMemberProfile, Team } from "@/lib/api/teams";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AppLoader } from "@/components/common/AppLoader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LockIcon } from "@/components/icons";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useConfirm } from "@/lib/useConfirm";

type PendingEntry = { lineupStatus: BackendLineupStatus; gamePosition: string };

function errorMessage(err: unknown, fallback: string) {
  return isApiError(err) ? err.message : fallback;
}

export default function TeamManagePage({
  params,
}: {
  params: Promise<{ clubId: string; teamId: string }>;
}) {
  const { clubId, teamId } = use(params);
  const { user } = useSession();
  const router = useRouter();

  const canManage = user.club?.id === clubId && (user.club?.role === "President" || user.club?.role === "Manager");

  const teamQuery = useTeam(clubId, teamId);
  const membersQuery = useClubMembers(clubId);
  const updateTeam = useUpdateTeam(clubId, teamId);
  const deleteTeam = useDeleteTeam(clubId);
  const setLineup = useSetLineup(clubId, teamId);
  const substitutePlayer = useSubstitutePlayer(clubId, teamId);

  const team = teamQuery.data;
  const roster = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);

  const [name, setName] = useState("");
  const [captainId, setCaptainId] = useState<string>("");
  const [pending, setPending] = useState<Record<string, PendingEntry>>({});
  const [addProfileId, setAddProfileId] = useState("");
  const [subOutId, setSubOutId] = useState("");
  const [subInId, setSubInId] = useState("");
  const { confirm, confirmProps } = useConfirm();

  // Re-sync local editing drafts whenever fresh server data arrives (initial
  // load, or after a mutation invalidates and refetches this team). Done
  // during render (comparing against the last-synced object) rather than in
  // an effect, per React's own guidance for resetting state from a changed
  // prop — it avoids an extra render pass.
  const [syncedTeam, setSyncedTeam] = useState<Team | null>(null);
  if (team && team !== syncedTeam) {
    setSyncedTeam(team);
    setName(team.name);
    setCaptainId(team.captainProfileId ?? "");
    const nextPending: Record<string, PendingEntry> = {};
    for (const m of team.members) {
      nextPending[m.id] = {
        lineupStatus: m.lineupStatus,
        gamePosition: m.gamePosition ?? "",
      };
    }
    setPending(nextPending);
  }

  const rosterById = useMemo(() => {
    const map = new Map<string, ClubMemberProfile>();
    for (const m of roster) map.set(m.id, m);
    return map;
  }, [roster]);

  const availableToAdd = useMemo(
    () => roster.filter((m) => !(m.id in pending)),
    [roster, pending],
  );

  const starterCount = Object.values(pending).filter((p) => p.lineupStatus === "Starter").length;
  const subCount = Object.values(pending).filter((p) => p.lineupStatus === "Sub").length;

  if (!canManage) {
    return <EmptyState icon={LockIcon} title="You can't manage this team" body="" />;
  }

  if (teamQuery.isLoading || membersQuery.isLoading) {
    return <AppLoader />;
  }

  if (!team) {
    return (
      <div>
        {teamQuery.isError ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {errorMessage(teamQuery.error, "Failed to load team")}
          </div>
        ) : null}
        <EmptyState icon={LockIcon} title="Team not found" body="" />
      </div>
    );
  }

  const handleSaveName = () => {
    if (!name.trim() || name.trim() === team.name) return;
    updateTeam.mutate({ name: name.trim() });
  };

  const handleSaveCaptain = (nextId: string) => {
    setCaptainId(nextId);
    updateTeam.mutate({ captainProfileId: nextId || null });
  };

  const handleDeleteTeam = async () => {
    if (!await confirm(`Delete ${team.name}? This cannot be undone.`, { title: "Delete Squad", variant: "danger", confirmLabel: "Delete Forever" })) return;
    deleteTeam.mutate(teamId, {
      onSuccess: () => router.push(`/dashboard/efootball/clubs/${clubId}`),
    });
  };

  const updatePendingEntry = (profileId: string, patch: Partial<PendingEntry>) => {
    setPending((prev) => ({
      ...prev,
      [profileId]: { ...prev[profileId], ...patch },
    }));
  };

  const removeFromLineup = (profileId: string) => {
    updatePendingEntry(profileId, { lineupStatus: "None" });
  };

  const handleAddPlayer = () => {
    if (!addProfileId) return;
    setPending((prev) => ({
      ...prev,
      [addProfileId]: { lineupStatus: "Sub", gamePosition: "" },
    }));
    setAddProfileId("");
  };

  const handleSaveLineup = () => {
    const players: LineupPlayerInput[] = Object.entries(pending).map(([profileId, entry]) => ({
      profileId,
      lineupStatus: entry.lineupStatus,
      gamePosition: entry.gamePosition || undefined,
    }));
    setLineup.mutate(players);
  };

  const handleSubstitute = () => {
    if (!subOutId || !subInId) return;
    substitutePlayer.mutate(
      { outProfileId: subOutId, inProfileId: subInId },
      {
        onSuccess: () => {
          setSubOutId("");
          setSubInId("");
        },
      },
    );
  };

  const currentStarters = team.members.filter((m) => m.lineupStatus === "Starter");
  const currentSubs = team.members.filter((m) => m.lineupStatus === "Sub");

  const pageError =
    (updateTeam.isError && errorMessage(updateTeam.error, "Failed to save team")) ||
    (deleteTeam.isError && errorMessage(deleteTeam.error, "Failed to delete team")) ||
    (setLineup.isError && errorMessage(setLineup.error, "Failed to save lineup")) ||
    (substitutePlayer.isError && errorMessage(substitutePlayer.error, "Failed to substitute player"));

  return (
    <div>
      <PageHeader
        eyebrow="Team"
        title={team.name}
        backHref={`/dashboard/efootball/clubs/${clubId}`}
      />

      {pageError ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {pageError}
        </div>
      ) : null}

      {/* Name + Captain */}
      <div className="mt-8 rounded-xl border border-surface-line bg-surface/50 p-6">
        <h2 className="font-display text-lg font-bold text-ink">Team settings</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Team name</span>
            <div className="mt-1.5 flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={updateTeam.isPending || !name.trim() || name.trim() === team.name}
                className="shrink-0 rounded-lg border border-surface-line-strong px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40"
              >
                {updateTeam.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Captain</span>
            <select
              value={captainId}
              onChange={(e) => handleSaveCaptain(e.target.value)}
              disabled={updateTeam.isPending}
              className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="">Unassigned</option>
              {roster.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.user?.name ?? m.id}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 border-t border-surface-line pt-6">
          <h3 className="text-sm font-semibold text-ink">Danger zone</h3>
          <p className="mt-1 text-xs text-ink-soft">Deleting this team is permanent.</p>
          <button
            type="button"
            onClick={handleDeleteTeam}
            disabled={deleteTeam.isPending}
            className="mt-3 rounded-full bg-danger-soft px-4 py-2 text-sm font-semibold text-danger-ink disabled:opacity-50"
          >
            {deleteTeam.isPending ? "Deleting..." : "Delete team"}
          </button>
        </div>
      </div>

      {/* Lineup editor */}
      <div className="mt-6 rounded-xl border border-surface-line bg-surface/50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-ink">Lineup</h2>
          <span className="font-mono text-xs text-ink-faint">
            {starterCount}/11 starters · {subCount}/5 subs
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {Object.entries(pending).length === 0 ? (
            <p className="text-sm text-ink-soft">No players assigned to this team yet.</p>
          ) : (
            Object.entries(pending).map(([profileId, entry]) => {
              const profile = rosterById.get(profileId);
              return (
                <div
                  key={profileId}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-surface-line bg-surface px-4 py-3"
                >
                  <span className="min-w-[140px] flex-1 text-sm font-medium text-ink">
                    {profile?.user?.name ?? profileId}
                  </span>
                  <select
                    value={entry.lineupStatus}
                    onChange={(e) =>
                      updatePendingEntry(profileId, { lineupStatus: e.target.value as BackendLineupStatus })
                    }
                    className="rounded-lg border border-surface-line-strong bg-surface px-3 py-2 text-xs text-ink"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Sub">Sub</option>
                    <option value="None">None</option>
                  </select>
                  <input
                    value={entry.gamePosition}
                    onChange={(e) => updatePendingEntry(profileId, { gamePosition: e.target.value })}
                    disabled={entry.lineupStatus !== "Starter"}
                    placeholder="Position (e.g. CF)"
                    className="w-36 rounded-lg border border-surface-line-strong bg-surface px-3 py-2 text-xs text-ink disabled:opacity-40"
                  />
                  <button
                    type="button"
                    onClick={() => removeFromLineup(profileId)}
                    className="shrink-0 text-xs font-semibold text-danger-ink"
                  >
                    Remove
                  </button>
                </div>
              );
            })
          )}
        </div>

        {availableToAdd.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-surface-line pt-4">
            <label className="min-w-[220px] flex-1">
              <span className="text-sm font-medium text-ink-soft">Add player from club roster</span>
              <select
                value={addProfileId}
                onChange={(e) => setAddProfileId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                <option value="">Select a player…</option>
                {availableToAdd.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.user?.name ?? m.id}
                    {m.teamId && m.teamId !== teamId ? " (on another team)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={handleAddPlayer}
              disabled={!addProfileId}
              className="rounded-full border border-surface-line-strong px-5 py-3 text-sm font-semibold text-ink disabled:opacity-40"
            >
              Add
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSaveLineup}
          disabled={setLineup.isPending}
          className="mt-6 rounded-full bg-accent px-6 py-3 font-display text-sm font-semibold text-bg disabled:opacity-50"
        >
          {setLineup.isPending ? "Saving..." : "Save lineup"}
        </button>
      </div>

      {/* Substitution */}
      <div className="mt-6 rounded-xl border border-surface-line bg-surface/50 p-6">
        <h2 className="font-display text-lg font-bold text-ink">Make a substitution</h2>
        <p className="mt-1 text-xs text-ink-soft">
          Swaps a starter off for a substitute; the incoming player takes over their position.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Out (starter)</span>
            <select
              value={subOutId}
              onChange={(e) => setSubOutId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="">Select…</option>
              {currentStarters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.user?.name ?? m.id} ({m.gamePosition ?? "—"})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">In (substitute)</span>
            <select
              value={subInId}
              onChange={(e) => setSubInId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="">Select…</option>
              {currentSubs.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.user?.name ?? m.id}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={handleSubstitute}
          disabled={substitutePlayer.isPending || !subOutId || !subInId}
          className="mt-4 rounded-full border border-surface-line-strong px-5 py-3 text-sm font-semibold text-ink disabled:opacity-40"
        >
          {substitutePlayer.isPending ? "Substituting..." : "Substitute"}
        </button>
      </div>
      <ConfirmDialog {...confirmProps} />

    </div>
  );
}
