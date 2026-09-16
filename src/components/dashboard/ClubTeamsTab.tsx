"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useTeams, useCreateTeam, useDeleteTeam } from "@/lib/api/hooks/useTeams";
import { isApiError } from "@/lib/api/axios";
import { EmptyState } from "./EmptyState";
import { UsersIcon } from "../icons";

export function ClubTeamsTab({ clubId, canManage }: { clubId: string; canManage: boolean }) {
  const { data: teams, isLoading, isError, error } = useTeams(clubId);
  const createTeam = useCreateTeam(clubId);
  const deleteTeam = useDeleteTeam(clubId);
  const [name, setName] = useState("");

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createTeam.mutate(name.trim(), {
      onSuccess: () => setName(""),
    });
  };

  const handleDelete = (teamId: string, teamName: string) => {
    if (!window.confirm(`Delete ${teamName}? This cannot be undone.`)) return;
    deleteTeam.mutate(teamId);
  };

  const errorMessage = (err: unknown, fallback: string) =>
    isApiError(err) ? err.message : fallback;

  if (isLoading) {
    return <p className="text-sm text-ink-soft">Loading teams…</p>;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {errorMessage(error, "Failed to load teams")}
      </div>
    );
  }

  return (
    <div>
      {createTeam.isError ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {errorMessage(createTeam.error, "Failed to create team")}
        </div>
      ) : null}
      {deleteTeam.isError ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {errorMessage(deleteTeam.error, "Failed to delete team")}
        </div>
      ) : null}

      {!teams || teams.length === 0 ? (
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
                      disabled={deleteTeam.isPending}
                      className="shrink-0 text-xs font-semibold text-danger-ink disabled:opacity-50"
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

      {canManage && teams && teams.length < 3 ? (
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
            disabled={createTeam.isPending}
            className="rounded-full bg-accent px-5 py-3 font-display text-sm font-semibold text-bg disabled:opacity-50"
          >
            {createTeam.isPending ? "Creating..." : "Create team"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
