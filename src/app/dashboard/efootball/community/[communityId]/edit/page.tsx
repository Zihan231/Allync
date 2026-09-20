"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockCommunities } from "@/lib/mock/communityStore";
import { useCommunity, useUpdateCommunity } from "@/lib/api/hooks/useCommunities";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EntityEditForm } from "@/components/dashboard/EntityEditForm";
import { EntityGuidelinesPanel } from "@/components/dashboard/EntityGuidelinesPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { AppLoader } from "@/components/common/AppLoader";
import { ToastContainer } from "@/components/common/Toast";
import { useToast } from "@/lib/useToast";
import { ShieldIcon, LockIcon, UsersIcon, SwapIcon } from "@/components/icons";

export default function EditCommunityPage({ params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = use(params);
  const { t } = useLanguage();
  const { user } = useSession();
  const { data: remoteCommunity, isLoading } = useCommunity(communityId);
  const communities = useMockCommunities();
  const updateMutation = useUpdateCommunity(communityId);
  const { toasts, toast, dismiss } = useToast();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const rules = t.dashboard.community.rules;
  const tips = t.dashboard.community.tips;

  const community = useMemo(() => {
    return remoteCommunity || communities.find((c) => c.id === communityId);
  }, [remoteCommunity, communities, communityId]);

  if (isLoading && !community) {
    return <AppLoader />;
  }

  const canManage = user.community?.id === communityId && user.community?.role === "President";

  if (!community || !canManage) {
    return <EmptyState icon={LockIcon} title={t.dashboard.community.emptyState} body="" />;
  }

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
      <PageHeader
        eyebrow={community.name}
        title={t.dashboard.community.editButton}
        backHref={`/dashboard/efootball/community/${community.id}`}
      />

      {error ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-line bg-surface/50 p-6">
          <EntityEditForm
            nameLabel={t.dashboard.community.createNameLabel}
            descriptionLabel={t.dashboard.community.rulesLabel}
            submitLabel={updateMutation.isPending ? "Saving..." : t.dashboard.organizer.settings.saveButton}
            initialName={community.name}
            initialDescription={community.rules}
            initialDpUrl={community.dpUrl}
            initialCoverUrl={community.coverUrl}
            initialJoinPolicy={community.joinPolicy}
            onSubmit={async (values) => {
              setError(null);
              try {
                await updateMutation.mutateAsync({
                  name: values.name,
                  rules: values.description,
                  dpUrl: values.dpUrl,
                  coverUrl: values.coverUrl,
                  joinPolicy: values.joinPolicy,
                });
                toast("Community updated successfully!", "success");
                router.push(`/dashboard/efootball/community/${community.id}`);
              } catch (err: any) {
                const msg = err?.response?.data?.message || err?.message || "Failed to update community.";
                setError(msg);
                toast(msg, "error");
                console.error("Failed to update community:", msg, err);
              }
            }}
          />
        </div>
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <EntityGuidelinesPanel title={rules.title} items={ruleItems} tone="rules" />
          <EntityGuidelinesPanel title={tips.title} items={tipItems} tone="tips" />
        </div>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
