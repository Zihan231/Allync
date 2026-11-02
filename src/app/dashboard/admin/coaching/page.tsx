"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Pagination } from "@/components/dashboard/Pagination";
import { Button, EmptyRow, ReasonDialog, Tabs } from "@/components/admin/ui";
import { CoachPostCard } from "@/components/coaching/CoachPostCard";
import { useAdminCoachPosts, useReviewCoachPost } from "@/lib/api/hooks/useCoaching";
import type { CoachPost, CoachPostStatus } from "@/lib/api/coaching";

/** Staff review of coaches' tutorial posts: nothing is public until a moderator approves it. */
export default function AdminCoachingPage() {
  const { t } = useLanguage();
  const ta = t.coaching.admin;
  const [status, setStatus] = useState<CoachPostStatus>("pending");
  const [page, setPage] = useState(1);
  const [author, setAuthor] = useState<"coach" | "sponsor" | undefined>(undefined);
  const { data, isLoading } = useAdminCoachPosts(status, page, author);
  const ts = t.sponsors.admin;
  const review = useReviewCoachPost();
  const { toasts, toast, dismiss } = useToast();
  const [rejecting, setRejecting] = useState<CoachPost | null>(null);

  const act = async (post: CoachPost, approve: boolean, reason?: string) => {
    try {
      await review.mutateAsync({ id: post.id, approve, reason });
      toast(approve ? ta.approved : ta.rejected, "success");
      setRejecting(null);
    } catch {
      toast(t.coaching.deals.errGeneric, "error");
    }
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <PageHeader eyebrow={t.admin.eyebrow} title={ts.reviewTitle} description={ta.subtitle} />
      <div className="mt-4 flex flex-wrap gap-2" data-testid="post-author-filter">
        {(
          [
            [undefined, ts.postsFilterAll],
            ["coach", ts.postsFilterCoach],
            ["sponsor", ts.postsFilterSponsor],
          ] as const
        ).map(([value, label]) => (
          <button
            key={label}
            type="button"
            aria-pressed={author === value}
            onClick={() => {
              setAuthor(value);
              setPage(1);
            }}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
              author === value ? "border-accent bg-accent text-bg" : "border-surface-line-strong text-ink-soft hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        <Tabs
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={(["pending", "approved", "rejected"] as const).map((v) => ({ value: v, label: ta.tabs[v], count: data?.counts?.[v] ?? 0 }))}
        />
      </div>

      <div className="mt-6 space-y-5">
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-2xl bg-surface/40" />
        ) : data?.data.length ? (
          data.data.map((post) => (
            <div key={post.id} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px]">
              <CoachPostCard post={post} author={post.coach} showStatus />
              <div className="flex flex-col gap-2">
                {post.authorRole === "sponsor" ? (
                  <span className="w-fit rounded bg-accent-soft px-1.5 py-px text-[10px] font-bold text-accent-ink">{t.sponsors.feed.sponsored}</span>
                ) : null}
                {post.coach ? (
                  <Link href={`/dashboard/admin/users/${post.coach.id}`} className="truncate text-xs text-blue-ink underline">
                    {post.coach.name}
                  </Link>
                ) : null}
                {post.status !== "approved" ? (
                  <Button variant="primary" disabled={review.isPending} onClick={() => act(post, true)}>
                    {ta.approve}
                  </Button>
                ) : null}
                {post.status !== "rejected" ? (
                  <Button variant="danger" disabled={review.isPending} onClick={() => setRejecting(post)}>
                    {ta.reject}
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <EmptyRow>{ta.empty}</EmptyRow>
        )}
      </div>

      {data && data.meta.totalPages > 1 ? (
        <div className="mt-6">
          <Pagination page={page} pageCount={data.meta.totalPages} onPageChange={setPage} />
        </div>
      ) : null}

      {rejecting ? (
        <ReasonDialog
          title={ta.reject}
          reasonLabel={ta.reasonPlaceholder}
          confirmLabel={ta.reject}
          danger
          busy={review.isPending}
          onCancel={() => setRejecting(null)}
          onConfirm={(reason) => act(rejecting, false, reason)}
        />
      ) : null}
    </div>
  );
}
