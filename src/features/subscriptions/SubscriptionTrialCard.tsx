import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Icon } from '@/components/content';
import { ConfirmationDialog, useToast } from '@/components/feedback';
import { Row } from '@/components/layout';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import type { SubscriptionSubject } from './api';
import { useSendSubscriptionInfoRequest, useSubscriptionInfo } from './hooks';

export interface SubscriptionTrialCardProps {
  subject: SubscriptionSubject;
  /** The organization (clinic / office / farm); omitted for a trader. */
  organizationId?: string;
  /** Show "إرسال معلومات الاشتراك" — only for whoever manages the subscription. */
  canSend?: boolean;
}

/**
 * "الفترة المجانية" + "إرسال معلومات الاشتراك" — shared by clinics, offices,
 * poultry / sheep / cattle farms and poultry-market traders. The trial length
 * comes from the server (`GET /subscriptions/info`); sending opens a support
 * conversation with the administration (`POST /subscriptions/info-requests`,
 * authorized server-side) and navigates into it.
 *
 * Sending is confirmed first: the button only opens a dialog; nothing is sent
 * until "إرسال" is pressed there, and cancelling / dismissing sends nothing.
 * A ref guard + the pending state block a double tap from sending twice.
 */
export function SubscriptionTrialCard({
  subject,
  organizationId,
  canSend = true,
}: SubscriptionTrialCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const toast = useToast();
  const info = useSubscriptionInfo(subject);
  const send = useSendSubscriptionInfoRequest();
  const [confirming, setConfirming] = useState(false);
  const inFlight = useRef(false);

  const days = info.data?.freeTrialDays;

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
    <Card variant="outlined" padding="md">
      <Row gap="md">
        <Icon name="gift-outline" size="iconMd" color="success" />
        <View style={{ flex: 1, rowGap: theme.spacing.xs }}>
          <Text variant="bodyMedium">{t('subscription.trialTitle')}</Text>
          <Caption>
            {days === undefined
              ? t('subscription.trialLoading')
              : days > 0
                ? t('subscription.trialBody', { count: days })
                : t('subscription.trialNone')}
          </Caption>
          <Caption color="textSecondary">{t('subscription.trialHow')}</Caption>
          {canSend ? (
            <View style={{ marginTop: theme.spacing.sm, alignItems: 'flex-start' }}>
              <Button
                label={t('subscription.sendInfo')}
                leftIcon="paper-plane-outline"
                variant="outline"
                size="sm"
                loading={send.isPending}
                disabled={send.isPending}
                onPress={() => setConfirming(true)}
              />
            </View>
          ) : null}
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
        </View>
      </Row>
    </Card>
  );
}
