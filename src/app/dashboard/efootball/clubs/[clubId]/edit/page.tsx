"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockClubs, updateClub, deleteClub } from "@/lib/mock/communityStore";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EntityEditForm } from "@/components/dashboard/EntityEditForm";
import { EntityGuidelinesPanel } from "@/components/dashboard/EntityGuidelinesPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ShieldIcon, LockIcon, UsersIcon, TrophyIcon } from "@/components/icons";

export default function EditClubPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const { t } = useLanguage();
  const { user, setClub } = useSession();
  const clubs = useMockClubs();
  const router = useRouter();
  const rules = t.dashboard.clubs.rules;
  const tips = t.dashboard.clubs.tips;
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const club = clubs.find((c) => c.id === clubId);
  // Matches the backend guard on PATCH/DELETE /clubs/:id exactly.
  const canManage = user.club?.id === clubId && (user.club?.role === "President" || user.club?.role === "General Secretary");

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

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${club.name}? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteClub(club.id);
      setClub(null);
      router.push("/dashboard/efootball/clubs");
    } catch (err: any) {
      setError(err?.message || "Failed to delete club. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow={club.name}
        title={t.dashboard.clubs.editButton}
        backHref={`/dashboard/efootball/clubs/${club.id}`}
      />

      {error ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-line bg-surface/50 p-6">
          <EntityEditForm
            nameLabel={t.dashboard.clubs.createNameLabel}
            descriptionLabel={t.dashboard.clubs.descriptionLabel}
            submitLabel={submitting ? "Saving..." : t.dashboard.organizer.settings.saveButton}
            initialName={club.name}
            initialDescription={club.description}
            initialDpUrl={club.dpUrl}
            initialCoverUrl={club.coverUrl}
            initialJoinPolicy={club.joinPolicy}
            onSubmit={async (values) => {
              setSubmitting(true);
              setError(null);
              try {
                await updateClub(club.id, {
                  name: values.name,
                  description: values.description,
                  dpUrl: values.dpUrl,
                  coverUrl: values.coverUrl,
                  joinPolicy: values.joinPolicy,
                });
                router.push(`/dashboard/efootball/clubs/${club.id}`);
              } catch (err: any) {
                setError(err?.message || "Failed to save club changes. Please try again.");
                setSubmitting(false);
              }
            }}
          />

          {canManage ? (
            <div className="mt-8 border-t border-surface-line pt-6">
              <h3 className="text-sm font-semibold text-ink">Danger zone</h3>
              <p className="mt-1 text-xs text-ink-soft">
                Deleting this club is permanent and removes it for all members.
              </p>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="mt-3 rounded-full bg-danger-soft px-4 py-2 text-sm font-semibold text-danger-ink disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete club"}
              </button>
            </div>
          ) : null}
        </div>
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <EntityGuidelinesPanel title={rules.title} items={ruleItems} tone="rules" />
          <EntityGuidelinesPanel title={tips.title} items={tipItems} tone="tips" />
        </div>
      </div>
    </div>
  );
}
