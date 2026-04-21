/**
 * Notifications API Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NotificationsService } from './service';
import { useAuth } from '@/features/auth/model/store';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      return await NotificationsService.getNotifications();
    },
  });
}

export function useUnreadCount() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async (): Promise<number> => {
      const result = await NotificationsService.getUnreadCount();
      return typeof result === 'number' ? result : 0;
    },
    enabled: !!token,
    refetchInterval: 5 * 60 * 1000, // 5 minutes — standard for notification badges
    refetchOnWindowFocus: false,
  });
}

export const useUnreadNotificationsCount = useUnreadCount;

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return await NotificationsService.markAsRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await NotificationsService.markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return await NotificationsService.deleteNotification(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

