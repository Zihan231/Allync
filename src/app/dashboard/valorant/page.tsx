"use client";

import { ComingSoonPage } from "@/components/dashboard/ComingSoonPage";
import { getGame } from "@/lib/games";

export default function ValorantPage() {
  return <ComingSoonPage game={getGame("valorant")} />;
}
