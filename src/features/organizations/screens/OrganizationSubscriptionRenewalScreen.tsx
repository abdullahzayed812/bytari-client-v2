import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Card } from '@/components/content';
import { ErrorState, Loading, useToast } from '@/components/feedback';
import { Input } from '@/components/forms';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import type { RenewalRequestStatus } from '@/features/farm/types';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { useOrganization } from '../hooks/useOrganization';
import {
  useOrganizationSubscriptionRenewals,
  useRequestOrganizationRenewal,
} from '../hooks/useOrganizationSubscription';

function statusTone(s: RenewalRequestStatus): 'success' | 'warning' | 'danger' {
  if (s === 'APPROVED') return 'success';
  if (s === 'REJECTED') return 'danger';
  return 'warning';
}

/**
 * Route `/organizations/[organizationId]/subscription-renewal` — a
 * VETERINARY_OFFICE / CLINIC owner requests a subscription renewal. Mirrors
 * `FarmSubscriptionRenewalScreen` (`@/features/farmShared`) exactly, hitting
 * the generalized `/organizations/:id/subscription-renewals` backend route
 * instead of the farm-only one. Farm's own screen/route is untouched.
 */
export default function OrganizationSubscriptionRenewalScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const detail = useOrganization(orgId);
  const renewals = useOrganizationSubscriptionRenewals(orgId);
  const submit = useRequestOrganizationRenewal(orgId);
  const [note, setNote] = useState('');

  const previousEndDate = detail.data?.details.subscriptionEndDate ?? null;

  const onSubmit = (): void => {
    submit.mutate(
      { note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('renewal.success') });
          router.back();
        },
        onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
      },
    );
  };

  return (
    <ScrollScreen>
      <AppHeader title={t('renewal.title')} showBack />

      {detail.isLoading ? (
        <Loading fill />
      ) : detail.isError ? (
        <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />
      ) : (
        <>
          <Section spacing="lg">
            <Caption>{t('renewal.intro')}</Caption>
          </Section>

          {previousEndDate ? (
            <Section spacing="lg">
              <Card variant="outlined" padding="md">
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Caption>{t('renewal.previousEndDateLabel')}</Caption>
                  <Text variant="bodyMedium">{formatDate(previousEndDate)}</Text>
                </View>
              </Card>
            </Section>
          ) : null}

          {renewals.hasPendingRenewal ? (
            <Section spacing="lg">
              <Card variant="outlined" padding="md">
                <Text variant="body">{t('renewal.alreadyPending')}</Text>
              </Card>
            </Section>
          ) : (
            <Section spacing="lg">
              <Input
                label={t('renewal.noteLabel')}
                placeholder={t('renewal.notePlaceholder')}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={4}
              />
              <View style={{ marginTop: theme.spacing.md }}>
                <Button
                  label={t('renewal.submit')}
                  variant="primary"
                  fullWidth
                  loading={submit.isPending}
                  onPress={onSubmit}
                />
              </View>
            </Section>
          )}

          <Section spacing="huge">
            <Label>{t('renewal.historyTitle')}</Label>
            {renewals.isLoading ? (
              <Loading />
            ) : renewals.requests.length === 0 ? (
              <Caption>{t('renewal.historyEmpty')}</Caption>
            ) : (
              <View style={{ rowGap: theme.spacing.sm }}>
                {renewals.requests.map((r) => (
                  <Card key={r.id} variant="outlined" padding="md">
                    <View style={{ rowGap: theme.spacing.xs }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Caption>{formatDate(r.createdAt)}</Caption>
                        <Badge
                          label={t(`renewal.requestStatus.${r.status}`)}
                          tone={statusTone(r.status)}
                          size="sm"
                        />
                      </View>
                      {r.note ? <Text variant="caption">{r.note}</Text> : null}
                      {r.status === 'REJECTED' && r.decisionReason ? (
                        <Text variant="caption" color="danger">
                          {t('renewal.decisionReason')}: {r.decisionReason}
                        </Text>
                      ) : null}
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </Section>
        </>
      )}
    </ScrollScreen>
  );
}
