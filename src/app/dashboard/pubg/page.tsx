"use client";

import { ComingSoonPage } from "@/components/dashboard/ComingSoonPage";
import { getGame } from "@/lib/games";

export default function PubgPage() {
  return <ComingSoonPage game={getGame("pubg")} />;
}
