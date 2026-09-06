import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Card, Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { Input, Select } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Modal } from '@/components/overlays';
import { Caption, Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { useCattleBatches, useCattleHealthEvents, useCreateCattleHealthEvent } from '../hooks';
import { LIVESTOCK_HEALTH_EVENT_KINDS } from '../types';
import type { LivestockHealthEventKind } from '../types';

/** Route `/(app)/livestock/cattle/[organizationId]/sections/treatments`. Mirrors `SheepTreatmentsScreen`. */
export default function CattleTreatmentsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('sheepCattleFarm');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const activeBatches = useCattleBatches(orgId, { status: 'ACTIVE', pageSize: 1 });
  const batch = activeBatches.batches[0];
  const events = useCattleHealthEvents(orgId, batch?.id, { pageSize: 100 }, { enabled: Boolean(batch) });
  const create = useCreateCattleHealthEvent(orgId, batch?.id ?? '');
  const [formOpen, setFormOpen] = useState(false);
  const [kind, setKind] = useState<LivestockHealthEventKind>('TREATMENT');
  const [name, setName] = useState('');
  const [eventDate, setEventDate] = useState('');

  return (
    <SafeAreaScreen>
      <AppHeader title={t('health.title')} showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: theme.screenPadding, paddingBottom: theme.spacing.huge, rowGap: theme.spacing.md }}>
        {!batch ? (
          <EmptyState icon="medkit-outline" title={t('batch.emptyTitle')} message={t('batch.emptyBody')} />
        ) : events.isLoading ? (
          <Loading label={t('common.loading')} />
        ) : events.isError ? (
          <ErrorState error={events.error} onRetry={() => void events.refetch()} />
        ) : events.events.length === 0 ? (
          <EmptyState icon="medkit-outline" title={t('health.empty')} message={t('health.emptyHint')} />
        ) : (
          events.events.map((e) => (
            <Card key={e.id} variant="outlined" padding="md">
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
                  <Icon name={e.kind === 'VACCINATION' ? 'shield-checkmark-outline' : 'medkit-outline'} size="iconSm" color="primary" />
                  <Text variant="bodyMedium">{e.name}</Text>
                </View>
                <Badge label={t(`health.kind.${e.kind}`)} tone="info" size="sm" />
              </View>
              <Caption>{formatDate(e.eventDate)}</Caption>
            </Card>
          ))
        )}
      </ScrollView>

      {batch ? (
        <View style={{ padding: theme.screenPadding }}>
          <Button label={t('health.addButton')} variant="primary" fullWidth leftIcon="add" onPress={() => setFormOpen(true)} />
        </View>
      ) : null}

      <Modal visible={formOpen} onClose={() => setFormOpen(false)} title={t('health.addButton')} dismissable={!create.isPending}>
        <View style={{ rowGap: theme.spacing.md }}>
          <Select<LivestockHealthEventKind>
            label={t('health.kindLabel')}
            value={kind}
            options={LIVESTOCK_HEALTH_EVENT_KINDS.map((k) => ({ value: k, label: t(`health.kind.${k}`) }))}
            onChange={(v) => v && setKind(v)}
          />
          <Input label={t('health.nameLabel')} value={name} onChangeText={setName} />
          <Input label={t('health.dateLabel')} placeholder="YYYY-MM-DD" value={eventDate} onChangeText={setEventDate} />
          <Button
            label={t('common.save')}
            variant="primary"
            fullWidth
            loading={create.isPending}
            disabled={create.isPending || !name.trim() || !eventDate.trim()}
            onPress={() =>
              create.mutate(
                { kind, name: name.trim(), eventDate },
                {
                  onSuccess: () => {
                    toast.show({ tone: 'success', message: t('health.success') });
                    setFormOpen(false);
                    setName('');
                    setEventDate('');
                  },
                  onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
                },
              )
            }
          />
        </View>
      </Modal>
    </SafeAreaScreen>
  );
}
