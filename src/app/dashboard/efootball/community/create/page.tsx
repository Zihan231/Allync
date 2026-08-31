"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { createCommunity } from "@/lib/mock/communityStore";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EntityEditForm } from "@/components/dashboard/EntityEditForm";

export default function CreateCommunityPage() {
  const { t } = useLanguage();
  const { user, setCommunity } = useSession();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader eyebrow="eFootball" title={t.dashboard.community.createCta} />
      <div className="mt-8 rounded-xl border border-surface-line bg-surface/50 p-6">
        <EntityEditForm
          nameLabel={t.dashboard.community.createNameLabel}
          descriptionLabel={t.dashboard.community.rulesLabel}
          submitLabel={t.dashboard.community.createSubmit}
          onSubmit={({ name, description, joinPolicy }) => {
            const community = createCommunity({ name, rules: description, joinPolicy }, user.personId);
            setCommunity({ id: community.id, name: community.name, role: "President" });
            router.push(`/dashboard/efootball/community/${community.id}`);
          }}
        />
      </div>
    </div>
  );
}
