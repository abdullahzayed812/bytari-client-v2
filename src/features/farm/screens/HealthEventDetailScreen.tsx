import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge, Card, Icon } from '@/components/content';
import { ErrorState, Loading } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { HEALTH_EVENT_KIND_ICON, HEALTH_EVENT_STATUS_TONE } from '@/features/farmShared';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { useHealthEvent } from '../hooks';

/** Route `/poultry/[organizationId]/sections/treatments/[itemId]` — one treatment/vaccination's full detail. */
export default function HealthEventDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const { organizationId, itemId, flockId } = useLocalSearchParams<{
    organizationId: string;
    itemId: string;
    flockId: string;
  }>();

  const q = useHealthEvent(organizationId, flockId, itemId);
  const event = q.data;
  const isVaccination = event?.kind === 'VACCINATION';

  return (
    <ScrollScreen>
      <AppHeader title={t('health.title')} showBack />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !event ? (
        <Section spacing="lg">
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </Section>
      ) : (
        <Section spacing="lg">
          <Card variant="outlined" padding="lg">
            <View style={{ rowGap: theme.spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
                <Icon name={HEALTH_EVENT_KIND_ICON[event.kind]} size="iconLg" color="primary" />
                <View style={{ flex: 1, rowGap: 2 }}>
                  <Caption>{t(`health.kind.${event.kind}`)}</Caption>
                  <Text variant="heading">{event.name}</Text>
                </View>
              </View>

              <Row label={t('health.dateLabel')} value={formatDate(event.eventDate)} />

              {isVaccination ? (
                <>
                  {event.dose ? <Row label={t('health.doseLabel')} value={event.dose} /> : null}
                  {event.coverageCount !== null ? (
                    <Row label={t('health.coverageLabel')} value={event.coverageCount.toLocaleString()} />
                  ) : null}
                  {event.nextDueDate ? (
                    <Row label={t('health.nextDueLabel')} value={formatDate(event.nextDueDate)} />
                  ) : null}
                </>
              ) : (
                <>
                  {event.medication ? (
                    <Row label={t('health.medicationLabel')} value={event.medication} />
                  ) : null}
                  {event.casesCount !== null ? (
                    <Row label={t('health.casesCountLabel')} value={event.casesCount.toLocaleString()} />
                  ) : null}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Caption>{t('health.statusLabel')}</Caption>
                    <Badge
                      label={t(`health.status.${event.status}`)}
                      tone={HEALTH_EVENT_STATUS_TONE[event.status]}
                      size="sm"
                    />
                  </View>
                </>
              )}

              {event.notes ? (
                <View style={{ rowGap: 2 }}>
                  <Caption>{t('health.form.notesLabel')}</Caption>
                  <Text variant="body">{event.notes}</Text>
                </View>
              ) : null}
            </View>
          </Card>
        </Section>
      )}
    </ScrollScreen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', columnGap: 12 }}>
      <Caption>{label}</Caption>
      <Text variant="bodyMedium">{value}</Text>
    </View>
  );
}
