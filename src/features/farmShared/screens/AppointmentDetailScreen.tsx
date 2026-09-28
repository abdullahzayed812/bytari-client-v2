import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge, Card, Chip } from '@/components/content';
import { ErrorState, Loading, useToast } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { orgCapabilities, useOrganization } from '@/features/organizations';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate, formatWeekday } from '@/utils';

import { APPOINTMENT_CATEGORY_TONE } from '../constants';
import { FarmRecordFooter } from '../components/FarmRecordFooter';
import { useFarmAppointment } from '../hooks';
import { useDeleteFarmAppointment, useUpdateFarmAppointmentStatus } from '../records';

const APPOINTMENT_STATUSES = ['UPCOMING', 'DONE', 'CANCELLED'] as const;

/** Route `/poultry/[organizationId]/sections/appointments/[itemId]` — one appointment's full detail. */
export default function AppointmentDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const { organizationId, itemId } = useLocalSearchParams<{
    organizationId: string;
    itemId: string;
  }>();

  const q = useFarmAppointment(organizationId, itemId);
  const toast = useToast();
  const { t: tf } = useTranslation('farm');
  const { isAdmin } = useCapabilities();
  const org = useOrganization(organizationId ?? '');
  const canManage = orgCapabilities(org.data?.myRole, isAdmin).canManageFarmPoultry;
  const remove = useDeleteFarmAppointment(organizationId ?? '');
  const setStatus = useUpdateFarmAppointmentStatus(organizationId ?? '');

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

              {canManage ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                  {APPOINTMENT_STATUSES.map((s) => (
                    <Chip
                      key={s}
                      label={tf(`records.appointmentStatus.${s}`)}
                      selected={q.data!.status === s}
                      onPress={() =>
                        q.data!.status !== s &&
                        setStatus.mutate(
                          { id: q.data!.id, status: s },
                          {
                            onSuccess: () =>
                              toast.show({ tone: 'success', message: tf('records.updated') }),
                            onError: (e) =>
                              toast.show({ tone: 'danger', message: apiErrorMessage(e) }),
                          },
                        )
                      }
                    />
                  ))}
                </View>
              ) : null}

              <FarmRecordFooter
                createdBy={q.data.createdBy}
                canManage={canManage}
                deleting={remove.isPending}
                onDelete={() =>
                  remove.mutate(q.data!.id, {
                    onSuccess: () => {
                      toast.show({ tone: 'success', message: tf('records.deleted') });
                      router.back();
                    },
                    onError: (e) => toast.show({ tone: 'danger', message: apiErrorMessage(e) }),
                  })
                }
              />
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
