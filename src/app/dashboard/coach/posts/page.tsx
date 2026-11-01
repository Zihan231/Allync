"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useDeleteCoachPost } from "@/lib/api/hooks/useCoaching";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { AppLoader } from "@/components/common/AppLoader";
import { CoachShell } from "@/components/coaching/CoachShell";
import { CoachPostCard } from "@/components/coaching/CoachPostCard";
import { FlameIcon, PlusIcon } from "@/components/icons";

/** The coach's tutorials as a feed, with a side panel (counts, new post, tips); writing one is its own page. */
export default function CoachPostsPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <CoachPosts />
    </Suspense>
  );
}

function CoachPosts() {
  const { t } = useLanguage();
  const tp = t.coaching.posts;
  const { user } = useSession();
  const del = useDeleteCoachPost();
  const justSent = useSearchParams().get("sent") === "1";

  return (
    <CoachShell title={t.coaching.nav.posts}>
      {(data, toast) => {
        const counts = (["approved", "pending", "rejected"] as const).map((s) => [s, data.posts.filter((p) => p.status === s).length] as const);
        return (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
            {/* Side panel first on phones, on the right on wide screens */}
            <aside className="space-y-4 lg:order-2 lg:sticky lg:top-24 lg:self-start">
              <section className="rounded-2xl border border-surface-line bg-surface/60 p-5">
                <h2 className="font-display text-base font-black text-ink">{tp.overview}</h2>
                <div className="mt-3 grid grid-cols-3 divide-x divide-surface-line rounded-xl border border-surface-line bg-bg/40 text-center">
                  {counts.map(([status, n]) => (
                    <div key={status} className="px-1 py-3">
                      <div className="font-display text-xl font-black text-ink">{n}</div>
                      <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-ink-faint">{tp.status[status]}</div>
                    </div>
                  ))}
                </div>
                {data.profile ? (
                  <Link
                    href="/dashboard/coach/posts/new"
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 font-display text-sm font-black text-bg transition-transform hover:-translate-y-0.5"
                  >
                    <PlusIcon className="h-4 w-4" />
                    {tp.composerTitle}
                  </Link>
                ) : null}
              </section>
              <section className="rounded-2xl border border-surface-line bg-surface/60 p-5">
                <h2 className="font-display text-base font-black text-ink">{tp.tipsTitle}</h2>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink-soft">
                  {tp.tips.split(" · ").map((tip) => (
                    <li key={tip} className="flex gap-2">
                      <span className="text-accent-ink">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </aside>

            <div className="min-w-0 space-y-4 lg:order-1">
              {justSent ? (
                <p className="rounded-xl border border-success/40 bg-success-soft px-4 py-3 text-sm font-semibold text-success-ink" role="status">
                  {tp.submitted}
                </p>
              ) : null}
              {data.posts.length ? (
                data.posts.map((p) => (
                  <CoachPostCard
                    key={p.id}
                    post={p}
                    author={{ name: user.name, dpUrl: user.dpUrl }}
                    showStatus={p.status !== "approved"}
                    shareUrl={p.status === "approved" ? `/dashboard/efootball/coaches/${user.id}` : undefined}
                    onShared={() => toast(t.coaching.page.copied, "success")}
                    onDelete={() => {
                      if (window.confirm(tp.deleteConfirm)) del.mutate(p.id);
                    }}
                  />
                ))
              ) : (
                <EmptyState icon={FlameIcon} title={tp.empty} body={tp.composerHint} />
              )}
            </div>
          </div>
        );
      }}
    </CoachShell>
  );
}
