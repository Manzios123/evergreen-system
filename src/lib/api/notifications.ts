import { api } from './api';

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  entity_type?: string | null;
  entity_id?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: NotificationItem[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export const notificationsApi = {
  list: (limit = 10) => api.get<NotificationListResponse>('/notifications', { limit }),
  unreadCount: () => api.get<{ success: boolean; count: number }>('/notifications/unread-count'),
  markRead: (id: string) => api.patch<{ success: boolean }>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<{ success: boolean }>('/notifications/mark-all-read'),
};
