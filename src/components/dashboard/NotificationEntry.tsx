"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Locale } from "@/lib/i18n/translations";
import type { NotificationItem } from "@/lib/api/notifications";
import { renderNotification } from "@/lib/notifications/renderNotification";

/** "5m ago", "3h ago", "2d ago" — or "Just now" — in the viewer's language. */
export function formatTimeAgo(iso: string, locale: Locale, justNow: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return justNow;
  const rtf = new Intl.RelativeTimeFormat(locale === "bn" ? "bn-BD" : "en", { numeric: "auto", style: "short" });
  const steps: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["minute", 60],
    ["hour", 60],
    ["day", 24],
    ["week", 7],
  ];
  let value = seconds / 60;
  for (let i = 0; i < steps.length; i++) {
    const [unit] = steps[i];
    const next = steps[i + 1];
    if (!next || value < next[1]) return rtf.format(-Math.round(value), unit);
    value /= next[1];
  }
  return rtf.format(-Math.round(value), "week");
}

/**
 * One notification. `compact` (the bell dropdown) shows up to 3 lines with a
 * "Show more" toggle when the text overflows; otherwise the full text shows.
 * Clicking the entry opens its link (and marks it read).
 */
export function NotificationEntry({
  notification: n,
  compact = false,
  onOpen,
}: {
  notification: NotificationItem;
  compact?: boolean;
  onOpen: (notification: NotificationItem) => void;
}) {
  const { t, locale } = useLanguage();
  const s = t.dashboard.shell;
  const { title, message } = renderNotification(n, t, locale);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const messageRef = useRef<HTMLParagraphElement>(null);

  // Only offer "Show more" when the clamped text is actually cut off.
  useLayoutEffect(() => {
    const el = messageRef.current;
    if (!compact || !el || expanded) return;
    setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [compact, expanded, message]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(n)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(n);
      }}
      className={`block cursor-pointer rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        !n.read ? "bg-accent/5" : "opacity-85"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`font-semibold leading-snug ${!n.read ? "text-accent" : "text-ink"}`}>{title}</span>
        <span className="flex shrink-0 items-center gap-1.5 pt-0.5">
          <span className="font-mono text-[10px] text-ink-faint" suppressHydrationWarning>
            {formatTimeAgo(n.createdAt, locale, s.notificationsJustNow)}
          </span>
          {!n.read ? <span className="h-1.5 w-1.5 rounded-full bg-accent" /> : null}
        </span>
      </div>
      <p
        ref={messageRef}
        className={`mt-1 whitespace-pre-line break-words leading-relaxed text-ink-soft ${
          compact && !expanded ? "line-clamp-3" : ""
        }`}
      >
        {message}
      </p>
      {compact && (overflows || expanded) ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="mt-1 inline-flex items-center gap-1 font-semibold text-accent-ink hover:underline"
        >
          {expanded ? s.notificationsShowLess : s.notificationsShowMore}
          <ChevronDownIcon className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      ) : null}
    </div>
  );
}
