"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { getTeams, createTeam, deleteTeam, type Team } from "@/lib/api/teams";
import { parseApiErrorMessage } from "@/lib/api/client";
import { EmptyState } from "./EmptyState";
import { UsersIcon } from "../icons";

export function ClubTeamsTab({ clubId, canManage }: { clubId: string; canManage: boolean }) {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const data = await getTeams(clubId);
      setTeams(data);
    } catch (err) {
      setError(parseApiErrorMessage(err, "Failed to load teams"));
    }
  };

  useEffect(() => {
    async function run() {
      await load();
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await createTeam(clubId, name.trim());
      setName("");
      await load();
    } catch (err) {
      setError(parseApiErrorMessage(err, "Failed to create team"));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (teamId: string, teamName: string) => {
    if (!window.confirm(`Delete ${teamName}? This cannot be undone.`)) return;
    setError(null);
    try {
      await deleteTeam(clubId, teamId);
      await load();
    } catch (err) {
      setError(parseApiErrorMessage(err, "Failed to delete team"));
    }
  };

  if (teams === null) {
    return (
      <div>
        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        ) : (
          <p className="text-sm text-ink-soft">Loading teams…</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      {teams.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No teams yet"
          body="Create up to 3 squads for this club — e.g. Team A, Team B, Academy."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const starters = team.members.filter((m) => m.lineupStatus === "Starter").length;
            const subs = team.members.filter((m) => m.lineupStatus === "Sub").length;
            return (
              <div key={team.id} className="rounded-xl border border-surface-line bg-surface/50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-ink">{team.name}</h3>
                  {canManage ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(team.id, team.name)}
                      className="shrink-0 text-xs font-semibold text-danger-ink"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
                <p className="mt-1.5 text-xs text-ink-soft">
                  Captain: {team.captain?.user?.name ?? "Unassigned"}
                </p>
                <p className="mt-1 font-mono text-xs text-ink-faint">
                  {starters}/11 starters · {subs}/5 subs · {team.members.length} on roster
                </p>
                <Link
                  href={`/dashboard/efootball/clubs/${clubId}/teams/${team.id}`}
                  className="mt-3 inline-block rounded-full border border-surface-line-strong px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent-ink"
                >
                  Manage team
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {canManage && teams.length < 3 ? (
        <form onSubmit={handleCreate} className="mt-6 flex flex-wrap items-end gap-3">
          <label className="min-w-[220px] flex-1">
            <span className="text-sm font-medium text-ink-soft">New team name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Team A"
              className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <button
            type="submit"
            disabled={creating}
            className="rounded-full bg-accent px-5 py-3 font-display text-sm font-semibold text-bg disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create team"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
