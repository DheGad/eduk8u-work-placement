import apiClient from '@/api/client';
import type { ApiResponse, PaginatedResponse, Notification, NotificationFilters } from '@/types';

/**
 * Fetch a paginated list of notifications for the current user.
 */
export async function listNotifications(
  filters: NotificationFilters = {},
): Promise<PaginatedResponse<Notification>> {
  const { data } = await apiClient.get<PaginatedResponse<Notification>>(
    '/notifications',
    { params: filters },
  );
  return data;
}

/**
 * Fetch the count of unread notifications.
 */
export async function getUnreadCount(): Promise<{ count: number }> {
  const { data } = await apiClient.get<ApiResponse<{ count: number }>>(
    '/notifications/unread-count',
  );
  return data.data;
}

/**
 * Mark a specific notification as read.
 */
export async function markNotificationRead(id: string): Promise<Notification> {
  const { data } = await apiClient.patch<ApiResponse<Notification>>(
    `/notifications/${id}/read`,
  );
  return data.data;
}

/**
 * Mark all notifications as read for the current user.
 */
export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  const { data } = await apiClient.post<ApiResponse<{ updated: number }>>(
    '/notifications/mark-all-read',
  );
  return data.data;
}

/**
 * Delete a notification.
 */
export async function deleteNotification(id: string): Promise<void> {
  await apiClient.delete(`/notifications/${id}`);
}
