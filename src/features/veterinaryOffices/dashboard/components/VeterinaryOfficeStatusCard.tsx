import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Icon, type IconName } from '@/components/content';
import { Row } from '@/components/layout';
import { Caption, Text } from '@/components/typography';
import type { FarmSubscriptionStatus, OrganizationStatus } from '@/features/organizations/types';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

export interface VeterinaryOfficeStatusCardProps {
  approvalStatus: OrganizationStatus;
  decisionReason?: string | null;
  /** `undefined` until the office is ACTIVE and the backend has resolved it. */
  subscriptionStatus?: FarmSubscriptionStatus;
  subscriptionEndDate?: string | null;
  /** An open (PENDING) renewal request already exists — server-sourced. */
  hasPendingRenewal?: boolean;
  onRequestRenewal?: () => void;
}

/**
 * The office owner's single, unified status card — covers BOTH the approval
 * state (`Organization.status`) and, once ACTIVE, the subscription state.
 * Mirrors `FarmStatusCard` (`@/features/farmShared`) exactly, kept as a
 * separate component since it reads the `veterinaryOfficeDashboard` i18n
 * namespace with office-specific wording rather than farm's.
 */
export function VeterinaryOfficeStatusCard({
  approvalStatus,
  decisionReason,
  subscriptionStatus,
  subscriptionEndDate,
  hasPendingRenewal,
  onRequestRenewal,
}: VeterinaryOfficeStatusCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryOfficeDashboard');

  if (approvalStatus === 'PENDING') {
    return (
      <StatusBody icon="time-outline" tone="warning" title={t('status.pendingTitle')}>
        <Caption>{t('status.pendingBody')}</Caption>
      </StatusBody>
    );
  }

  if (approvalStatus === 'REJECTED') {
    return (
      <StatusBody icon="close-circle-outline" tone="danger" title={t('status.rejectedTitle')}>
        {decisionReason ? <Caption>{decisionReason}</Caption> : null}
      </StatusBody>
    );
  }

  if (approvalStatus === 'SUSPENDED') {
    return (
      <StatusBody icon="pause-circle-outline" tone="warning" title={t('status.suspendedTitle')}>
        <Caption>{t('status.suspendedBody')}</Caption>
      </StatusBody>
    );
  }

  if (approvalStatus === 'DEACTIVATED') {
    return (
      <StatusBody icon="ban-outline" tone="danger" title={t('status.deactivatedTitle')}>
        <Caption>{t('status.deactivatedBody')}</Caption>
      </StatusBody>
    );
  }

  // ACTIVE approval — subscription state decides the rest.
  if (subscriptionStatus === 'EXPIRED') {
    return (
      <StatusBody
        icon="alert-circle-outline"
        tone="danger"
        title={t('status.subscriptionExpiredTitle')}
      >
        {hasPendingRenewal ? (
          <Caption>{t('status.subscriptionRenewalPending')}</Caption>
        ) : (
          <>
            <Caption>{t('status.subscriptionRenewalCta')}</Caption>
            {onRequestRenewal ? (
              <View style={{ marginTop: theme.spacing.sm, alignItems: 'flex-start' }}>
                <Button
                  label={t('status.requestRenewal')}
                  variant="primary"
                  size="sm"
                  onPress={onRequestRenewal}
                />
              </View>
            ) : null}
          </>
        )}
      </StatusBody>
    );
  }

  if (subscriptionStatus === 'ACTIVE') {
    return (
      <StatusBody icon="checkmark-circle-outline" tone="success" title={t('status.activeTitle')}>
        {subscriptionEndDate ? (
          <Caption>
            {t('status.subscriptionActiveUntil', { date: formatDate(subscriptionEndDate) })}
          </Caption>
        ) : null}
      </StatusBody>
    );
  }

  // NOT_STARTED (or subscription info not applicable/loaded yet) — the office is
  // approved but admin hasn't set a subscription period yet.
  return (
    <StatusBody icon="information-circle-outline" tone="primary" title={t('status.notStartedTitle')}>
      <Caption>{t('status.notStartedBody')}</Caption>
    </StatusBody>
  );
}

function StatusBody({
  icon,
  tone,
  title,
  children,
}: {
  icon: IconName;
  tone: 'warning' | 'danger' | 'success' | 'primary';
  title: string;
  children?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Card variant="outlined" padding="md">
      <Row gap="md">
        <Icon name={icon} size="iconMd" color={tone} />
        <View style={{ flex: 1, rowGap: theme.spacing.xs }}>
          <Text variant="bodyMedium">{title}</Text>
          {children}
        </View>
      </Row>
    </Card>
  );
}
