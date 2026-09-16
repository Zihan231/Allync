"use client";

import { useMemo } from "react";
import { PitchPlayerCard } from "./PitchPlayerCard";
import type { ClubMemberProfile } from "@/lib/api/teams";

export interface TacticalPitchProps {
  starters: ClubMemberProfile[];
  captainProfileId?: string | null;
  selectedPlayerId?: string | null;
  onSelectPlayer?: (player: ClubMemberProfile) => void;
  onChangePosition?: (player: ClubMemberProfile) => void;
  canManage?: boolean;
}

/**
 * Tactical pitch coordinates for all 13 official eFootball positions.
 * Coordinates are percentage strings: { left: 'X%', top: 'Y%' } relative to the pitch.
 * top 0% = opponent goal (top), top 100% = home goal (bottom).
 */
export function getPositionCoordinates(
  pos: string,
  indexInPosition: number = 0,
  totalInPosition: number = 1,
): { left: string; top: string } {
  const p = (pos || "CMF").toUpperCase();

  switch (p) {
    case "GK":
      return { left: "50%", top: "88%" };

    case "CB":
      if (totalInPosition === 1) return { left: "50%", top: "74%" };
      if (totalInPosition === 2) {
        return indexInPosition === 0
          ? { left: "38%", top: "74%" }
          : { left: "62%", top: "74%" };
      }
      // 3 CBs
      if (indexInPosition === 0) return { left: "28%", top: "74%" };
      if (indexInPosition === 1) return { left: "50%", top: "75%" };
      return { left: "72%", top: "74%" };

    case "LB":
      return { left: "14%", top: "70%" };

    case "RB":
      return { left: "86%", top: "70%" };

    case "DMF":
    case "CDM":
    case "DM":
      if (totalInPosition === 1) return { left: "50%", top: "58%" };
      if (totalInPosition === 2) {
        return indexInPosition === 0
          ? { left: "37%", top: "58%" }
          : { left: "63%", top: "58%" };
      }
      // 3 DMFs
      if (indexInPosition === 0) return { left: "26%", top: "58%" };
      if (indexInPosition === 1) return { left: "50%", top: "59%" };
      return { left: "74%", top: "58%" };

    case "CMF":
    case "CM":
      if (totalInPosition === 1) return { left: "50%", top: "45%" };
      if (totalInPosition === 2) {
        return indexInPosition === 0
          ? { left: "35%", top: "45%" }
          : { left: "65%", top: "45%" };
      }
      // 3 CMFs
      if (indexInPosition === 0) return { left: "26%", top: "45%" };
      if (indexInPosition === 1) return { left: "50%", top: "46%" };
      return { left: "74%", top: "45%" };

    case "LMF":
    case "LM":
      return { left: "15%", top: "42%" };

    case "RMF":
    case "RM":
      return { left: "85%", top: "42%" };

    case "AMF":
    case "CAM":
      if (totalInPosition === 1) return { left: "50%", top: "31%" };
      if (totalInPosition === 2) {
        return indexInPosition === 0
          ? { left: "36%", top: "31%" }
          : { left: "64%", top: "31%" };
      }
      // 3 AMFs
      if (indexInPosition === 0) return { left: "26%", top: "31%" };
      if (indexInPosition === 1) return { left: "50%", top: "32%" };
      return { left: "74%", top: "31%" };

    case "LWF":
    case "LW":
      return { left: "16%", top: "15%" };

    case "RWF":
    case "RW":
      return { left: "84%", top: "15%" };

    case "SS":
      if (totalInPosition === 1) return { left: "50%", top: "20%" };
      return indexInPosition === 0
        ? { left: "37%", top: "20%" }
        : { left: "63%", top: "20%" };

    case "CF":
    case "ST":
      if (totalInPosition === 1) return { left: "50%", top: "10%" };
      if (totalInPosition === 2) {
        return indexInPosition === 0
          ? { left: "37%", top: "10%" }
          : { left: "63%", top: "10%" };
      }
      // 3 CFs
      if (indexInPosition === 0) return { left: "26%", top: "10%" };
      if (indexInPosition === 1) return { left: "50%", top: "9%" };
      return { left: "74%", top: "10%" };

    default:
      return { left: "50%", top: "50%" };
  }
}

export function TacticalPitch({
  starters,
  captainProfileId,
  selectedPlayerId,
  onSelectPlayer,
  onChangePosition,
  canManage = false,
}: TacticalPitchProps) {
  // Group players by position to calculate coordinates for multiple players in same pos (e.g. 2 CBs, 2 CMFs)
  const placedPlayers = useMemo(() => {
    const positionCounts: Record<string, number> = {};
    starters.forEach((p) => {
      const pos = (p.gamePosition || "CMF").toUpperCase();
      positionCounts[pos] = (positionCounts[pos] || 0) + 1;
    });

    const positionIndices: Record<string, number> = {};
    return starters.map((player) => {
      const pos = (player.gamePosition || "CMF").toUpperCase();
      const index = positionIndices[pos] || 0;
      positionIndices[pos] = index + 1;
      const total = positionCounts[pos] || 1;
      const coords = getPositionCoordinates(pos, index, total);
      return { player, pos, coords };
    });
  }, [starters]);

  return (
    <div className="relative w-full max-w-[640px] select-none mx-auto">
      {/* Outer Pitch Container */}
      <div className="relative w-full aspect-[4/5] min-h-[580px] sm:min-h-[640px] rounded-3xl overflow-hidden border-2 border-surface-line-strong shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] bg-gradient-to-b from-[#081810] via-[#05110a] to-[#040c07]">
        {/* Subtle Pitch Grass Lawn Stripes */}
        <div className="absolute inset-0 flex flex-col pointer-events-none opacity-30">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 w-full ${i % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"}`}
            />
          ))}
        </div>

        {/* Stadium Center Light Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.12)_0%,transparent_65%)] pointer-events-none" />

        {/* Tactical Pitch Lines (SVG) */}
        <svg
          className="absolute inset-0 h-full w-full pointer-events-none"
          viewBox="0 0 700 860"
          preserveAspectRatio="none"
        >
          {/* Pitch Outer Boundary */}
          <rect
            x="30"
            y="30"
            width="640"
            height="800"
            rx="16"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="2.5"
          />

          {/* Halfway Line */}
          <line
            x1="30"
            y1="430"
            x2="670"
            y2="430"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="2"
          />

          {/* Center Circle & Spot */}
          <circle
            cx="350"
            cy="430"
            r="80"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="2"
          />
          <circle cx="350" cy="430" r="4.5" fill="rgba(255,255,255,0.4)" />

          {/* TOP PENALTY AREA (Opponent Goal) */}
          <rect
            x="180"
            y="30"
            width="340"
            height="135"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="2"
          />
          <rect
            x="255"
            y="30"
            width="190"
            height="48"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
          />
          <path
            d="M 285 165 A 75 75 0 0 0 415 165"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
          />
          <circle cx="350" cy="115" r="3.5" fill="rgba(255,255,255,0.35)" />

          {/* BOTTOM PENALTY AREA (Home Goal) */}
          <rect
            x="180"
            y="695"
            width="340"
            height="135"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="2"
          />
          <rect
            x="255"
            y="782"
            width="190"
            height="48"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
          />
          <path
            d="M 285 695 A 75 75 0 0 1 415 695"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
          />
          <circle cx="350" cy="745" r="3.5" fill="rgba(255,255,255,0.35)" />

          {/* Corner Arcs */}
          <path d="M 30 52 A 22 22 0 0 0 52 30" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <path d="M 648 30 A 22 22 0 0 0 670 52" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <path d="M 30 808 A 22 22 0 0 0 52 830" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <path d="M 648 830 A 22 22 0 0 0 670 808" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        </svg>

        {/* Tactical Pitch Players Overlay - Smooth gliding transitions */}
        <div className="absolute inset-0">
          {placedPlayers.map(({ player, pos, coords }) => {
            const isSelected = selectedPlayerId === player.id;
            const isSwapTarget = Boolean(selectedPlayerId && selectedPlayerId !== player.id);
            const isCaptain = captainProfileId === player.id;

            return (
              <div
                key={player.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out z-10"
                style={{ left: coords.left, top: coords.top }}
              >
                <PitchPlayerCard
                  player={player}
                  displayPosition={pos}
                  isSelected={isSelected}
                  isSwapTarget={isSwapTarget}
                  onClick={() => onSelectPlayer?.(player)}
                  onChangePosition={() => onChangePosition?.(player)}
                  isCaptain={isCaptain}
                  canManage={canManage}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
