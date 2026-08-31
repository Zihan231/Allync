"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockClubs, updateClub } from "@/lib/mock/communityStore";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EntityEditForm } from "@/components/dashboard/EntityEditForm";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LockIcon } from "@/components/icons";

export default function EditClubPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const { t } = useLanguage();
  const { user } = useSession();
  const clubs = useMockClubs();
  const router = useRouter();

  const club = clubs.find((c) => c.id === clubId);
  const canManage = user.club?.id === clubId && (user.club?.role === "President" || user.club?.role === "Manager");

  if (!club || !canManage) {
    return <EmptyState icon={LockIcon} title={t.dashboard.clubs.emptyState} body="" />;
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader eyebrow={club.name} title={t.dashboard.clubs.editButton} />
      <div className="mt-8 rounded-xl border border-surface-line bg-surface/50 p-6">
        <EntityEditForm
          nameLabel={t.dashboard.clubs.createNameLabel}
          descriptionLabel={t.dashboard.clubs.descriptionLabel}
          submitLabel={t.dashboard.organizer.settings.saveButton}
          initialName={club.name}
          initialDescription={club.description}
          initialDpUrl={club.dpUrl}
          initialCoverUrl={club.coverUrl}
          initialJoinPolicy={club.joinPolicy}
          onSubmit={(values) => {
            updateClub(club.id, {
              name: values.name,
              description: values.description,
              dpUrl: values.dpUrl,
              coverUrl: values.coverUrl,
              joinPolicy: values.joinPolicy,
            });
            router.push(`/dashboard/efootball/clubs/${club.id}`);
          }}
        />
      </div>
    </div>
  );
}
