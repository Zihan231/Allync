"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { youtubeEmbedUrl } from "@/lib/api/coaching";
import { useFeed } from "@/lib/api/hooks/useFeed";
import { Avatar } from "@/components/common/Avatar";
import { HeartIcon, CommentIcon } from "./FeedIcons";

/** YouTube thumbnail for a link, for the compact preview. */
function thumbnailOf(links: string[], media: Array<{ type: string; url: string }>): string | null {
  const image = media.find((m) => m.type === "image");
  if (image) return image.url;
  for (const l of links) {
    const id = youtubeEmbedUrl(l)?.split("/embed/")[1];
    if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  }
  return null;
}

/** "From the feed": the top three posts for this user, compact, on the mode overviews. */
export function FeedPreview() {
  const { t } = useLanguage();
  const tf = t.coaching.feed;
  const { data, isLoading } = useFeed("for_you");
  const items = (data?.pages[0]?.items ?? []).slice(0, 3);
  if (!isLoading && !items.length) return null;

  return (
    <section className="space-y-3" data-testid="feed-preview">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-black text-ink">{tf.preview}</h2>
        <Link href="/dashboard/feed" className="text-sm font-semibold text-accent-ink hover:underline">
          {tf.openFeed} →
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? [0, 1, 2].map((i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-surface-line/40" />)
          : items.map((item) => {
              const thumb = thumbnailOf(item.links, item.media);
              return (
                <Link
                  key={item.id}
                  href={`/dashboard/feed#post-${item.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-surface-line bg-surface/60 transition-colors hover:border-accent/50"
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" loading="lazy" className="aspect-video w-full bg-black object-cover" />
                  ) : null}
                  <div className="flex flex-1 flex-col p-3">
                    <div className="flex items-center gap-2">
                      <Avatar dpUrl={item.coach.dpUrl} name={item.coach.name} size="sm" mode="static" className="!h-7 !w-7 !text-[10px]" />
                      <span className="truncate text-xs font-bold text-ink">{item.coach.name}</span>
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{item.body}</p>
                    <div className="mt-auto flex gap-3 pt-2 text-[11px] text-ink-faint">
                      <span className="flex items-center gap-1">
                        <HeartIcon className="h-3.5 w-3.5" filled={item.likedByMe} /> {item.likeCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <CommentIcon className="h-3.5 w-3.5" /> {item.commentCount}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
