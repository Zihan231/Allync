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

export function useRealtimeNotifications() {
  const { isAuthenticated, user } = useSession();
  const queryClient = useQueryClient();
  const { toasts, toast, dismiss } = useToast();

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: isAuthenticated,
    refetchInterval: 5000,
    staleTime: 3000,
  });

  const unreadCountQuery = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: getUnreadNotificationsCount,
    enabled: isAuthenticated,
    refetchInterval: 5000,
    staleTime: 3000,
  });

  // Server-Sent Events (SSE) connection for real-time notification push
  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/v1/notifications/stream", {
        withCredentials: true,
      });

      eventSource.onmessage = (event) => {
        try {
          const notif: NotificationItem = JSON.parse(event.data);
          if (notif && notif.title) {
            toast(`${notif.title}: ${notif.message}`, "info");
            void queryClient.invalidateQueries({ queryKey: ["notifications"] });
            void queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
            void queryClient.invalidateQueries({ queryKey: ["community-my-request"] });
            void queryClient.invalidateQueries({ queryKey: ["club-my-request"] });
            void queryClient.invalidateQueries({ queryKey: ["community-requests"] });
            void queryClient.invalidateQueries({ queryKey: ["club-requests"] });
            void queryClient.invalidateQueries({ queryKey: ["community"] });
            void queryClient.invalidateQueries({ queryKey: ["club"] });
            void queryClient.invalidateQueries({ queryKey: ["me"] });
            void syncFromBackend(true);
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
