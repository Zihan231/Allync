"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { youtubeEmbedUrl, type CoachPost } from "@/lib/api/coaching";
import { formatShortDate } from "@/components/dashboard/fixtures/labels";
import { StatusPill, type StatusTone } from "@/components/dashboard/StatusPill";
import { Avatar } from "@/components/common/Avatar";
import { TrashIcon } from "@/components/icons";

const STATUS_TONE: Record<CoachPost["status"], StatusTone> = { pending: "warning", approved: "success", rejected: "danger" };

/** Uploaded files are served at `/uploads/...` (proxied to the API, see next.config.ts). */
export function mediaSrc(url: string): string {
  return url;
}

/** A coach's tutorial post: text, YouTube embeds, other links, photos and videos. */
export function CoachPostCard({
  post,
  author,
  showStatus = false,
  onDelete,
}: {
  post: CoachPost;
  author?: { name: string; dpUrl: string | null };
  /** The coach's own view: the review status (and the reason when it wasn't approved). */
  showStatus?: boolean;
  onDelete?: () => void;
}) {
  const { t, locale } = useLanguage();
  const tp = t.coaching.posts;
  const embeds = post.links.map((l) => ({ link: l, embed: youtubeEmbedUrl(l) }));

  return (
    <article className="overflow-hidden rounded-2xl border border-surface-line bg-surface/50" data-testid="coach-post">
      <header className="flex items-center gap-3 px-4 pt-4">
        {author ? <Avatar dpUrl={author.dpUrl} name={author.name} size="sm" mode="static" /> : null}
        <div className="min-w-0 flex-1">
          {author ? <div className="truncate text-sm font-semibold text-ink">{author.name}</div> : null}
          <div className="text-[11px] text-ink-faint">{formatShortDate(post.createdAt, locale)}</div>
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
        <p className="mx-4 mt-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger-ink">
          {format(tp.rejectedBecause, { reason: post.rejectReason })}
        </p>
      ) : null}

      {post.body ? <p className="whitespace-pre-line px-4 pt-3 text-sm leading-relaxed text-ink">{post.body}</p> : null}

      <div className="space-y-3 p-4">
        {embeds.map(({ link, embed }) =>
          embed ? (
            <div key={link} className="aspect-video overflow-hidden rounded-xl border border-surface-line bg-black">
              <iframe
                src={embed}
                title="YouTube video"
                className="h-full w-full"
                loading="lazy"
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <a key={link} href={link} target="_blank" rel="noopener noreferrer nofollow" className="block truncate text-sm text-blue-ink underline">
              {link}
            </a>
          ),
        )}
        {post.media.length ? (
          <div className={`grid gap-2 ${post.media.length > 1 ? "grid-cols-2" : ""}`}>
            {post.media.map((m) =>
              m.type === "video" ? (
                <video key={m.url} src={mediaSrc(m.url)} controls preload="metadata" className="w-full rounded-xl border border-surface-line bg-black" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={m.url} src={mediaSrc(m.url)} alt="" className="w-full rounded-xl border border-surface-line object-cover" />
              ),
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}
