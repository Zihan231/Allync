"use client";

import { useCallback, useEffect, useRef } from "react";
import { sendImpressions } from "@/lib/api/sponsors";

/** Views and clicks waiting to be sent, per sponsorship (shared by every tracked logo and banner). */
const queue = new Map<string, { views: number; clicks: number }>();
let timer: ReturnType<typeof setInterval> | null = null;

function flush() {
  if (!queue.size) return;
  const items = [...queue.entries()].slice(0, 50).map(([sponsorshipId, n]) => ({ sponsorshipId, ...n }));
  items.forEach((i) => queue.delete(i.sponsorshipId));
  void sendImpressions(items).catch(() => undefined);
}

function bump(id: string, kind: "views" | "clicks") {
  const entry = queue.get(id) ?? { views: 0, clicks: 0 };
  entry[kind] += 1;
  queue.set(id, entry);
  if (!timer && typeof window !== "undefined") {
    timer = setInterval(flush, 10_000);
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush());
  }
}

/**
 * Sponsor stats: a logo or banner counts one view when at least half of it has been on
 * screen for a second (once per page view), and a click when it's clicked.
 */
export function useSponsorImpression(sponsorshipId: string | undefined) {
  const ref = useRef<HTMLElement | null>(null);
  const seen = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !sponsorshipId || seen.current) return;
    let wait: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          wait = setTimeout(() => {
            seen.current = true;
            bump(sponsorshipId, "views");
            observer.disconnect();
          }, 1000);
        } else if (wait) {
          clearTimeout(wait);
          wait = null;
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (wait) clearTimeout(wait);
    };
  }, [sponsorshipId]);

  const onClick = useCallback(() => {
    if (sponsorshipId) bump(sponsorshipId, "clicks");
  }, [sponsorshipId]);

  return { ref, onClick };
}
