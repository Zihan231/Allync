"use client";

import { Avatar } from "@/components/common/Avatar";
import { ClubCrest } from "@/components/common/ClubCrest";
import type { FixtureEntrant } from "@/lib/api/tournaments";

/** Crest (CvC) or avatar (PvP) for a fixture entrant; dashed placeholder while TBD. */
export function EntrantBadge({
  entrant,
  isCvC,
  size = "sm",
}: {
  entrant: FixtureEntrant | null;
  isCvC: boolean;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-8 w-8" : "h-11 w-11";
  if (!entrant) {
    return <span className={`inline-block shrink-0 rounded-lg border border-dashed border-surface-line-strong ${box}`} />;
  }
  return isCvC ? (
    <ClubCrest
      name={entrant.name}
      color={entrant.color}
      initials={entrant.initials ?? undefined}
      imageUrl={entrant.dpUrl}
      size={size}
      shape="square"
    />
  ) : (
    <Avatar dpUrl={entrant.dpUrl} name={entrant.name} size={size} mode="static" />
  );
}
