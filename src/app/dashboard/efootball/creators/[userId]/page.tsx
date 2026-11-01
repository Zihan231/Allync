"use client";

import { useParams } from "next/navigation";
import { BackButton } from "@/components/dashboard/BackButton";
import { CreatorShowcase } from "@/components/creators/CreatorShowcase";

/** A creator's public page, linked from store cards. */
export default function CreatorPublicPage() {
  const { userId } = useParams<{ userId: string }>();
  return (
    <div className="space-y-4">
      <BackButton />
      <CreatorShowcase userId={userId} />
    </div>
  );
}
