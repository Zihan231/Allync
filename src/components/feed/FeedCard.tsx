"use client";

import { memo, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import type { FeedComment, FeedItem } from "@/lib/api/feed";
import { useAddComment, useComments, useDeleteComment, useToggleFollow, useToggleLike, useToggleSave } from "@/lib/api/hooks/useFeed";
import { Avatar } from "@/components/common/Avatar";
import { formatShortDate } from "@/components/dashboard/fixtures/labels";
import { PostBody } from "@/components/coaching/CoachPostCard";
import { BookmarkIcon, CommentIcon, HeartIcon, ShareIcon } from "./FeedIcons";

/** "5m", "3h", "2d", or the date for older posts. */
function timeAgo(iso: string, locale: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
  return formatShortDate(iso, locale as "en" | "bn");
}

function CommentRow({ c, onDelete, canDelete }: { c: FeedComment; onDelete: () => void; canDelete: boolean }) {
  const { t, locale } = useLanguage();
  return (
    <li className="group flex items-start gap-2">
      <Avatar dpUrl={c.user.dpUrl} name={c.user.name} size="sm" mode="static" className="!h-7 !w-7 !text-[10px]" />
      <div className="min-w-0 flex-1">
        <div className="inline-block max-w-full rounded-2xl bg-bg/70 px-3 py-1.5">
          <div className="text-xs font-bold text-ink">{c.user.name}</div>
          <p className="whitespace-pre-line break-words text-sm text-ink">{c.body}</p>
        </div>
        <div className="mt-0.5 flex gap-3 px-3 text-[11px] text-ink-faint">
          <span>{timeAgo(c.createdAt, locale)}</span>
          {canDelete ? (
            <button type="button" onClick={onDelete} className="font-semibold hover:text-danger-ink">
              {t.coaching.feed.deleteComment}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/** One post in the feed: coach + follow, content, counts, like / comment / save / share, and comments. */
export const FeedCard = memo(function FeedCard({
  item,
  seenRef,
  onToast,
}: {
  item: FeedItem;
  /** Registers the card with the "seen" tracker. */
  seenRef?: (el: HTMLElement | null) => void;
  onToast?: (message: string, variant?: "success" | "error") => void;
}) {
  const { t, locale } = useLanguage();
  const tf = t.coaching.feed;
  const { user, isAuthenticated } = useSession();
  const like = useToggleLike();
  const save = useToggleSave();
  const follow = useToggleFollow();
  const add = useAddComment(item.id);
  const del = useDeleteComment(item.id);
  const [showAll, setShowAll] = useState(false);
  const [draft, setDraft] = useState("");
  const [burst, setBurst] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const thread = useComments(item.id, showAll);
  const own = user.id === item.coach.id;
  const coachHref = `/dashboard/efootball/coaches/${item.coach.id}`;

  const needSignIn = () => {
    if (isAuthenticated) return false;
    onToast?.(tf.signInToReact, "error");
    return true;
  };
  const toggleLike = () => {
    if (needSignIn()) return;
    if (!item.likedByMe) {
      setBurst(true);
      setTimeout(() => setBurst(false), 450);
    }
    like.mutate({ id: item.id, on: !item.likedByMe });
  };
  const submit = async () => {
    const body = draft.trim();
    if (!body || needSignIn()) return;
    setDraft("");
    try {
      await add.mutateAsync(body);
    } catch {
      setDraft(body);
      onToast?.(t.coaching.deals.errGeneric, "error");
    }
  };
  const share = async () => {
    const url = `${window.location.origin}${coachHref}#post-${item.id}`;
    try {
      if (navigator.share) await navigator.share({ title: item.coach.name, url });
      else {
        await navigator.clipboard.writeText(url);
        onToast?.(t.coaching.page.copied, "success");
      }
    } catch {
      /* dismissed */
    }
  };

  const allComments = showAll ? (thread.data?.pages ?? []).slice().reverse().flatMap((p) => p.items) : item.comments;
  const action = "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-colors hover:bg-bg/60 active:scale-95";

  return (
    <article
      ref={seenRef}
      data-post-id={item.id}
      id={`post-${item.id}`}
      data-testid="feed-card"
      className="-mx-4 border-y border-surface-line bg-surface/60 [contain-intrinsic-size:auto_640px] [content-visibility:auto] sm:mx-0 sm:rounded-2xl sm:border"
    >
      <header className="flex items-center gap-3 px-4 pt-4">
        <Link href={coachHref} className="shrink-0">
          <Avatar dpUrl={item.coach.dpUrl} name={item.coach.name} size="sm" mode="static" className="!h-10 !w-10" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={coachHref} className="block truncate text-sm font-bold text-ink hover:underline">
            {item.coach.name}
          </Link>
          <div className="truncate text-[11px] text-ink-faint">
            {item.coach.headline ? `${item.coach.headline} · ` : ""}
            {timeAgo(item.createdAt, locale)} · 🌐
          </div>
        </div>
        {!own && isAuthenticated ? (
          <button
            type="button"
            onClick={() => follow.mutate({ coachId: item.coach.id, on: !item.coach.followedByMe })}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
              item.coach.followedByMe ? "border border-surface-line-strong text-ink-soft" : "bg-accent text-bg hover:brightness-110"
            }`}
          >
            {item.coach.followedByMe ? tf.following : `+ ${tf.follow}`}
          </button>
        ) : null}
      </header>

      <div onDoubleClick={() => !item.likedByMe && toggleLike()}>
        <PostBody body={item.body} links={item.links} media={item.media} />
      </div>

      {item.likeCount || item.commentCount ? (
        <div className="flex items-center justify-between px-4 pt-3 text-xs text-ink-faint">
          <span className="flex items-center gap-1">
            {item.likeCount ? (
              <>
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-danger text-white">
                  <HeartIcon className="h-2.5 w-2.5" filled />
                </span>
                {item.likeCount === 1 ? tf.oneLike : format(tf.likes, { n: item.likeCount })}
              </>
            ) : null}
          </span>
          {item.commentCount ? (
            <button type="button" onClick={() => setShowAll(true)} className="hover:underline">
              {item.commentCount === 1 ? tf.oneComment : format(tf.comments, { n: item.commentCount })}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mx-2 mt-2 flex border-t border-surface-line pt-1">
        <button
          type="button"
          onClick={toggleLike}
          aria-pressed={item.likedByMe}
          className={`${action} ${item.likedByMe ? "text-danger-ink" : "text-ink-soft"}`}
        >
          <HeartIcon className={`h-5 w-5 transition-transform ${burst ? "scale-125" : ""}`} filled={item.likedByMe} />
          <span className="hidden min-[380px]:inline">{tf.like}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (needSignIn()) return;
            input.current?.focus();
          }}
          className={`${action} text-ink-soft`}
        >
          <CommentIcon />
          <span className="hidden min-[380px]:inline">{tf.comment}</span>
        </button>
        <button
          type="button"
          onClick={() => !needSignIn() && save.mutate({ id: item.id, on: !item.savedByMe })}
          aria-pressed={item.savedByMe}
          className={`${action} ${item.savedByMe ? "text-accent-ink" : "text-ink-soft"}`}
        >
          <BookmarkIcon filled={item.savedByMe} />
          <span className="hidden min-[380px]:inline">{item.savedByMe ? tf.saved : tf.save}</span>
        </button>
        <button type="button" onClick={share} className={`${action} text-ink-soft`}>
          <ShareIcon />
          <span className="hidden min-[380px]:inline">{tf.share}</span>
        </button>
      </div>

      <div className="space-y-2 px-4 pb-4 pt-2">
        {!showAll && item.commentCount > item.comments.length ? (
          <button type="button" onClick={() => setShowAll(true)} className="text-xs font-semibold text-ink-soft hover:underline">
            {format(tf.viewAllComments, { n: item.commentCount })}
          </button>
        ) : null}
        {showAll && thread.hasNextPage ? (
          <button
            type="button"
            onClick={() => thread.fetchNextPage()}
            disabled={thread.isFetchingNextPage}
            className="text-xs font-semibold text-ink-soft hover:underline"
          >
            {tf.olderComments}
          </button>
        ) : null}
        {allComments.length ? (
          <ul className="space-y-2">
            {allComments.map((c) => (
              <CommentRow key={c.id} c={c} canDelete={c.mine || own || Boolean(user.systemRole)} onDelete={() => del.mutate(c.id)} />
            ))}
          </ul>
        ) : null}
        {isAuthenticated ? (
          <div className="flex items-end gap-2 pt-1">
            <Avatar dpUrl={user.dpUrl} name={user.name} size="sm" mode="static" className="!h-8 !w-8 !text-[10px]" />
            <div className="flex flex-1 items-end gap-2 rounded-2xl bg-bg/70 px-3 py-1.5">
              <textarea
                ref={input}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submit();
                  }
                }}
                rows={1}
                maxLength={1000}
                placeholder={tf.writeComment}
                aria-label={tf.writeComment}
                className="max-h-28 min-h-[28px] flex-1 resize-none bg-transparent py-1 text-sm text-ink outline-none placeholder:text-ink-faint"
              />
              {draft.trim() ? (
                <button type="button" onClick={submit} disabled={add.isPending} className="pb-1 text-sm font-bold text-accent-ink disabled:opacity-50">
                  {tf.send}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
});
