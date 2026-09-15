import { useMemo } from 'react';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { LocalFile, PresignProvider } from '@/services/media';

import { veterinaryOfficeDashboardApi } from '../api';
import type { SendFollowerBroadcastInput } from '../types';

/** "إرسال رسالة للمتابعين" — send. No cache to invalidate; not a persisted, listable entity. */
export function useSendFollowerBroadcast(
  organizationId: string,
): UseMutationResult<{ broadcastId: string }, unknown, SendFollowerBroadcastInput> {
  return useMutation({
    mutationKey: ['organization-broadcast', 'send', organizationId],
    mutationFn: (body: SendFollowerBroadcastInput) =>
      veterinaryOfficeDashboardApi.sendBroadcast(organizationId, body),
  });
}

/** Presign provider for the broadcast's optional single image, for `<ImageUploader>`. */
export function useBroadcastImageProvider(organizationId: string): PresignProvider {
  return useMemo<PresignProvider>(
    () => ({
      requestUpload: (file: LocalFile) =>
        veterinaryOfficeDashboardApi.requestBroadcastImageUploadUrl(organizationId, {
          filename: file.name,
          mimeType: file.mimeType,
          size: file.size ?? 0,
        }),
    }),
    [organizationId],
  );
}
