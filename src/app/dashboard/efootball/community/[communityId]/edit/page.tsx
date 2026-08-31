"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockCommunities, updateCommunity } from "@/lib/mock/communityStore";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EntityEditForm } from "@/components/dashboard/EntityEditForm";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LockIcon } from "@/components/icons";

export default function EditCommunityPage({ params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = use(params);
  const { t } = useLanguage();
  const { user } = useSession();
  const communities = useMockCommunities();
  const router = useRouter();

  const community = communities.find((c) => c.id === communityId);
  const canManage = user.community?.id === communityId && user.community?.role === "President";

  if (!community || !canManage) {
    return <EmptyState icon={LockIcon} title={t.dashboard.community.emptyState} body="" />;
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        eyebrow={community.name}
        title={t.dashboard.community.editButton}
        backHref={`/dashboard/efootball/community/${community.id}`}
      />
      <div className="mt-8 rounded-xl border border-surface-line bg-surface/50 p-6">
        <EntityEditForm
          nameLabel={t.dashboard.community.createNameLabel}
          descriptionLabel={t.dashboard.community.rulesLabel}
          submitLabel={t.dashboard.organizer.settings.saveButton}
          initialName={community.name}
          initialDescription={community.rules}
          initialDpUrl={community.dpUrl}
          initialCoverUrl={community.coverUrl}
          initialJoinPolicy={community.joinPolicy}
          onSubmit={(values) => {
            updateCommunity(community.id, {
              name: values.name,
              rules: values.description,
              dpUrl: values.dpUrl,
              coverUrl: values.coverUrl,
              joinPolicy: values.joinPolicy,
            });
            router.push(`/dashboard/efootball/community/${community.id}`);
          }}
        />
      </div>
    </div>
  );
}
