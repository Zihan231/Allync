"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { createClub } from "@/lib/mock/communityStore";
import { colorFromString } from "@/lib/colorHash";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EntityEditForm } from "@/components/dashboard/EntityEditForm";

export default function CreateClubPage() {
  const { t } = useLanguage();
  const { user, setClub } = useSession();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader eyebrow="eFootball" title={t.dashboard.clubs.createCta} backHref="/dashboard/efootball/clubs" />
      <div className="mt-8 rounded-xl border border-surface-line bg-surface/50 p-6">
        <EntityEditForm
          nameLabel={t.dashboard.clubs.createNameLabel}
          descriptionLabel={t.dashboard.clubs.descriptionLabel}
          submitLabel={t.dashboard.clubs.createSubmit}
          onSubmit={({ name, description, joinPolicy }) => {
            const club = createClub(
              { name, description, color: colorFromString(name), joinPolicy },
              user.personId
            );
            setClub({ id: club.id, name: club.name, role: "President" });
            router.push(`/dashboard/efootball/clubs/${club.id}`);
          }}
        />
      </div>
    </div>
  );
}
