"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { createCommunity } from "@/lib/mock/communityStore";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EntityEditForm } from "@/components/dashboard/EntityEditForm";
import { EntityGuidelinesPanel } from "@/components/dashboard/EntityGuidelinesPanel";
import { ShieldIcon, LockIcon, UsersIcon, SwapIcon } from "@/components/icons";

export default function CreateCommunityPage() {
  const { t } = useLanguage();
  const { user, setCommunity } = useSession();
  const router = useRouter();
  const rules = t.dashboard.community.rules;
  const tips = t.dashboard.community.tips;

  const ruleItems = [
    { icon: LockIcon, title: rules.item1Title, body: rules.item1Body },
    { icon: ShieldIcon, title: rules.item2Title, body: rules.item2Body },
    { icon: UsersIcon, title: rules.item3Title, body: rules.item3Body },
  ];
  const tipItems = [
    { icon: ShieldIcon, title: tips.item1Title, body: tips.item1Body },
    { icon: UsersIcon, title: tips.item2Title, body: tips.item2Body },
    { icon: SwapIcon, title: tips.item3Title, body: tips.item3Body },
  ];

  return (
    <div>
      <PageHeader eyebrow="eFootball" title={t.dashboard.community.createCta} backHref="/dashboard/efootball/community" />

      {user.community ? (
        <p className="mt-6 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning-ink">
          {t.dashboard.community.switchConfirm}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-line bg-surface/50 p-6">
          <EntityEditForm
            nameLabel={t.dashboard.community.createNameLabel}
            descriptionLabel={t.dashboard.community.rulesLabel}
            submitLabel={t.dashboard.community.createSubmit}
            onSubmit={({ name, description, joinPolicy }) => {
              if (user.community && !window.confirm(t.dashboard.community.switchConfirm)) return;
              const community = createCommunity({ name, rules: description, joinPolicy }, user.personId);
              setCommunity({ id: community.id, name: community.name, role: "President" });
              router.push(`/dashboard/efootball/community/${community.id}`);
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
