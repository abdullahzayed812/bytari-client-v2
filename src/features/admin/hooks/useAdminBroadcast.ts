import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { LocalFile, PresignProvider } from '@/services/media';

import { adminApi } from '../api';
import type { SendBroadcastInput, SendBroadcastResult } from '../types';

/** `POST /admin/notifications` — platform-wide "إرسال رسالة" (`notification.admin.send`). */
export function useSendBroadcast(): UseMutationResult<
  SendBroadcastResult,
  unknown,
  SendBroadcastInput
> {
  return useMutation({
    mutationKey: ['admin', 'broadcast', 'send'],
    mutationFn: (input) => adminApi.sendBroadcast(input),
  });
}

/** Presign provider for an admin broadcast photo (`POST /admin/notifications/image-upload-url`). */
export function useAdminBroadcastImageProvider(): PresignProvider {
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file: LocalFile) =>
        adminApi.requestBroadcastImageUploadUrl({
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        }),
    }),
    [],
  );
}
