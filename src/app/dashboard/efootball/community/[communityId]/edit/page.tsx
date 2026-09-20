"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockCommunities } from "@/lib/mock/communityStore";
import { useCommunity, useUpdateCommunity, useDeleteCommunity } from "@/lib/api/hooks/useCommunities";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EntityEditForm } from "@/components/dashboard/EntityEditForm";
import { EntityGuidelinesPanel } from "@/components/dashboard/EntityGuidelinesPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { AppLoader } from "@/components/common/AppLoader";
import { ToastContainer } from "@/components/common/Toast";
import { useToast } from "@/lib/useToast";
import { ShieldIcon, LockIcon, UsersIcon, SwapIcon } from "@/components/icons";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useConfirm } from "@/lib/useConfirm";
import { isApiError } from "@/lib/api/axios";

export default function EditCommunityPage({ params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = use(params);
  const { t } = useLanguage();
  const { user } = useSession();
  const { data: remoteCommunity, isLoading } = useCommunity(communityId);
  const communities = useMockCommunities();
  const updateMutation = useUpdateCommunity(communityId);
  const deleteMutation = useDeleteCommunity();
  const { confirm, confirmProps } = useConfirm();
  const { setCommunity } = useSession();
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

  const isPresident = user.community?.id === communityId && user.community?.role === "President";
  const canManage = isPresident;
  const handleDelete = async () => {
    if (!community || !isPresident) return;
    if (!await confirm(`Delete ${community.name}? This cannot be undone. All community data will be permanently removed.`, {
      title: "Delete Community",
      variant: "danger",
      confirmLabel: "Delete Forever",
    })) return;

    setError(null);
    try {
      await deleteMutation.mutateAsync(community.id);
      setCommunity(null);
      router.push("/dashboard/efootball/community");
    } catch (err: any) {
      const msg = isApiError(err) ? err.message : (err as Error)?.message || "Failed to delete community.";
      setError(msg);
      toast(msg, "error");
    }
  };


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
          {isPresident ? (
            <div className="mt-8 border-t border-surface-line pt-6">
              <h3 className="text-sm font-semibold text-ink">Danger zone</h3>
              <p className="mt-1 text-xs text-ink-soft">
                Deleting this community is permanent and removes it for all members. Only the Community President can delete the community.
              </p>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="mt-3 rounded-full bg-danger-soft px-4 py-2 text-sm font-semibold text-danger-ink disabled:opacity-50 transition-colors hover:bg-danger-soft/80"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete community"}
              </button>
            </div>
          ) : null}
        </div>
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <EntityGuidelinesPanel title={rules.title} items={ruleItems} tone="rules" />
          <EntityGuidelinesPanel title={tips.title} items={tipItems} tone="tips" />
        </div>
      </div>
      <ConfirmDialog {...confirmProps} />
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
