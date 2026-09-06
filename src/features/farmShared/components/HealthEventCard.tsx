import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge, Card, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import type { PoultryHealthEvent } from '@/features/farm/types';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { HEALTH_EVENT_KIND_ICON, HEALTH_EVENT_STATUS_ICON, HEALTH_EVENT_STATUS_TONE } from '../constants';

function monthsBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00Z`);
  const to = new Date(`${toIso}T00:00:00Z`);
  return Math.max(
    0,
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth()),
  );
}

export function HealthEventCard({
  event,
  onPress,
}: {
  event: PoultryHealthEvent;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const isVaccination = event.kind === 'VACCINATION';

  return (
    <Card variant="outlined" padding="md" onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: theme.spacing.md }}>
        <View style={{ flex: 1, rowGap: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Caption>{isVaccination ? t('health.vaccineNameLabel') : t('health.diseaseNameLabel')}</Caption>
            <Icon name={HEALTH_EVENT_KIND_ICON[event.kind]} size="iconSm" color="primary" />
          </View>
          <Text variant="bodyStrong">{event.name}</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
            <Field label={t('health.dateLabel')} value={formatDate(event.eventDate)} />
            {isVaccination ? (
              <>
                {event.dose ? <Field label={t('health.doseLabel')} value={event.dose} /> : null}
                {event.coverageCount !== null ? (
                  <Field label={t('health.coverageLabel')} value={event.coverageCount.toLocaleString()} />
                ) : null}
              </>
            ) : (
              <>
                {event.medication ? (
                  <Field label={t('health.medicationLabel')} value={event.medication} />
                ) : null}
                {event.casesCount !== null ? (
                  <Field label={t('health.casesCountLabel')} value={event.casesCount.toLocaleString()} />
                ) : null}
              </>
            )}
          </View>

          {isVaccination && event.nextDueDate ? (
            <View style={{ rowGap: 2 }}>
              <Caption>{t('health.nextDueLabel')}</Caption>
              <Text variant="bodyMedium">{formatDate(event.nextDueDate)}</Text>
              <Caption color="primary">
                {t('health.afterMonths', { count: monthsBetween(event.eventDate, event.nextDueDate) })}
              </Caption>
            </View>
          ) : null}

          {!isVaccination ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
              <Icon
                name={HEALTH_EVENT_STATUS_ICON[event.status]}
                size="iconSm"
                color={
                  event.status === 'DONE' || event.status === 'RECOVERED'
                    ? 'success'
                    : event.status === 'ONGOING'
                      ? 'warning'
                      : 'primary'
                }
              />
              <Badge
                label={t(`health.status.${event.status}`)}
                tone={HEALTH_EVENT_STATUS_TONE[event.status]}
                size="sm"
              />
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ rowGap: 2 }}>
      <Caption>{label}</Caption>
      <Text variant="bodyMedium">{value}</Text>
    </View>
  );
}
