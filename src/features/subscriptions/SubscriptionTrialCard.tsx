import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, Icon } from '@/components/content';
import { Row } from '@/components/layout';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import type { SubscriptionSubject } from './api';
import { useSubscriptionInfo } from './hooks';
import { SendSubscriptionInfoButton } from './SendSubscriptionInfoButton';

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
 * authorized server-side) and navigates into it — see
 * `SendSubscriptionInfoButton` (confirmation dialog + double-send guard).
 */
export function SubscriptionTrialCard({
  subject,
  organizationId,
  canSend = true,
}: SubscriptionTrialCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const info = useSubscriptionInfo(subject);

  const days = info.data?.freeTrialDays;

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
              <SendSubscriptionInfoButton
                subject={subject}
                organizationId={organizationId}
                size="sm"
              />
            </View>
          ) : null}
        </View>
      </Row>
    </Card>
  );
}
