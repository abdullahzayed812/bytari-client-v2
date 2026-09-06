import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Card } from '@/components/content';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { Input } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Modal } from '@/components/overlays';
import { Caption, Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { CASE_STATUS_TONE } from '../constants';
import { useCreateSheepCase, useSheepBatches, useSheepCases } from '../hooks';

/** Route `/(app)/livestock/sheep/[organizationId]/sections/cases` — الحالات الفردية. Mirrors `IndividualCasesScreen`. */
export default function SheepIndividualCasesScreen() {
  const theme = useTheme();
  const { t } = useTranslation('sheepCattleFarm');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const activeBatches = useSheepBatches(orgId, { status: 'ACTIVE', pageSize: 1 });
  const batch = activeBatches.batches[0];
  const cases = useSheepCases(orgId, batch?.id, { pageSize: 100 }, { enabled: Boolean(batch) });
  const create = useCreateSheepCase(orgId, batch?.id ?? '');
  const [formOpen, setFormOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [startedOn, setStartedOn] = useState('');

  return (
    <SafeAreaScreen>
      <AppHeader title={t('cases.title')} showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: theme.screenPadding, paddingBottom: theme.spacing.huge, rowGap: theme.spacing.md }}>
        {!batch ? (
          <EmptyState icon="paw-outline" title={t('batch.emptyTitle')} message={t('batch.emptyBody')} />
        ) : cases.isLoading ? (
          <Loading label={t('common.loading')} />
        ) : cases.isError ? (
          <ErrorState error={cases.error} onRetry={() => void cases.refetch()} />
        ) : cases.cases.length === 0 ? (
          <EmptyState icon="paw-outline" title={t('cases.empty')} message={t('cases.emptyHint')} />
        ) : (
          cases.cases.map((c) => (
            <Card key={c.id} variant="outlined" padding="md">
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="bodyMedium">{c.diagnosis ?? t('daily.none')}</Text>
                <Badge label={t(`cases.status.${c.status}`)} tone={CASE_STATUS_TONE[c.status]} size="sm" />
              </View>
              <Caption>{formatDate(c.startedOn)}</Caption>
            </Card>
          ))
        )}
      </ScrollView>

      {batch ? (
        <View style={{ padding: theme.screenPadding }}>
          <Button label={t('cases.addButton')} variant="primary" fullWidth leftIcon="add" onPress={() => setFormOpen(true)} />
        </View>
      ) : null}

      <Modal visible={formOpen} onClose={() => setFormOpen(false)} title={t('cases.addButton')} dismissable={!create.isPending}>
        <View style={{ rowGap: theme.spacing.md }}>
          <Input label={t('cases.diagnosisLabel')} value={diagnosis} onChangeText={setDiagnosis} />
          <Input label={t('cases.startedLabel')} placeholder="YYYY-MM-DD" value={startedOn} onChangeText={setStartedOn} />
          <Button
            label={t('common.save')}
            variant="primary"
            fullWidth
            loading={create.isPending}
            disabled={create.isPending || !startedOn.trim()}
            onPress={() =>
              create.mutate(
                { diagnosis: diagnosis.trim() || undefined, startedOn },
                {
                  onSuccess: () => {
                    toast.show({ tone: 'success', message: t('cases.success') });
                    setFormOpen(false);
                    setDiagnosis('');
                    setStartedOn('');
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
