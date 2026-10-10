"use client";

import { Suspense, use } from "react";
import { AppLoader } from "@/components/common/AppLoader";
import { TournamentDetailView } from "@/components/dashboard/TournamentDetailView";

/** A club-hosted (PvP) tournament, opened from its club's Tournaments tab. */
export default function ClubTournamentDetailPage({
  params,
}: {
  params: Promise<{ clubId: string; tournamentId: string }>;
}) {
  return (
    <Suspense fallback={<AppLoader />}>
      <ClubTournamentDetailContent params={params} />
    </Suspense>
  );
}

function ClubTournamentDetailContent({
  params,
}: {
  params: Promise<{ clubId: string; tournamentId: string }>;
}) {
  const { clubId, tournamentId } = use(params);

  return (
    <TournamentDetailView
      tournamentId={tournamentId}
      backHref={`/dashboard/efootball/clubs/${clubId}?tab=tournaments`}
      context="community"
    />
  );
}
