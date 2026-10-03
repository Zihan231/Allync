"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLoader } from "@/components/common/AppLoader";

/**
 * Joining a club now goes through transfer proposals, answered in the club's
 * Transfers tab ("Join requests"); old links to this page land there.
 */
export default function ClubRequestsPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/dashboard/efootball/clubs/${clubId}?tab=transfers`);
  }, [router, clubId]);

  return <AppLoader />;
}
