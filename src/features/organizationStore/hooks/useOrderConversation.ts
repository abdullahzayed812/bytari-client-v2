import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { useToast } from '@/components/feedback';
import { Routes } from '@/constants/routes';
import { chatKeys } from '@/features/chat/api';
import type { Conversation } from '@/features/chat/types';
import { apiErrorMessage } from '@/lib/apiError';
import type { ApiError } from '@/services/api';

import { organizationStoreService } from '../api';

/**
 * "إرسال رسالة" on an order page: opens (or reuses) the existing customer ↔
 * store conversation through the order-scoped endpoint — the server checks the
 * order belongs to the caller (customer) or to this store (seller with
 * `store.order.read`) — then navigates to the chat thread.
 */
export function useOrderConversation(
  target:
    | { side: 'CUSTOMER'; orderId: string }
    | { side: 'SELLER'; organizationId: string; orderId: string },
) {
  const qc = useQueryClient();
  const toast = useToast();
  const m = useMutation<Conversation, ApiError, void>({
    mutationKey: ['org-store', 'order-conversation', target.orderId],
    mutationFn: () =>
      target.side === 'CUSTOMER'
        ? organizationStoreService.openMyOrderConversation(target.orderId)
        : organizationStoreService.openIncomingOrderConversation(
            target.organizationId,
            target.orderId,
          ),
    onSuccess: (conversation) => {
      void qc.invalidateQueries({ queryKey: chatKeys.lists() });
      router.push(Routes.chatThread(conversation.id));
    },
    onError: (e) => toast.show({ tone: 'danger', message: apiErrorMessage(e) }),
  });
  return { open: () => (m.isPending ? undefined : m.mutate()), isPending: m.isPending };
}
