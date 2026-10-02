import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useToast } from '@/components/feedback';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';

import { useMessageUserMutation } from '../hooks/useAdminUsers';

import { ReasonPromptDialog } from './ReasonPromptDialog';

/**
 * "مراسلة" from any admin list (job applicants, course registrants, …): the
 * existing Admin → user message (`POST /admin/users/:id/messages`, a SUPPORT
 * thread owned by the user), then continue in that thread — which takes
 * replies with images and links.
 */
export function MessageUserDialog({
  userId,
  onDone,
  onCancel,
}: {
  userId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation('admin');
  const toast = useToast();
  const send = useMessageUserMutation(userId);
  return (
    <ReasonPromptDialog
      visible
      title={t('users.detail.messageTitle')}
      message={t('users.detail.messageBody')}
      label={t('users.detail.messageLabel')}
      placeholder={t('users.detail.messagePlaceholder')}
      confirmLabel={t('users.detail.messageSend')}
      cancelLabel={t('common.cancel')}
      required
      loading={send.isPending}
      onConfirm={(body) =>
        send.mutate(body, {
          onSuccess: (thread) => {
            toast.show({ message: t('users.toast.messageSent'), tone: 'success' });
            onDone();
            router.push(Routes.supportThread('support-messages', thread.id));
          },
          onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
        })
      }
      onCancel={onCancel}
    />
  );
}
