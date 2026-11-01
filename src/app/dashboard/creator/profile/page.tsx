"use client";

import { useSession } from "@/lib/session/SessionContext";
import { ProfileModeBar } from "@/components/roles/ProfileModeBar";
import { CreatorShowcase } from "@/components/creators/CreatorShowcase";

/** The creator side of the account: the creator page buyers see. */
export default function CreatorProfilePage() {
  const { user } = useSession();
  return (
    <div className="space-y-6">
      <ProfileModeBar current="creator" />
      <CreatorShowcase userId={user.id} />
    </div>
  );
}
