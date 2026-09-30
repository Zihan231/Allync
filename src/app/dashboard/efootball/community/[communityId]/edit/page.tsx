"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLoader } from "@/components/common/AppLoader";

/** Community details are edited in the community's Settings now; keep old links working. */
export default function EditCommunityPage({ params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/dashboard/efootball/community/${communityId}/settings?tab=details`);
  }, [router, communityId]);

  return <AppLoader />;
}
