"use client";

import { useMemo } from "react";
import type { ClubMemberProfile } from "@/lib/api/teams";
import { PitchPlayerCard, getPositionColor } from "./PitchPlayerCard";

export interface FormationSlot {
  key: string;
  defaultPosition: string;
  label: string;
  left: string;
  top: string;
}

export const STANDARD_FORMATION: FormationSlot[] = [
  // Forwards (Top)
  { key: "lwf", defaultPosition: "LWF", label: "LWF", left: "20%", top: "15%" },
  { key: "cf", defaultPosition: "CF", label: "CF", left: "50%", top: "12%" },
  { key: "rwf", defaultPosition: "RWF", label: "RWF", left: "80%", top: "15%" },

  // Midfielders (Center)
  { key: "cmf1", defaultPosition: "CMF", label: "CMF", left: "28%", top: "38%" },
  { key: "dmf", defaultPosition: "DMF", label: "DMF", left: "50%", top: "48%" },
  { key: "cmf2", defaultPosition: "CMF", label: "CMF", left: "72%", top: "38%" },

  // Defenders (Backline)
  { key: "lb", defaultPosition: "LB", label: "LB", left: "16%", top: "71%" },
  { key: "cb1", defaultPosition: "CB", label: "CB", left: "38%", top: "74%" },
  { key: "cb2", defaultPosition: "CB", label: "CB", left: "62%", top: "74%" },
  { key: "rb", defaultPosition: "RB", label: "RB", left: "84%", top: "71%" },

  // Goalkeeper
  { key: "gk", defaultPosition: "GK", label: "GK", left: "50%", top: "88%" },
];

export interface TacticalPitchProps {
  starters: ClubMemberProfile[];
  captainProfileId?: string | null;
  selectedPlayerId?: string | null;
  onSelectPlayer?: (player: ClubMemberProfile) => void;
  canManage?: boolean;
}

export function TacticalPitch({
  starters,
  captainProfileId,
  selectedPlayerId,
  onSelectPlayer,
  canManage = false,
}: TacticalPitchProps) {
  // Map starters into formation slots intelligently
  const slotAssignments = useMemo(() => {
    const assigned: Record<string, { player: ClubMemberProfile; slot: FormationSlot } | null> = {};
    const unplacedStarters = [...starters];

    // Priority matcher for exact positions
    const matchSlot = (
      slotKey: string,
      acceptedPositions: string[],
    ) => {
      const idx = unplacedStarters.findIndex((p) =>
        acceptedPositions.includes((p.gamePosition || "").toUpperCase())
      );
      if (idx !== -1) {
        const [player] = unplacedStarters.splice(idx, 1);
        const slot = STANDARD_FORMATION.find((s) => s.key === slotKey)!;
        assigned[slotKey] = { player, slot };
      }
    };

    // 1. Goalkeeper
    matchSlot("gk", ["GK", "GOALKEEPER"]);

    // 2. Center Forwards & Wings
    matchSlot("cf", ["CF", "ST", "SS"]);
    matchSlot("lwf", ["LWF", "LW", "LM"]);
    matchSlot("rwf", ["RWF", "RW", "RM"]);

    // 3. Defenders
    matchSlot("lb", ["LB", "LWB"]);
    matchSlot("rb", ["RB", "RWB"]);
    matchSlot("cb1", ["CB"]);
    matchSlot("cb2", ["CB"]);

    // 4. Midfielders
    matchSlot("dmf", ["DMF", "CDM", "DM"]);
    matchSlot("cmf1", ["CMF", "CM", "AMF", "CAM"]);
    matchSlot("cmf2", ["CMF", "CM", "AMF", "CAM"]);

    // 5. Fill any vacant slots with remaining starters
    STANDARD_FORMATION.forEach((slot) => {
      if (!assigned[slot.key] && unplacedStarters.length > 0) {
        const player = unplacedStarters.shift()!;
        assigned[slot.key] = { player, slot };
      }
    });

    return assigned;
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

        {/* Tactical Pitch Players Overlay */}
        <div className="absolute inset-0">
          {STANDARD_FORMATION.map((slot) => {
            const assignment = slotAssignments[slot.key];
            const player = assignment?.player;
            const isSelected = player ? selectedPlayerId === player.id : false;
            const isCaptain = player ? captainProfileId === player.id : false;
            const colors = getPositionColor(slot.defaultPosition);

            return (
              <div
                key={slot.key}
                className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                style={{ left: slot.left, top: slot.top }}
              >
                {player ? (
                  <PitchPlayerCard
                    player={player}
                    displayPosition={slot.defaultPosition}
                    isSelected={isSelected}
                    onClick={() => onSelectPlayer?.(player)}
                    isCaptain={isCaptain}
                  />
                ) : (
                  /* Empty Position Placeholder */
                  <div
                    className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/25 bg-black/30 p-2 w-[68px] sm:w-[76px] md:w-[84px] h-[80px] sm:h-[90px] backdrop-blur-xs transition-colors ${
                      canManage ? "hover:border-accent hover:bg-accent/10 cursor-pointer" : ""
                    }`}
                  >
                    <span
                      className={`rounded px-1.5 py-0.5 font-display text-[9px] font-black uppercase ${colors.bg} ${colors.text}`}
                    >
                      {slot.defaultPosition}
                    </span>
                    <span className="mt-1 font-display text-[10px] text-white/50">Vacant</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
