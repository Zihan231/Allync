import { useCallback, useEffect, useRef } from "react";
import { markSeen } from "@/lib/api/feed";

const DWELL_MS = 1000;
const FLUSH_MS = 5000;

/**
 * Marks posts as seen once they've been at least 60% on screen for a second, and sends
 * them in batches (and when the page is left), so seen posts sink in later feeds.
 * Returns a ref callback to put on each card (it reads `data-post-id`).
 */
export function useSeenTracker(enabled: boolean) {
  const queue = useRef(new Set<string>());
  const sent = useRef(new Set<string>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const observer = useRef<IntersectionObserver | null>(null);

  const flush = useCallback((keepalive = false) => {
    const ids = [...queue.current].slice(0, 50);
    if (!ids.length) return;
    ids.forEach((id) => {
      queue.current.delete(id);
      sent.current.add(id);
    });
    if (keepalive) {
      // Leaving the page: fire and forget (same-origin /api, the session cookie goes along).
      void fetch("/api/feed/seen", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ postIds: ids }),
        credentials: "include",
        keepalive: true,
      }).catch(() => undefined);
    } else {
      void markSeen(ids).catch(() => ids.forEach((id) => sent.current.delete(id)));
    }
  }, []);

  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === "undefined") return;
    const t = timers.current;
    observer.current = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.postId;
          if (!id || sent.current.has(id) || queue.current.has(id)) continue;
          if (e.isIntersecting && e.intersectionRatio >= 0.6) {
            if (!t.has(id)) t.set(id, setTimeout(() => queue.current.add(id), DWELL_MS));
          } else if (t.has(id)) {
            clearTimeout(t.get(id));
            t.delete(id);
          }
        }
      },
      { threshold: [0, 0.6] },
    );
    const interval = setInterval(() => flush(), FLUSH_MS);
    const onHide = () => document.visibilityState === "hidden" && flush(true);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onHide);
      observer.current?.disconnect();
      t.forEach((timer) => clearTimeout(timer));
      t.clear();
      flush(true);
    };
  }, [enabled, flush]);

  return useCallback((el: HTMLElement | null) => {
    if (el) observer.current?.observe(el);
  }, []);
}
