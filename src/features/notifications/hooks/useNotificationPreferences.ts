import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/services/api';

import { notificationKeys, notificationsApi } from '../api';
import type { NotificationPreferences } from '../types';

/** The caller's notification preferences (`GET /notifications/preferences`). */
export function useNotificationPreferences() {
  return useQuery<NotificationPreferences, ApiError>({
    queryKey: notificationKeys.preferences(),
    queryFn: () => notificationsApi.getPreferences(),
    staleTime: 30_000,
  });
}

/** Toggle push notifications on/off (`PATCH /notifications/preferences`). */
export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation<NotificationPreferences, ApiError, boolean>({
    mutationKey: ['notifications', 'preferences', 'update'],
    mutationFn: (pushEnabled) => notificationsApi.updatePreferences(pushEnabled),
    onSuccess: (prefs) => qc.setQueryData(notificationKeys.preferences(), prefs),
  });
}
