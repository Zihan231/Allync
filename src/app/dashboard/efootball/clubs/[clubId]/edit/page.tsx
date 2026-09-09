"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockClubs, updateClub } from "@/lib/mock/communityStore";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EntityEditForm } from "@/components/dashboard/EntityEditForm";
import { EntityGuidelinesPanel } from "@/components/dashboard/EntityGuidelinesPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ShieldIcon, LockIcon, UsersIcon, TrophyIcon } from "@/components/icons";

export default function EditClubPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const { t } = useLanguage();
  const { user } = useSession();
  const clubs = useMockClubs();
  const router = useRouter();
  const rules = t.dashboard.clubs.rules;
  const tips = t.dashboard.clubs.tips;

  const club = clubs.find((c) => c.id === clubId);
  const canManage = user.club?.id === clubId && (user.club?.role === "President" || user.club?.role === "Manager");

  if (!club || !canManage) {
    return <EmptyState icon={LockIcon} title={t.dashboard.clubs.emptyState} body="" />;
  }

  const ruleItems = [
    { icon: LockIcon, title: rules.item1Title, body: rules.item1Body },
    { icon: ShieldIcon, title: rules.item2Title, body: rules.item2Body },
    { icon: UsersIcon, title: rules.item3Title, body: rules.item3Body },
  ];
  const tipItems = [
    { icon: LockIcon, title: tips.item1Title, body: tips.item1Body },
    { icon: UsersIcon, title: tips.item2Title, body: tips.item2Body },
    { icon: TrophyIcon, title: tips.item3Title, body: tips.item3Body },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={club.name}
        title={t.dashboard.clubs.editButton}
        backHref={`/dashboard/efootball/clubs/${club.id}`}
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-line bg-surface/50 p-6">
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
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <EntityGuidelinesPanel title={rules.title} items={ruleItems} tone="rules" />
          <EntityGuidelinesPanel title={tips.title} items={tipItems} tone="tips" />
        </div>
      </div>
    </div>
  );
}
