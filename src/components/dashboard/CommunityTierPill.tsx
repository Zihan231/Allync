import type { CommunityTier } from "@/lib/mock/types";

const TIER_TONE_CLASSES: Record<CommunityTier, string> = {
  Featured: "bg-accent-soft text-accent-ink",
  Verified: "bg-blue-soft text-blue-ink",
  Regional: "bg-success-soft text-success-ink",
  Open: "bg-surface-line/60 text-ink-faint",
  New: "bg-warning-soft text-warning-ink",
};

export function CommunityTierPill({ tier, className = "" }: { tier: CommunityTier; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${TIER_TONE_CLASSES[tier]} ${className}`}
    >
      {tier}
    </span>
  );
}
