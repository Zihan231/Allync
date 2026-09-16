"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session/SessionContext";
import { parseApiErrorMessage } from "@/lib/api/client";
import {
  getTeam,
  getClubMembers,
  updateTeam,
  deleteTeam,
  setLineup,
  substitutePlayer,
  type Team,
  type ClubMemberProfile,
  type BackendLineupStatus,
  type LineupPlayerInput,
} from "@/lib/api/teams";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AppLoader } from "@/components/common/AppLoader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LockIcon } from "@/components/icons";

type PendingEntry = { lineupStatus: BackendLineupStatus; gamePosition: string };

export default function TeamManagePage({
  params,
}: {
  params: Promise<{ clubId: string; teamId: string }>;
}) {
  const { clubId, teamId } = use(params);
  const { user } = useSession();
  const router = useRouter();

  const canManage = user.club?.id === clubId && (user.club?.role === "President" || user.club?.role === "Manager");

  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<ClubMemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [captainId, setCaptainId] = useState<string>("");
  const [savingCaptain, setSavingCaptain] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [pending, setPending] = useState<Record<string, PendingEntry>>({});
  const [addProfileId, setAddProfileId] = useState("");
  const [savingLineup, setSavingLineup] = useState(false);

  const [subOutId, setSubOutId] = useState("");
  const [subInId, setSubInId] = useState("");
  const [substituting, setSubstituting] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const [teamData, members] = await Promise.all([
        getTeam(clubId, teamId),
        getClubMembers(clubId),
      ]);
      setTeam(teamData);
      setRoster(members);
      setName(teamData.name);
      setCaptainId(teamData.captainProfileId ?? "");
      const nextPending: Record<string, PendingEntry> = {};
      for (const m of teamData.members) {
        nextPending[m.id] = {
          lineupStatus: m.lineupStatus,
          gamePosition: m.gamePosition ?? "",
        };
      }
      setPending(nextPending);
    } catch (err) {
      setError(parseApiErrorMessage(err, "Failed to load team"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function run() {
      await load();
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, teamId]);

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

  if (loading) {
    return <AppLoader />;
  }

  if (!team) {
    return (
      <div>
        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        ) : null}
        <EmptyState icon={LockIcon} title="Team not found" body="" />
      </div>
    );
  }

  const handleSaveName = async () => {
    if (!name.trim() || name.trim() === team.name) return;
    setSavingName(true);
    setError(null);
    try {
      await updateTeam(clubId, teamId, { name: name.trim() });
      await load();
    } catch (err) {
      setError(parseApiErrorMessage(err, "Failed to rename team"));
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveCaptain = async (nextId: string) => {
    setCaptainId(nextId);
    setSavingCaptain(true);
    setError(null);
    try {
      await updateTeam(clubId, teamId, { captainProfileId: nextId || null });
      await load();
    } catch (err) {
      setError(parseApiErrorMessage(err, "Failed to set captain"));
    } finally {
      setSavingCaptain(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!window.confirm(`Delete ${team.name}? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteTeam(clubId, teamId);
      router.push(`/dashboard/efootball/clubs/${clubId}`);
    } catch (err) {
      setError(parseApiErrorMessage(err, "Failed to delete team"));
      setDeleting(false);
    }
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

  const handleSaveLineup = async () => {
    setSavingLineup(true);
    setError(null);
    try {
      const players: LineupPlayerInput[] = Object.entries(pending).map(([profileId, entry]) => ({
        profileId,
        lineupStatus: entry.lineupStatus,
        gamePosition: entry.gamePosition || undefined,
      }));
      await setLineup(clubId, teamId, players);
      await load();
    } catch (err) {
      setError(parseApiErrorMessage(err, "Failed to save lineup"));
    } finally {
      setSavingLineup(false);
    }
  };

  const handleSubstitute = async () => {
    if (!subOutId || !subInId) return;
    setSubstituting(true);
    setError(null);
    try {
      await substitutePlayer(clubId, teamId, subOutId, subInId);
      setSubOutId("");
      setSubInId("");
      await load();
    } catch (err) {
      setError(parseApiErrorMessage(err, "Failed to substitute player"));
    } finally {
      setSubstituting(false);
    }
  };

  const currentStarters = team.members.filter((m) => m.lineupStatus === "Starter");
  const currentSubs = team.members.filter((m) => m.lineupStatus === "Sub");

  return (
    <div>
      <PageHeader
        eyebrow="Team"
        title={team.name}
        backHref={`/dashboard/efootball/clubs/${clubId}`}
      />

      {error ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
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
                disabled={savingName || !name.trim() || name.trim() === team.name}
                className="shrink-0 rounded-lg border border-surface-line-strong px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40"
              >
                {savingName ? "Saving..." : "Save"}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Captain</span>
            <select
              value={captainId}
              onChange={(e) => handleSaveCaptain(e.target.value)}
              disabled={savingCaptain}
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
            disabled={deleting}
            className="mt-3 rounded-full bg-danger-soft px-4 py-2 text-sm font-semibold text-danger-ink disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete team"}
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
          disabled={savingLineup}
          className="mt-6 rounded-full bg-accent px-6 py-3 font-display text-sm font-semibold text-bg disabled:opacity-50"
        >
          {savingLineup ? "Saving..." : "Save lineup"}
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
          disabled={substituting || !subOutId || !subInId}
          className="mt-4 rounded-full border border-surface-line-strong px-5 py-3 text-sm font-semibold text-ink disabled:opacity-40"
        >
          {substituting ? "Substituting..." : "Substitute"}
        </button>
      </div>
    </div>
  );
}
