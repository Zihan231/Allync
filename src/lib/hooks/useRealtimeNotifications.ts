"use client";

import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationRead,
  markAllNotificationsRead,
  NotificationItem,
} from "@/lib/api/notifications";
import { useSession } from "@/lib/session/SessionContext";
import { useToast } from "@/lib/useToast";
import { syncFromBackend } from "@/lib/mock/communityStore";

// The SSE stream pushes new notifications instantly; polling is only a fallback for missed events
// (e.g. while the stream reconnects).
const FALLBACK_POLL_MS = 60_000;

export function useRealtimeNotifications() {
  const { isAuthenticated, user } = useSession();
  const queryClient = useQueryClient();
  const { toasts, toast, dismiss } = useToast();

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: isAuthenticated,
    refetchInterval: FALLBACK_POLL_MS,
    staleTime: 3000,
  });

  const unreadCountQuery = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: getUnreadNotificationsCount,
    enabled: isAuthenticated,
    refetchInterval: FALLBACK_POLL_MS,
    staleTime: 3000,
  });

  // Server-Sent Events (SSE) connection for real-time notification push
  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/notifications/stream", {
        withCredentials: true,
      });

      eventSource.onmessage = (event) => {
        try {
          const notif: NotificationItem = JSON.parse(event.data);
          if (notif && notif.title) {
            toast(`${notif.title}: ${notif.message}`, "info");
            void queryClient.invalidateQueries({ queryKey: ["notifications"] });
            void queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });

            // Refresh only what this kind of notification can have changed.
            if (notif.type === "club_join_request") {
              void queryClient.invalidateQueries({ queryKey: ["club-my-request"] });
              void queryClient.invalidateQueries({ queryKey: ["club-requests"] });
            } else if (notif.type === "community_join_request") {
              void queryClient.invalidateQueries({ queryKey: ["community-my-request"] });
              void queryClient.invalidateQueries({ queryKey: ["community-requests"] });
            }
            // Approvals and new club members change club/community rosters, which the
            // client-side store also caches — only then is a full store resync worth it.
            if (notif.type === "club_member_joined" || /approved/i.test(notif.title)) {
              void queryClient.invalidateQueries({ queryKey: ["me"] });
              void queryClient.invalidateQueries({ queryKey: ["clubs"] });
              void queryClient.invalidateQueries({ queryKey: ["communities"] });
              void syncFromBackend(true);
            }
          }
        } catch (err) {
          console.error("Failed to parse incoming notification event:", err);
        }
      };

      eventSource.onerror = () => {
        // Will auto-reconnect; 5s polling keeps it synced
      };
    } catch (err) {
      console.warn("SSE connection error:", err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isAuthenticated, queryClient, toast]);

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await markNotificationRead(id);
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        void queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    },
    [queryClient]
  );

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  }, [queryClient]);

  const notifications = notificationsQuery.data || [];
  const unreadCount = unreadCountQuery.data?.unreadCount ?? notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    isLoading: notificationsQuery.isLoading,
    markAsRead,
    markAllRead,
    refetch: notificationsQuery.refetch,
    toasts,
    toast,
    dismiss,
  };
}
