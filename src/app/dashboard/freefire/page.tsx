"use client";

import { ComingSoonPage } from "@/components/dashboard/ComingSoonPage";
import { getGame } from "@/lib/games";

export default function FreeFirePage() {
  return <ComingSoonPage game={getGame("freefire")} />;
}
