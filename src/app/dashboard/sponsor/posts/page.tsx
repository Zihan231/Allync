"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useDeleteSponsorPost } from "@/lib/api/hooks/useSponsors";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { CoachPostCard } from "@/components/coaching/CoachPostCard";
import { FlameIcon, PlusIcon } from "@/components/icons";
import { SponsorShell } from "@/components/sponsors/SponsorShell";

/** The sponsor's posts with their review status; writing one is its own page. */
export default function SponsorPostsPage() {
  const { t } = useLanguage();
  const tp = t.sponsors.posts;
  const del = useDeleteSponsorPost();

  return (
    <SponsorShell title={tp.title} subtitle={tp.subtitle}>
      {(data, toast) => (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <aside className="space-y-4 lg:order-2 lg:sticky lg:top-24 lg:self-start">
            <div className="grid grid-cols-3 divide-x divide-surface-line rounded-2xl border border-surface-line bg-surface/60 text-center">
              {(["approved", "pending", "rejected"] as const).map((s) => (
                <div key={s} className="px-1 py-3">
                  <div className="font-display text-xl font-black text-ink">{data.posts.filter((p) => p.status === s).length}</div>
                  <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-ink-faint">{t.coaching.posts.status[s]}</div>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard/sponsor/posts/new"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 font-display text-sm font-black text-bg"
            >
              <PlusIcon className="h-4 w-4" />
              {tp.composerTitle}
            </Link>
          </aside>
          <div className="mx-auto w-full max-w-2xl space-y-4">
            {data.posts.length ? (
              data.posts.map((post) => (
                <CoachPostCard
                  key={post.id}
                  post={post}
                  author={{ name: data.profile?.brandName ?? "", dpUrl: data.profile?.logoUrl ?? null }}
                  showStatus
                  onDelete={() => {
                    if (window.confirm(t.coaching.posts.deleteConfirm)) del.mutate(post.id, { onError: () => toast(t.coaching.deals.errGeneric, "error") });
                  }}
                />
              ))
            ) : (
              <EmptyState icon={FlameIcon} title={tp.empty} body={tp.subtitle} action={{ label: tp.write, href: "/dashboard/sponsor/posts/new" }} />
            )}
          </div>
        </div>
      )}
    </SponsorShell>
  );
}
