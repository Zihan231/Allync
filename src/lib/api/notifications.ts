import { api } from "./axios";

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const res = await api.get<NotificationItem[]>("/notifications");
  return res.data;
}

export async function getUnreadNotificationsCount(): Promise<{ unreadCount: number }> {
  const res = await api.get<{ unreadCount: number }>("/notifications/unread-count");
  return res.data;
}

export async function markNotificationRead(id: string): Promise<NotificationItem> {
  const res = await api.patch<NotificationItem>(`/notifications/${id}/read`);
  return res.data;
}

export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
  const res = await api.patch<{ success: boolean }>("/notifications/read-all");
  return res.data;
}
