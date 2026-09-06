import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge, Card } from '@/components/content';
import { ErrorState, Loading } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate, formatWeekday } from '@/utils';

import { APPOINTMENT_CATEGORY_TONE } from '../constants';
import { useFarmAppointment } from '../hooks';

/** Route `/poultry/[organizationId]/sections/appointments/[itemId]` — one appointment's full detail. */
export default function AppointmentDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const { organizationId, itemId } = useLocalSearchParams<{
    organizationId: string;
    itemId: string;
  }>();

  const q = useFarmAppointment(organizationId, itemId);

  return (
    <ScrollScreen>
      <AppHeader title={t('appointments.title')} showBack />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !q.data ? (
        <Section spacing="lg">
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </Section>
      ) : (
        <Section spacing="lg">
          <Card variant="outlined" padding="lg">
            <View style={{ rowGap: theme.spacing.lg }}>
              <View style={{ rowGap: 4 }}>
                <Badge
                  label={t(`appointments.category.${q.data.category}`)}
                  tone={APPOINTMENT_CATEGORY_TONE[q.data.category] ?? 'neutral'}
                  size="sm"
                />
                <Text variant="heading">{q.data.title}</Text>
              </View>

              <Row
                label={t('appointments.form.dateLabel')}
                value={`${formatWeekday(q.data.scheduledFor)} — ${formatDate(q.data.scheduledFor)}`}
              />

              {q.data.description ? (
                <View style={{ rowGap: 2 }}>
                  <Caption>{t('appointments.form.descriptionLabel')}</Caption>
                  <Text variant="body">{q.data.description}</Text>
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
