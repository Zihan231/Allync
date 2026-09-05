import type { ClubStage } from "@/lib/mock/types";

const STAGE_TONE_CLASSES: Record<ClubStage, string> = {
  Apex: "bg-accent-soft text-accent-ink",
  Elite: "bg-blue-soft text-blue-ink",
  College: "bg-blue-soft text-blue-ink",
  University: "bg-blue-soft text-blue-ink",
  Foundation: "bg-warning-soft text-warning-ink",
  District: "bg-warning-soft text-warning-ink",
  Division: "bg-warning-soft text-warning-ink",
  "N/A": "bg-surface-line/60 text-ink-faint",
  Special: "bg-surface-line/60 text-ink-faint",
  "Official Team": "bg-surface-line/60 text-ink-faint",
  "Matchday Management Panel": "bg-surface-line/60 text-ink-faint",
  "Intra Bid S1": "bg-surface-line/60 text-ink-faint",
  "Reality Bid S1": "bg-surface-line/60 text-ink-faint",
  "Reality Bid S2": "bg-surface-line/60 text-ink-faint",
};

export function StagePill({ stage, className = "" }: { stage: ClubStage; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${STAGE_TONE_CLASSES[stage]} ${className}`}
    >
      {stage}
    </span>
  );
}
