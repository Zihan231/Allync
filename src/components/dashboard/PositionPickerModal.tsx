"use client";

import { useEffect, useMemo } from "react";
import { Avatar } from "@/components/common/Avatar";
import { CloseIcon } from "@/components/icons";
import { getPositionColor } from "./PitchPlayerCard";
import type { ClubMemberProfile } from "@/lib/api/teams";

export interface PositionOption {
  code: string;
  name: string;
  category: "FW" | "MF" | "DF" | "GK";
  description: string;
}

export const EFOOTBALL_POSITIONS: PositionOption[] = [
  // Forwards (FW)
  { code: "CF", name: "Centre-Forward", category: "FW", description: "Main Striker" },
  { code: "SS", name: "Second Striker", category: "FW", description: "Shadow Striker" },
  { code: "LWF", name: "Left Wing-Forward", category: "FW", description: "Left Winger" },
  { code: "RWF", name: "Right Wing-Forward", category: "FW", description: "Right Winger" },

  // Midfielders (MF)
  { code: "AMF", name: "Attacking Midfielder", category: "MF", description: "Central Playmaker" },
  { code: "LMF", name: "Left Midfielder", category: "MF", description: "Left Wide Midfield" },
  { code: "RMF", name: "Right Midfielder", category: "MF", description: "Right Wide Midfield" },
  { code: "CMF", name: "Central Midfielder", category: "MF", description: "Box-to-Box Midfielder" },
  { code: "DMF", name: "Defensive Midfielder", category: "MF", description: "Anchor / Ball Winner" },

  // Defenders (DF)
  { code: "CB", name: "Centre-Back", category: "DF", description: "Central Defender" },
  { code: "LB", name: "Left-Back", category: "DF", description: "Left Full-Back" },
  { code: "RB", name: "Right-Back", category: "DF", description: "Right Full-Back" },

  // Goalkeeper (GK)
  { code: "GK", name: "Goalkeeper", category: "GK", description: "Goalkeeper" },
];

export const COMPATIBLE_POSITIONS: Record<string, string[]> = {
  GK: ["GK"],
  CB: ["CB", "LB", "RB", "DMF"],
  LB: ["LB", "CB", "LMF", "LWF"],
  RB: ["RB", "CB", "RMF", "RWF"],
  DMF: ["DMF", "CMF", "CB"],
  CMF: ["CMF", "DMF", "AMF", "LMF", "RMF"],
  LMF: ["LMF", "LB", "LWF", "CMF"],
  RMF: ["RMF", "RB", "RWF", "CMF"],
  AMF: ["AMF", "CMF", "SS", "LWF", "RWF"],
  LWF: ["LWF", "LMF", "SS", "CF"],
  RWF: ["RWF", "RMF", "SS", "CF"],
  SS: ["SS", "CF", "AMF", "LWF", "RWF"],
  CF: ["CF", "SS", "LWF", "RWF"],
};

export interface PositionPickerModalProps {
  open: boolean;
  player: ClubMemberProfile | null;
  onClose: () => void;
  onSelectPosition: (newPos: string) => void;
  isPending?: boolean;
}

export function PositionPickerModal({
  open,
  player,
  onClose,
  onSelectPosition,
  isPending = false,
}: PositionPickerModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, isPending]);

  const currentPos = (player?.gamePosition || "").toUpperCase();
  const playerName = player?.user?.name || "Player";

  const allowedPositions = useMemo(() => {
    if (!currentPos) return Object.keys(COMPATIBLE_POSITIONS);
    return COMPATIBLE_POSITIONS[currentPos] || [currentPos];
  }, [currentPos]);

  if (!open || !player) return null;

  const categories: Array<{ key: "FW" | "MF" | "DF" | "GK"; label: string; badge: string }> = [
    { key: "FW", label: "Forwards", badge: "bg-rose-600 text-white" },
    { key: "MF", label: "Midfielders", badge: "bg-emerald-600 text-white" },
    { key: "DF", label: "Defenders", badge: "bg-sky-600 text-white" },
    { key: "GK", label: "Goalkeeper", badge: "bg-amber-500 text-slate-950" },
  ];

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

      <div className="relative w-full max-w-lg rounded-2xl border border-surface-line bg-bg-raised shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-line px-5 py-4 bg-surface/30">
          <div className="flex items-center gap-3">
            <Avatar dpUrl={player.user?.dpUrl} name={playerName} size="sm" mode="static" />
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                Change Position for {playerName}
              </h3>
              <p className="text-xs text-ink-faint">
                Current: <span className="font-bold text-accent-ink">{currentPos || "Unassigned"}</span>
                <span className="mx-1.5">•</span>
                <span className="text-emerald-400 font-semibold">{allowedPositions.length} Compatible Positions</span>
              </p>
            </div>
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

        {/* 13 Positions Categorized */}
        <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5">
          {categories.map((cat) => {
            const positionsInCat = EFOOTBALL_POSITIONS.filter((p) => p.category === cat.key);
            return (
              <div key={cat.key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 font-display text-[10px] font-black uppercase tracking-wider ${cat.badge}`}
                  >
                    {cat.key}
                  </span>
                  <span className="font-display text-xs font-bold text-ink-soft">
                    {cat.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {positionsInCat.map((opt) => {
                    const isSelected = currentPos === opt.code;
                    const isCompatible = allowedPositions.includes(opt.code);
                    const colors = getPositionColor(opt.code);

                    return (
                      <button
                        key={opt.code}
                        type="button"
                        disabled={isPending || !isCompatible}
                        onClick={() => isCompatible && onSelectPosition(opt.code)}
                        className={`group flex items-center justify-between rounded-xl border p-2.5 text-left transition-all ${
                          !isCompatible
                            ? "opacity-35 cursor-not-allowed border-surface-line/40 bg-surface/10 grayscale"
                            : isSelected
                            ? "border-accent bg-accent/20 ring-2 ring-accent/60 shadow-[0_0_15px_rgba(217,165,68,0.3)]"
                            : "border-surface-line bg-surface/40 hover:border-accent hover:bg-surface/80 hover:scale-[1.01]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`flex h-7 w-9 items-center justify-center rounded-md font-display text-xs font-black uppercase shadow-sm ${colors.bg} ${colors.text}`}
                          >
                            {opt.code}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-display text-xs font-bold text-ink group-hover:text-accent-ink">
                              {opt.name}
                            </div>
                            <div className="text-[10px] text-ink-faint">
                              {isCompatible ? opt.description : "Incompatible"}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-black uppercase text-bg shrink-0">
                            Active
                          </span>
                        )}
                        {!isCompatible && (
                          <span className="text-[10px] text-ink-faint/60 shrink-0">
                            🔒
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-surface-line bg-surface/30 px-5 py-3 text-xs text-ink-faint">
          <span>Incompatible positions (e.g. CF → GK) are locked to maintain tactical realism.</span>
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
