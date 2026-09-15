import { useMutation, type UseMutationResult } from '@tanstack/react-query';

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
