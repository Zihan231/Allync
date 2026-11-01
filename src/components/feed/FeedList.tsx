"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import type { FeedTab } from "@/lib/api/feed";
import { feedKeys, useFeed } from "@/lib/api/hooks/useFeed";
import { FeedCard } from "./FeedCard";
import { FeedCardSkeleton } from "./FeedCardSkeleton";
import { useSeenTracker } from "./useSeenTracker";

/**
 * Endless feed: the next page is fetched well before the end comes into view (so scrolling
 * doesn't stall), skeletons fill in while it loads, and it ends with "You're all caught up".
 */
export function FeedList({ tab, onToast }: { tab: FeedTab; onToast?: (message: string, variant?: "success" | "error") => void }) {
  const { t } = useLanguage();
  const tf = t.coaching.feed;
  const { isAuthenticated } = useSession();
  const qc = useQueryClient();
  const feed = useFeed(tab);
  const seenRef = useSeenTracker(isAuthenticated && tab === "for_you");
  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;

  // Pages can overlap a little when counts change while scrolling: show each post once.
  const items = useMemo(() => {
    const seen = new Set<string>();
    return (feed.data?.pages ?? []).flatMap((p) => p.items).filter((it) => (seen.has(it.id) ? false : (seen.add(it.id), true)));
  }, [feed.data]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) void fetchNextPage();
      },
      // Start loading about two screens ahead.
      { rootMargin: "0px 0px 1600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, items.length]);

  if (feed.isLoading) {
    return (
      <div className="space-y-4" data-testid="feed-loading">
        <FeedCardSkeleton />
        <FeedCardSkeleton media />
        <FeedCardSkeleton />
      </div>
    );
  }
  if (feed.isError) {
    return (
      <div className="rounded-2xl border border-surface-line bg-surface/60 p-8 text-center">
        <p className="text-sm text-ink-soft">{tf.loadError}</p>
        <button type="button" onClick={() => feed.refetch()} className="mt-3 rounded-full bg-accent px-5 py-2 text-sm font-bold text-bg">
          {tf.retry}
        </button>
      </div>
    );
  }
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-surface-line-strong p-10 text-center" data-testid="feed-empty">
        <p className="text-sm text-ink-soft">{tab === "following" ? tf.emptyFollowing : tab === "saved" ? tf.emptySaved : tf.emptyForYou}</p>
        {tab !== "saved" ? (
          <Link href="/dashboard/efootball/coaches" className="mt-4 inline-flex rounded-full bg-accent px-5 py-2 text-sm font-bold text-bg">
            {t.coaching.directory.title}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <FeedCard key={item.id} item={item} seenRef={seenRef} onToast={onToast} />
      ))}
      <div ref={sentinel} aria-hidden="true" />
      {isFetchingNextPage ? (
        <div className="space-y-4">
          <FeedCardSkeleton media />
          <FeedCardSkeleton />
        </div>
      ) : null}
      {!hasNextPage ? (
        <div className="py-8 text-center" data-testid="feed-end">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-success text-xl text-success-ink">✓</div>
          <p className="mt-3 font-display text-base font-black text-ink">{tf.caughtUp}</p>
          <p className="mt-1 text-xs text-ink-soft">{tf.caughtUpBody}</p>
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              void qc.resetQueries({ queryKey: feedKeys.tab(tab) });
            }}
            className="mt-4 rounded-full border border-surface-line-strong px-5 py-2 text-sm font-semibold text-ink-soft hover:text-ink"
          >
            {tf.refresh}
          </button>
        </div>
      ) : null}
    </div>
  );
}
