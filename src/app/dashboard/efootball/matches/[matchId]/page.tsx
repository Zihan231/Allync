"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLoader } from "@/components/common/AppLoader";

/**
 * Matches open inside their tournament's bracket now (evidence upload and
 * review live there); old match links land on the Matches list.
 */
export default function MatchDetailPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/efootball/matches");
  }, [router]);

  return <AppLoader />;
}
