"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useDeleteCoachPost } from "@/lib/api/hooks/useCoaching";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { CoachShell } from "@/components/coaching/CoachShell";
import { CoachProfileForm } from "@/components/coaching/CoachProfileForm";
import { CoachPostComposer } from "@/components/coaching/CoachPostComposer";
import { CoachPostCard } from "@/components/coaching/CoachPostCard";

/** The coach's tutorials: a composer and every post with its review status. */
export default function CoachPostsPage() {
  const { t } = useLanguage();
  const tp = t.coaching.posts;
  const del = useDeleteCoachPost();
  return (
    <CoachShell title={t.coaching.nav.posts} subtitle={tp.composerHint}>
      {(data, toast) => (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            {data.profile ? <CoachPostComposer onToast={toast} /> : <CoachProfileForm profile={null} onSaved={(m) => toast(m, "success")} />}
          </div>
          <div className="space-y-4">
            {data.posts.length ? (
              data.posts.map((p) => (
                <CoachPostCard
                  key={p.id}
                  post={p}
                  showStatus
                  onDelete={() => {
                    if (window.confirm(tp.deleteConfirm)) del.mutate(p.id);
                  }}
                />
              ))
            ) : (
              <EmptyState title={tp.empty} body="" />
            )}
          </div>
        </div>
      )}
    </CoachShell>
  );
}
