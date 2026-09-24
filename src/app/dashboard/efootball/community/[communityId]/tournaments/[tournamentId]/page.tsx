"use client";

import { Suspense, use } from "react";
import { AppLoader } from "@/components/common/AppLoader";
import { TournamentDetailView } from "@/app/dashboard/efootball/tournaments/[tournamentId]/page";

export default function CommunityTournamentDetailPage({
  params,
}: {
  params: Promise<{ communityId: string; tournamentId: string }>;
}) {
  return (
    <Suspense fallback={<AppLoader />}>
      <CommunityTournamentDetailContent params={params} />
    </Suspense>
  );
}

function CommunityTournamentDetailContent({
  params,
}: {
  params: Promise<{ communityId: string; tournamentId: string }>;
}) {
  const { communityId, tournamentId } = use(params);

  return (
    <TournamentDetailView
      tournamentId={tournamentId}
      backHref={`/dashboard/efootball/community/${communityId}?tab=tournaments`}
      context="community"
    />
  );
}
