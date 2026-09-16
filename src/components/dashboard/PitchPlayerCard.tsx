"use client";

import { Avatar } from "@/components/common/Avatar";
import type { ClubMemberProfile } from "@/lib/api/teams";

export function getPositionColor(pos: string | null | undefined): {
  bg: string;
  text: string;
  border: string;
  glow: string;
} {
  const p = (pos || "").toUpperCase();
  if (["CF", "ST", "SS", "LWF", "RWF"].includes(p)) {
    return {
      bg: "bg-rose-600",
      text: "text-white",
      border: "border-rose-500/60",
      glow: "shadow-[0_0_12px_rgba(225,29,72,0.4)]",
    };
  }
  if (["AMF", "CMF", "DMF", "CDM", "LMF", "RMF"].includes(p)) {
    return {
      bg: "bg-emerald-600",
      text: "text-white",
      border: "border-emerald-500/60",
      glow: "shadow-[0_0_12px_rgba(16,185,129,0.4)]",
    };
  }
  if (["LB", "CB", "RB"].includes(p)) {
    return {
      bg: "bg-sky-600",
      text: "text-white",
      border: "border-sky-500/60",
      glow: "shadow-[0_0_12px_rgba(14,165,233,0.4)]",
    };
  }
  if (p === "GK") {
    return {
      bg: "bg-amber-500",
      text: "text-slate-950",
      border: "border-amber-400/60",
      glow: "shadow-[0_0_12px_rgba(245,158,11,0.4)]",
    };
  }
  return {
    bg: "bg-slate-700",
    text: "text-white",
    border: "border-slate-600",
    glow: "",
  };
}

export function calculateRating(points: number | undefined | null): number {
  if (!points || points <= 0) return 82;
  return Math.min(106, Math.max(78, Math.round(75 + (points / 1500) * 28)));
}

export interface PitchPlayerCardProps {
  player: ClubMemberProfile;
  displayPosition?: string;
  isSelected?: boolean;
  isSwapTarget?: boolean;
  isTargetBench?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  onChangePosition?: () => void;
  size?: "pitch" | "bench";
  isCaptain?: boolean;
  canManage?: boolean;
}

export function PitchPlayerCard({
  player,
  displayPosition,
  isSelected = false,
  isSwapTarget = false,
  isTargetBench = false,
  onClick,
  onRemove,
  onChangePosition,
  size = "pitch",
  isCaptain = false,
  canManage = false,
}: PitchPlayerCardProps) {
  const pos = displayPosition || player.gamePosition || "SUB";
  const colors = getPositionColor(pos);
  const rating = calculateRating(player.points);
  const name = player.user?.name || "Player";

  if (size === "bench") {
    return (
      <div className="relative group/bench w-full">
        <div
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(e) => e.key === "Enter" && onClick?.()}
          className={`group relative flex w-full flex-col items-center rounded-xl border p-2 text-center transition-all duration-200 cursor-pointer select-none ${
            isTargetBench
              ? "border-accent bg-accent/20 shadow-[0_0_20px_rgba(217,165,68,0.45)] scale-[1.03]"
              : "border-surface-line bg-surface/60 hover:border-surface-line-strong hover:bg-surface hover:scale-[1.02]"
          }`}
        >
          {/* Top badges: position & rating */}
          <div className="flex w-full items-center justify-between gap-1 px-1">
            <span
              className={`rounded px-1.5 py-0.5 font-display text-[10px] font-black uppercase tracking-wider ${colors.bg} ${colors.text} ${colors.glow}`}
            >
              {pos}
            </span>
            <span className="font-display text-xs font-black text-accent-ink">{rating}</span>
          </div>

          {/* Avatar */}
          <div className="relative my-1.5 flex h-10 w-10 items-center justify-center">
            <Avatar dpUrl={player.user?.dpUrl} name={name} size="sm" mode="static" />
            {isCaptain && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent font-display text-[9px] font-black text-bg shadow">
                C
              </span>
            )}
          </div>

          {/* Player Name */}
          <span className="w-full truncate font-display text-[11px] font-semibold text-ink group-hover:text-accent-ink">
            {name}
          </span>

          {/* Sub hint when on-pitch player is selected */}
          {isTargetBench && (
            <span className="mt-1 rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold uppercase text-bg animate-pulse">
              Sub In
            </span>
          )}
        </div>

        {/* Remove from team button (visible for managers) */}
        {canManage && onRemove && (
          <button
            type="button"
            title={`Remove ${name} from team`}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-1.5 -right-1.5 z-30 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-md hover:scale-115 transition-transform cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  // Pitch card (on the football field)
  return (
    <div className="relative group/pitch select-none">
      {/* Main card box */}
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => e.key === "Enter" && onClick?.()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border transition-all duration-300 cursor-pointer ${
          isSelected
            ? "border-accent bg-accent/20 ring-4 ring-accent/60 shadow-[0_0_30px_rgba(217,165,68,0.7)] scale-110 z-20"
            : isSwapTarget
            ? "border-emerald-400 bg-emerald-500/20 ring-2 ring-emerald-400/70 hover:scale-105 z-15 shadow-[0_0_20px_rgba(52,211,153,0.5)]"
            : "border-white/20 bg-bg-raised/85 backdrop-blur-md hover:border-accent hover:scale-105 hover:shadow-[0_0_20px_rgba(0,0,0,0.8)] z-10"
        } p-1.5 w-[68px] sm:w-[76px] md:w-[84px] shadow-lg`}
      >
        {/* Top Header: Position & Rating (Unobstructed) */}
        <div className="flex w-full items-center justify-between px-0.5">
          {/* Position Badge (clickable to change position) */}
          <button
            type="button"
            title={canManage ? `Change position (${pos})` : pos}
            disabled={!canManage || !onChangePosition}
            onClick={(e) => {
              if (canManage && onChangePosition) {
                e.stopPropagation();
                onChangePosition();
              }
            }}
            className={`rounded-md px-1.5 py-0.5 font-display text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${colors.bg} ${colors.text} ${colors.glow} ${
              canManage ? "hover:scale-110 hover:brightness-110 cursor-pointer transition-transform" : ""
            }`}
          >
            {pos}
          </button>

          {/* Rating Badge (Completely free, never covered) */}
          <span className="font-display text-[10px] sm:text-xs font-black text-accent-ink tracking-tight pr-0.5">
            {rating}
          </span>
        </div>

        {/* Avatar Container */}
        <div className="relative my-1 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center">
          <div className={`rounded-full p-0.5 transition-colors ${isSelected ? "ring-2 ring-accent" : ""}`}>
            <Avatar dpUrl={player.user?.dpUrl} name={name} size="sm" mode="static" />
          </div>
          {isCaptain && (
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent font-display text-[9px] font-black text-bg shadow">
              C
            </span>
          )}
        </div>

        {/* Name banner */}
        <div className="w-full rounded-md bg-black/60 px-1 py-0.5 text-center backdrop-blur-xs">
          <p className="truncate font-display text-[10px] sm:text-[11px] font-bold text-ink group-hover/pitch:text-accent-ink">
            {name.split(" ")[0]}
          </p>
        </div>

        {/* Action Indicator (Top Center) */}
        {isSelected && (
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-2 py-0.5 font-display text-[8px] font-black uppercase text-bg shadow-md animate-bounce whitespace-nowrap z-25">
            SELECTED
          </span>
        )}
        {!isSelected && isSwapTarget && (
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-2 py-0.5 font-display text-[8px] font-black uppercase text-bg shadow-md whitespace-nowrap z-25">
            SWAP
          </span>
        )}
      </div>

      {/* Position Switcher (Gear) Trigger - Placed at BOTTOM-RIGHT corner so it NEVER touches or overlaps player rating */}
      {canManage && onChangePosition && (
        <button
          type="button"
          title={`Change position for ${name}`}
          onClick={(e) => {
            e.stopPropagation();
            onChangePosition();
          }}
          className="absolute -bottom-2 -right-2 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-black text-bg shadow-[0_0_12px_rgba(217,165,68,0.6)] ring-2 ring-bg hover:scale-125 hover:brightness-115 active:scale-95 transition-all cursor-pointer"
        >
          ⚙
        </button>
      )}
    </div>
  );
}
