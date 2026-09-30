"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { NotificationEntry } from "@/components/dashboard/NotificationEntry";
import { BellIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/lib/api/notifications";

const PAGE_SIZE = 20;

/** Every notification in full, grouped by day, newest first, with older pages on demand. */
export default function NotificationsPage() {
  const { t, locale } = useLanguage();
  const s = t.dashboard.shell;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSession();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  // Keyed under ["notifications"], so live updates (which invalidate that key) refresh this too.
  const query = useInfiniteQuery({
    queryKey: ["notifications", "page", filter],
    queryFn: ({ pageParam }) =>
      getNotifications({ limit: PAGE_SIZE, before: pageParam, unread: filter === "unread" }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.length === PAGE_SIZE ? last[last.length - 1].createdAt : undefined),
    enabled: isAuthenticated,
  });

  const items = useMemo(() => query.data?.pages.flat() ?? [], [query.data]);
  const hasUnread = items.some((n) => !n.read);

  // Group by calendar day (viewer's time): Today, Yesterday, then dates.
  const groups = useMemo(() => {
    const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const dateFormat = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const byDay = new Map<string, { label: string; items: NotificationItem[] }>();
    for (const n of items) {
      const date = new Date(n.createdAt);
      const key = dayKey(date);
      const label =
        key === dayKey(today) ? s.notificationsToday : key === dayKey(yesterday) ? s.notificationsYesterday : dateFormat.format(date);
      if (!byDay.has(key)) byDay.set(key, { label, items: [] });
      byDay.get(key)!.items.push(n);
    }
    return [...byDay.values()];
  }, [items, locale, s.notificationsToday, s.notificationsYesterday]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    void queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
  };

  async function open(n: NotificationItem) {
    if (!n.read) {
      await markNotificationRead(n.id).catch(() => undefined);
      refresh();
    }
    if (n.link) router.push(n.link);
  }

  async function markAll() {
    await markAllNotificationsRead().catch(() => undefined);
    refresh();
  }

  const tab = (active: boolean) =>
    `rounded-md px-3 py-1.5 font-semibold transition-colors ${active ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"}`;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={s.notificationsPageEyebrow} title={s.notificationsLabel} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center rounded-lg border border-surface-line bg-surface/50 p-1 text-xs">
          <button type="button" onClick={() => setFilter("all")} className={tab(filter === "all")}>
            {s.notificationsFilterAll}
          </button>
          <button type="button" onClick={() => setFilter("unread")} className={tab(filter === "unread")}>
            {s.notificationsFilterUnread}
          </button>
        </div>
        {hasUnread ? (
          <button
            type="button"
            onClick={markAll}
            className="rounded-full border border-surface-line-strong px-3.5 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-accent hover:text-accent-ink"
          >
            {s.notificationsMarkAllRead}
          </button>
        ) : null}
      </div>

      <div className="mt-6">
        {query.isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={BellIcon}
            title={filter === "unread" ? s.notificationsEmptyUnread : s.notificationsEmpty}
            body=""
          />
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.label}>
                <h3 className="mb-2 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                  {group.label}
                </h3>
                <ul className="divide-y divide-surface-line/50 rounded-2xl border border-surface-line bg-surface/50 p-1.5">
                  {group.items.map((n) => (
                    <li key={n.id} className="py-0.5">
                      <NotificationEntry notification={n} onOpen={open} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {query.hasNextPage ? (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => query.fetchNextPage()}
                  disabled={query.isFetchingNextPage}
                  className="rounded-full border border-surface-line-strong px-5 py-2 text-xs font-semibold text-ink-soft transition-colors hover:border-accent hover:text-accent-ink disabled:opacity-50"
                >
                  {query.isFetchingNextPage ? s.notificationsLoading : s.notificationsLoadMore}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
