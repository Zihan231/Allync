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

      {user.club ? (
        <p className="mt-6 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning-ink">
          {t.dashboard.clubs.switchConfirm}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-line bg-surface/50 p-6">
          <EntityEditForm
            nameLabel={t.dashboard.clubs.createNameLabel}
            descriptionLabel={t.dashboard.clubs.descriptionLabel}
            submitLabel={t.dashboard.clubs.createSubmit}
            onSubmit={({ name, description, joinPolicy }) => {
              if (user.club && !window.confirm(t.dashboard.clubs.switchConfirm)) return;
              const club = createClub(
                { name, description, color: colorFromString(name), joinPolicy },
                user.personId
              );
              setClub({ id: club.id, name: club.name, role: "President" });
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
