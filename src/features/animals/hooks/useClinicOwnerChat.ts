import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useToast } from '@/components/feedback';
import { Routes } from '@/constants/routes';
import { useConversations, useSetClinicChatActive, useStartConversation } from '@/features/chat';
import { apiErrorMessage } from '@/lib/apiError';

/**
 * Legacy clinic pet page "محادثة المالك" + "إيقاف / تفعيل المحادثة". The
 * conversation is the v2 one-per-(clinic, owner) PET_OWNER_CLINIC chat; it is
 * created only when the clinic first opens or pauses it — never just by
 * viewing the page.
 */
export function useClinicOwnerChat(organizationId: string, ownerUserId: string | undefined) {
  const { t } = useTranslation('orgAnimals');
  const toast = useToast();
  const conversations = useConversations({ organizationId, enabled: Boolean(ownerUserId) });
  const start = useStartConversation();
  const toggle = useSetClinicChatActive();

  const existing = useMemo(
    () =>
      ownerUserId
        ? conversations.conversations.find(
            (c) => c.type === 'PET_OWNER_CLINIC' && c.counterpartUserId === ownerUserId,
          )
        : undefined,
    [conversations.conversations, ownerUserId],
  );
  const paused = existing?.status === 'CLOSED';
  const busy = start.isPending || toggle.isPending;
  const onError = (error: unknown) =>
    toast.show({ tone: 'danger', message: apiErrorMessage(error) });

  const ensureConversation = (then: (conversationId: string) => void) => {
    if (!ownerUserId) return;
    if (existing) return then(existing.id);
    start.mutate(
      { organizationId, targetUserId: ownerUserId },
      { onSuccess: (c) => then(c.id), onError },
    );
  };

  const openChat = () => ensureConversation((id) => router.push(Routes.chatThread(id)));

  const togglePaused = () =>
    ensureConversation((id) =>
      toggle.mutate(
        { conversationId: id, active: paused },
        {
          onSuccess: (c) =>
            toast.show({
              tone: 'success',
              message: c.status === 'CLOSED' ? t('detail.chatPaused') : t('detail.chatResumed'),
            }),
          onError,
        },
      ),
    );

  return { paused, busy, openChat, togglePaused };
}
