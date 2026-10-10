"use client";

import { Suspense, use } from "react";
import { AppLoader } from "@/components/common/AppLoader";
import { TournamentDetailView } from "@/components/dashboard/TournamentDetailView";

export default function TournamentDetailPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  return (
    <Suspense fallback={<AppLoader />}>
      <TournamentDetailRoute params={params} />
    </Suspense>
  );
}

function TournamentDetailRoute({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = use(params);
  return (
    <TournamentDetailView
      tournamentId={tournamentId}
      backHref="/dashboard/efootball/tournaments"
      context="my-tournaments"
    />
  );
}

