"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLoader } from "@/components/common/AppLoader";

/** Club details are edited in the club's Settings now; keep old links working. */
export default function EditClubPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/dashboard/efootball/clubs/${clubId}/settings?tab=details`);
  }, [router, clubId]);

  return <AppLoader />;
}
