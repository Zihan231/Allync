"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import type { FeedTab } from "@/lib/api/feed";
import { useCoaches } from "@/lib/api/hooks/useCoaching";
import { useFollowStats, useToggleFollow } from "@/lib/api/hooks/useFeed";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { Avatar } from "@/components/common/Avatar";
import { AppLoader } from "@/components/common/AppLoader";
import { FeedList } from "@/components/feed/FeedList";

const TABS: FeedTab[] = ["for_you", "following", "saved"];

/** The feed, in every mode: For you (ranked), Following, Saved. */
export default function FeedPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <Feed />
    </Suspense>
  );
}

function Feed() {
  const { t } = useLanguage();
  const tf = t.coaching.feed;
  const router = useRouter();
  const params = useSearchParams();
  const tab: FeedTab = (TABS as string[]).includes(params.get("tab") ?? "") ? (params.get("tab") as FeedTab) : "for_you";
  const { toasts, toast, dismiss } = useToast();

  return (
    <div className="mx-auto grid max-w-6xl justify-center gap-8 xl:grid-cols-[minmax(0,640px)_300px]">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div className="w-full min-w-0 max-w-[640px]">
        <header className="mb-3">
          <h1 className="font-display text-2xl font-black text-ink">{tf.title}</h1>
          <p className="mt-0.5 text-sm text-ink-soft">{tf.subtitle}</p>
        </header>
        {/* Tabs stay reachable while scrolling */}
        <nav
          role="tablist"
          className="sticky top-14 z-10 -mx-4 mb-4 flex gap-1 border-b border-surface-line bg-bg/90 px-4 py-2 backdrop-blur-md min-[400px]:top-16 sm:mx-0 sm:rounded-full sm:border sm:px-1.5 sm:py-1.5"
        >
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => {
                router.replace(key === "for_you" ? "/dashboard/feed" : `/dashboard/feed?tab=${key}`, { scroll: false });
                window.scrollTo({ top: 0 });
              }}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                tab === key ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"
              }`}
            >
              {tf.tabs[key]}
            </button>
          ))}
        </nav>
        <FeedList key={tab} tab={tab} onToast={toast} />
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-24">
          <SuggestedCoaches />
        </div>
      </aside>
    </div>
  );
}

function SuggestedCoach({ id, name, dpUrl, headline }: { id: string; name: string; dpUrl: string | null; headline: string }) {
  const { t } = useLanguage();
  const tf = t.coaching.feed;
  const { user, isAuthenticated } = useSession();
  const { data } = useFollowStats(id, isAuthenticated);
  const follow = useToggleFollow();
  const following = data?.followedByMe ?? false;
  return (
    <li className="flex items-center gap-3">
      <Link href={`/dashboard/efootball/coaches/${id}`} className="shrink-0">
        <Avatar dpUrl={dpUrl} name={name} size="sm" mode="static" className="!h-10 !w-10" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/dashboard/efootball/coaches/${id}`} className="block truncate text-sm font-semibold text-ink hover:underline">
          {name}
        </Link>
        <div className="truncate text-[11px] text-ink-faint">{headline}</div>
      </div>
      {isAuthenticated && user.id !== id ? (
        <button
          type="button"
          onClick={() => follow.mutate({ coachId: id, on: !following })}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${following ? "text-ink-soft" : "text-accent-ink hover:underline"}`}
        >
          {following ? tf.following : tf.follow}
        </button>
      ) : null}
    </li>
  );
}

function SuggestedCoaches() {
  const { t } = useLanguage();
  const tf = t.coaching.feed;
  const { user } = useSession();
  const { data } = useCoaches({ available: true, limit: 7 });
  const coaches = (data?.data ?? []).filter((c) => c.userId !== user.id).slice(0, 6);
  if (!coaches.length) return null;
  return (
    <section className="rounded-2xl border border-surface-line bg-surface/60 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-black text-ink">{tf.suggested}</h2>
        <Link href="/dashboard/efootball/coaches" className="text-xs font-semibold text-accent-ink hover:underline">
          {tf.seeAll}
        </Link>
      </div>
      <ul className="mt-3 space-y-3">
        {coaches.map((c) => (
          <SuggestedCoach key={c.userId} id={c.userId} name={c.name} dpUrl={c.dpUrl} headline={c.headline} />
        ))}
      </ul>
    </section>
  );
}
