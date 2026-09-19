"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useCreateCommunity } from "@/lib/api/hooks/useCommunities";
import { isApiError } from "@/lib/api/axios";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EntityEditForm } from "@/components/dashboard/EntityEditForm";
import { EntityGuidelinesPanel } from "@/components/dashboard/EntityGuidelinesPanel";
import { ShieldIcon, LockIcon, UsersIcon, SwapIcon } from "@/components/icons";

export default function CreateCommunityPage() {
  const { t } = useLanguage();
  const { user, setCommunity } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const createCommunity = useCreateCommunity();

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

  const handleSubmit = async ({
    name,
    description,
    joinPolicy,
  }: {
    name: string;
    description: string;
    joinPolicy: "instant" | "approval";
  }) => {
    if (user.community && !window.confirm(t.dashboard.community.switchConfirm)) return;
    setError(null);

    try {
      const community = await createCommunity.mutateAsync({
        input: { name, rules: description, joinPolicy },
        creatorPersonId: user.personId,
      });

      setCommunity({ id: community.id, name: community.name, role: "President" });
      router.push(`/dashboard/efootball/community/${community.id}`);
    } catch (err) {
      setError(
        isApiError(err)
          ? err.message
          : (err as Error)?.message || "Failed to create community. Please try again."
      );
    }
  };

  return (
    <div>
      <PageHeader eyebrow="eFootball" title={t.dashboard.community.createCta} backHref="/dashboard/efootball/community" />

      {error ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

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
            submitLabel={createCommunity.isPending ? "Creating community..." : t.dashboard.community.createSubmit}
            onSubmit={handleSubmit}
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
