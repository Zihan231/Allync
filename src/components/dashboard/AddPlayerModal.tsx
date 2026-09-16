"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/common/Avatar";
import { CloseIcon, SearchIcon } from "@/components/icons";
import { calculateRating, getPositionColor } from "./PitchPlayerCard";
import type { ClubMemberProfile } from "@/lib/api/teams";

export interface AddPlayerModalProps {
  open: boolean;
  onClose: () => void;
  freePlayers: ClubMemberProfile[];
  onAddPlayer: (player: ClubMemberProfile) => void;
  isPending?: boolean;
  currentCount: number;
}

export function AddPlayerModal({
  open,
  onClose,
  freePlayers,
  onAddPlayer,
  isPending = false,
  currentCount,
}: AddPlayerModalProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, isPending]);

  if (!open) return null;

  const filtered = freePlayers.filter((p) => {
    const name = (p.user?.name || "").toLowerCase();
    const role = (p.clubRole || "").toLowerCase();
    const q = query.toLowerCase();
    return name.includes(q) || role.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-[8vh] backdrop-blur-md sm:items-center sm:pt-4">
      <button
        type="button"
        aria-label="Close"
        disabled={isPending}
        onClick={onClose}
        className="fixed inset-0 cursor-default"
        tabIndex={-1}
      />

      <div className="relative w-full max-w-xl rounded-2xl border border-surface-line bg-bg-raised shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-line px-5 py-4 bg-surface/30">
          <div>
            <h3 className="font-display text-base font-bold text-ink">
              Add Free Member to Squad
            </h3>
            <p className="text-xs text-ink-faint">
              Only free club members are shown. Squad limit:{" "}
              <span className="font-bold text-accent-ink">{currentCount}/16</span>
            </p>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-surface-line/60 hover:text-ink disabled:opacity-40"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-surface-line px-5 py-3 bg-surface/15">
          <div className="relative flex items-center">
            <SearchIcon className="absolute left-3 h-4 w-4 text-ink-faint" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by player name..."
              className="w-full rounded-xl border border-surface-line bg-bg pl-9 pr-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Player List */}
        <div className="max-h-[55vh] space-y-2 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-ink-faint">
              {query ? "No free members match your search." : "No free club members available."}
            </div>
          ) : (
            filtered.map((player) => {
              const name = player.user?.name || "Player";
              const rating = calculateRating(player.points);
              const pos = player.gamePosition || "FREE";
              const colors = getPositionColor(pos);

              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-xl border border-surface-line bg-surface/40 p-3 hover:border-surface-line-strong hover:bg-surface/70 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar dpUrl={player.user?.dpUrl} name={name} size="sm" mode="static" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-display text-xs font-bold text-ink">
                          {name}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 font-display text-[9px] font-black uppercase ${colors.bg} ${colors.text}`}
                        >
                          {pos}
                        </span>
                      </div>
                      <p className="text-[10px] text-ink-faint">
                        Rating: <span className="font-bold text-accent-ink">{rating}</span> • Points: {player.points}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isPending || currentCount >= 16}
                    onClick={() => onAddPlayer(player)}
                    className="shrink-0 rounded-lg bg-accent px-3 py-1.5 font-display text-xs font-bold text-bg hover:brightness-110 disabled:opacity-40 transition-all"
                  >
                    + Add to Bench
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-surface-line bg-surface/30 px-5 py-3 text-xs text-ink-faint">
          <span>Players in other teams are not eligible and never displayed here.</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-surface-line-strong px-4 py-1.5 font-display text-xs font-semibold text-ink-soft hover:text-ink"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
