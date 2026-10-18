import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, type ButtonProps } from '@/components/actions';
import { ConfirmationDialog, useToast } from '@/components/feedback';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';

import type { SubscriptionSubject } from './api';
import { useSendSubscriptionInfoRequest } from './hooks';

export interface SendSubscriptionInfoButtonProps extends Pick<
  ButtonProps,
  'variant' | 'size' | 'fullWidth' | 'leftIcon'
> {
  subject: SubscriptionSubject;
  /** The organization (clinic / office / farm); omitted for a trader. */
  organizationId?: string;
  /** Defaults to "إرسال معلومات الاشتراك". */
  label?: string;
}

/**
 * "إرسال معلومات الاشتراك" — the one send-subscription-info action, shared by
 * the free-trial card and the expired-clinic "التواصل مع الإدارة" button.
 * `POST /subscriptions/info-requests` (authorized server-side) opens a support
 * conversation with the administration; on success we navigate into it.
 *
 * Sending is confirmed first: the button only opens a dialog; nothing is sent
 * until "إرسال" is pressed there, and cancelling / dismissing sends nothing.
 * A ref guard + the pending state block a double tap from sending twice.
 */
export function SendSubscriptionInfoButton({
  subject,
  organizationId,
  label,
  variant = 'outline',
  size,
  fullWidth,
  leftIcon = 'paper-plane-outline',
}: SendSubscriptionInfoButtonProps) {
  const { t } = useTranslation('common');
  const toast = useToast();
  const send = useSendSubscriptionInfoRequest();
  const [confirming, setConfirming] = useState(false);
  const inFlight = useRef(false);

  const confirmSend = () => {
    if (inFlight.current) return;
    inFlight.current = true;
    send.mutate(
      { subject, organizationId },
      {
        onSuccess: ({ threadId }) => {
          setConfirming(false);
          toast.show({ tone: 'success', message: t('subscription.sent') });
          router.push(Routes.supportThread('support-messages', threadId));
        },
        // Keep the dialog open so the user can retry or cancel.
        onError: (e) =>
          toast.show({
            tone: 'danger',
            message: `${t('subscription.sendFailed')} ${apiErrorMessage(e)}`,
          }),
        onSettled: () => {
          inFlight.current = false;
        },
      },
    );
  };

  return (
    <>
      <Button
        label={label ?? t('subscription.sendInfo')}
        leftIcon={leftIcon}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        loading={send.isPending}
        disabled={send.isPending}
        onPress={() => setConfirming(true)}
      />
      <ConfirmationDialog
        visible={confirming}
        title={t('subscription.confirmTitle')}
        message={t('subscription.confirmBody')}
        confirmLabel={t('subscription.confirmCta')}
        cancelLabel={t('subscription.confirmCancel')}
        loading={send.isPending}
        onConfirm={confirmSend}
        onCancel={() => {
          if (!send.isPending) setConfirming(false);
        }}
      />
    </>
  );
}
