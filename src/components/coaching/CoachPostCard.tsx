"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { youtubeEmbedUrl, type CoachPost, type CoachPostMedia } from "@/lib/api/coaching";
import { formatShortDate } from "@/components/dashboard/fixtures/labels";
import { StatusPill, type StatusTone } from "@/components/dashboard/StatusPill";
import { Avatar } from "@/components/common/Avatar";
import { TrashIcon } from "@/components/icons";

const STATUS_TONE: Record<CoachPost["status"], StatusTone> = { pending: "warning", approved: "success", rejected: "danger" };
const LONG_POST = 320;

/** Uploaded files are served at `/uploads/...` (proxied to the API, see next.config.ts). */
export function mediaSrc(url: string): string {
  return url;
}

const hostOf = (link: string) => {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return link;
  }
};

/** Photos and videos laid out like a social feed: 1 full width, 2 side by side, 3 one big + two, 4 a grid. */
function MediaGrid({ media }: { media: CoachPostMedia[] }) {
  const { t } = useLanguage();
  const shown = media.slice(0, 4);
  const extra = media.length - shown.length;
  const tile = (m: CoachPostMedia, className: string, overlay?: number) => (
    <div key={m.url} className={`relative overflow-hidden bg-black ${className}`}>
      {m.type === "video" ? (
        <video src={mediaSrc(m.url)} controls preload="metadata" className="h-full w-full object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaSrc(m.url)} alt="" className="h-full w-full object-cover" loading="lazy" />
      )}
      {overlay ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 font-display text-3xl font-black text-white">
          {format(t.coaching.page.morePhotos, { n: overlay })}
        </div>
      ) : null}
    </div>
  );
  if (shown.length === 1) return <div className="max-h-[520px] overflow-hidden">{tile(shown[0], "max-h-[520px]")}</div>;
  if (shown.length === 2) return <div className="grid grid-cols-2 gap-0.5">{shown.map((m) => tile(m, "aspect-square"))}</div>;
  if (shown.length === 3)
    return (
      <div className="grid grid-cols-2 gap-0.5">
        {tile(shown[0], "row-span-2 aspect-[1/2] h-full")}
        {tile(shown[1], "aspect-square")}
        {tile(shown[2], "aspect-square")}
      </div>
    );
  return <div className="grid grid-cols-2 gap-0.5">{shown.map((m, i) => tile(m, "aspect-square", i === 3 && extra > 0 ? extra : undefined))}</div>;
}

/** A coach's tutorial post, styled like a social feed post: author, text, video, photos, links, actions. */
export function CoachPostCard({
  post,
  author,
  showStatus = false,
  onDelete,
  shareUrl,
  onShared,
}: {
  post: CoachPost;
  author?: { name: string; dpUrl: string | null };
  /** The coach's own view: the review status (and the reason when it wasn't approved). */
  showStatus?: boolean;
  onDelete?: () => void;
  /** Adds a Share button that copies this link. */
  shareUrl?: string;
  onShared?: () => void;
}) {
  const { t, locale } = useLanguage();
  const tp = t.coaching.posts;
  const tg = t.coaching.page;
  const [expanded, setExpanded] = useState(false);
  const embeds = post.links.map((link) => ({ link, embed: youtubeEmbedUrl(link) }));
  const firstYoutube = post.links.find((l) => /youtu\.?be/.test(l));
  const long = post.body.length > LONG_POST;
  const text = long && !expanded ? `${post.body.slice(0, LONG_POST).trimEnd()}…` : post.body;
  const name = author?.name ?? post.coach?.name ?? "Coach";
  const dp = author?.dpUrl ?? post.coach?.dpUrl ?? null;

  return (
    <article id={`post-${post.id}`} className="overflow-hidden rounded-2xl border border-surface-line bg-surface/60 shadow-sm" data-testid="coach-post">
      <header className="flex items-start gap-3 px-4 pt-4">
        <Avatar dpUrl={dp} name={name} size="sm" mode="static" className="!h-10 !w-10" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-ink">{name}</div>
          <div className="flex flex-wrap items-center gap-1 text-[11px] text-ink-faint">
            <span>{formatShortDate(post.createdAt, locale)}</span>
            <span>·</span>
            <span>{post.status === "approved" ? `🌐 ${tg.publicPost}` : tg.inReview}</span>
          </div>
        </div>
        {showStatus ? <StatusPill tone={STATUS_TONE[post.status]}>{tp.status[post.status]}</StatusPill> : null}
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            aria-label={tp.delete}
            title={tp.delete}
            className="rounded-full p-1.5 text-ink-faint hover:bg-danger-soft hover:text-danger-ink"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        ) : null}
      </header>

      {showStatus && post.status === "rejected" && post.rejectReason ? (
        <p className="mx-4 mt-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger-ink">{format(tp.rejectedBecause, { reason: post.rejectReason })}</p>
      ) : null}

      {post.body ? (
        <div className="px-4 pt-3 text-[15px] leading-relaxed text-ink">
          <p className="whitespace-pre-line">{text}</p>
          {long ? (
            <button type="button" onClick={() => setExpanded(!expanded)} className="mt-1 text-sm font-semibold text-ink-soft hover:underline">
              {expanded ? tg.seeLess : tg.seeMore}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Videos and photos run edge to edge, like a feed. */}
      <div className="mt-3 space-y-0.5">
        {embeds
          .filter((e) => e.embed)
          .map(({ link, embed }) => (
            <div key={link} className="aspect-video bg-black">
              <iframe
                src={embed!}
                title="YouTube video"
                className="h-full w-full"
                loading="lazy"
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ))}
        {post.media.length ? <MediaGrid media={post.media} /> : null}
      </div>

      {embeds
        .filter((e) => !e.embed)
        .map(({ link }) => (
          <a
            key={link}
            href={link}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mx-4 mt-3 block rounded-xl border border-surface-line bg-bg/50 px-3 py-2.5 hover:border-accent/50"
          >
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{hostOf(link)}</div>
            <div className="truncate text-sm font-semibold text-ink">{link}</div>
          </a>
        ))}

      {firstYoutube || shareUrl ? (
        <footer className="mt-3 flex border-t border-surface-line">
          {firstYoutube ? (
            <a
              href={firstYoutube}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex flex-1 items-center justify-center gap-2 py-2.5 text-xs font-semibold text-ink-soft hover:bg-surface hover:text-ink"
            >
              <span className="text-danger-ink">▶</span> {tg.watchOnYoutube}
            </a>
          ) : null}
          {shareUrl ? (
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard?.writeText(`${window.location.origin}${shareUrl}#post-${post.id}`).catch(() => undefined);
                onShared?.();
              }}
              className="flex flex-1 items-center justify-center gap-2 py-2.5 text-xs font-semibold text-ink-soft hover:bg-surface hover:text-ink"
            >
              ↗ {tg.share}
            </button>
          ) : null}
        </footer>
      ) : (
        <div className="h-4" />
      )}
    </article>
  );
}
