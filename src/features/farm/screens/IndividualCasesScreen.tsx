import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Chip } from '@/components/content';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { Input, Select } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Modal } from '@/components/overlays';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { devDataEnabled } from '@/lib/env';
import { useTheme } from '@/theme';

import { DateFieldInput, PoultryCaseCard, isValidIsoDate } from '../components';
import {
  useCreatePoultryCase,
  usePoultryCaseSummary,
  usePoultryCases,
  usePoultryFlocks,
} from '../hooks';
import type { PoultryCaseSex, PoultryCaseStatus } from '../types';
import { POULTRY_CASE_SEXES } from '../types';

type Scope = 'ALL' | PoultryCaseStatus;

/** Route `/poultry/[organizationId]/sections/cases` — الحالات الفردية. */
export default function IndividualCasesScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const activeFlocks = usePoultryFlocks(orgId, { status: 'ACTIVE', pageSize: 1 });
  const flock = activeFlocks.flocks[0];

  const [scope, setScope] = useState<Scope>('ALL');
  const summary = usePoultryCaseSummary(orgId, flock?.id, { enabled: Boolean(flock) });
  const list = usePoultryCases(
    orgId,
    flock?.id,
    { status: scope === 'ALL' ? undefined : scope },
    { enabled: Boolean(flock) },
  );
  const create = useCreatePoultryCase(orgId, flock?.id ?? '');
  const [formOpen, setFormOpen] = useState(false);

  return (
    <SafeAreaScreen>
      <AppHeader title={t('cases.title')} showBack />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: 'flex-start',
          columnGap: theme.spacing.sm,
          paddingHorizontal: theme.screenPadding,
          paddingTop: theme.spacing.sm,
        }}
      >
        <StatChip
          label={t('cases.tab.deceased')}
          value={summary.data?.deceased ?? 0}
          selected={scope === 'DECEASED'}
          onPress={() => setScope('DECEASED')}
        />
        <StatChip
          label={t('cases.tab.recovered')}
          value={summary.data?.recovered ?? 0}
          selected={scope === 'RECOVERED'}
          onPress={() => setScope('RECOVERED')}
        />
        <StatChip
          label={t('cases.tab.underTreatment')}
          value={summary.data?.underTreatment ?? 0}
          selected={scope === 'UNDER_TREATMENT'}
          onPress={() => setScope('UNDER_TREATMENT')}
        />
        <Chip
          label={t('cases.tab.all')}
          selected={scope === 'ALL'}
          onPress={() => setScope('ALL')}
        />
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: theme.screenPadding,
          paddingBottom: theme.spacing.huge,
          rowGap: theme.spacing.md,
        }}
      >
        {!flock ? (
          <EmptyState
            icon="pulse-outline"
            title={t('batch.emptyTitle')}
            message={t('batch.emptyBody')}
          />
        ) : list.isLoading ? (
          <Loading label={t('common.loading')} />
        ) : list.isError ? (
          <ErrorState error={list.error} onRetry={() => void list.refetch()} />
        ) : list.cases.length === 0 ? (
          <EmptyState
            icon="pulse-outline"
            title={t('cases.empty')}
            message={t('cases.emptyHint')}
          />
        ) : (
          list.cases.map((c) => (
            <PoultryCaseCard
              key={c.id}
              item={c}
              onPress={() =>
                router.push({
                  pathname: Routes.poultryFarmSectionItem(orgId, 'cases', c.id) as never,
                  params: { flockId: flock?.id },
                })
              }
            />
          ))
        )}
      </ScrollView>

      {flock ? (
        <View style={{ padding: theme.screenPadding }}>
          <Button
            label={t('cases.addButton')}
            variant="primary"
            fullWidth
            leftIcon="add"
            onPress={() => setFormOpen(true)}
          />
        </View>
      ) : null}

      <AddCaseDialog
        visible={formOpen}
        loading={create.isPending}
        onCancel={() => setFormOpen(false)}
        onSubmit={(input) =>
          create.mutate(input, {
            onSuccess: () => {
              toast.show({ tone: 'success', message: t('cases.form.success') });
              setFormOpen(false);
            },
            onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
          })
        }
      />
    </SafeAreaScreen>
  );
}

function StatChip({
  label,
  value,
  selected,
  onPress,
}: {
  label: string;
  value: number;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          borderRadius: theme.radius.lg,
          borderWidth: 1.5,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          alignItems: 'center',
          rowGap: 2,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Caption color={selected ? 'primary' : 'textSecondary'}>{label}</Caption>
      <Text variant="bodyStrong" color={selected ? 'primary' : 'textPrimary'}>
        {value}
      </Text>
    </Pressable>
  );
}

interface CaseFormValues {
  animalTag?: string;
  sex?: PoultryCaseSex;
  diagnosis?: string;
  treatment?: string;
  startedOn: string;
  nextFollowupOn?: string;
}

function AddCaseDialog({
  visible,
  loading,
  onSubmit,
  onCancel,
}: {
  visible: boolean;
  loading: boolean;
  onSubmit: (input: CaseFormValues) => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  // DEV-ONLY: pre-filled so the dialog doesn't need retyping on every test run.
  const [animalTag, setAnimalTag] = useState(devDataEnabled ? 'قفص-14' : '');
  const [sex, setSex] = useState<PoultryCaseSex | null>(devDataEnabled ? 'MALE' : null);
  const [diagnosis, setDiagnosis] = useState(devDataEnabled ? 'ضعف عام وخمول' : '');
  const [treatment, setTreatment] = useState(devDataEnabled ? 'مضاد حيوي وفيتامينات' : '');
  const [startedOn, setStartedOn] = useState(
    devDataEnabled ? new Date().toISOString().slice(0, 10) : '',
  );
  const [nextFollowupOn, setNextFollowupOn] = useState(
    devDataEnabled ? new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10) : '',
  );

  const valid = isValidIsoDate(startedOn);

  return (
    <Modal
      visible={visible}
      onClose={onCancel}
      title={t('cases.form.title')}
      dismissable={!loading}
    >
      <ScrollView
        contentContainerStyle={{ rowGap: theme.spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label={t('cases.form.animalTagLabel')}
          value={animalTag}
          onChangeText={setAnimalTag}
        />
        <Select<PoultryCaseSex>
          label={t('cases.form.sexLabel')}
          value={sex}
          options={POULTRY_CASE_SEXES.map((s) => ({ value: s, label: t(`cases.sex.${s}`) }))}
          onChange={setSex}
        />
        <Input
          label={t('cases.form.diagnosisLabel')}
          value={diagnosis}
          onChangeText={setDiagnosis}
        />
        <Input
          label={t('cases.form.treatmentLabel')}
          value={treatment}
          onChangeText={setTreatment}
        />
        <DateFieldInput
          label={t('cases.form.startedLabel')}
          value={startedOn}
          onChangeText={setStartedOn}
        />
        <DateFieldInput
          label={t('cases.form.nextFollowupLabel')}
          value={nextFollowupOn}
          onChangeText={setNextFollowupOn}
        />
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button
              label={t('common.cancel')}
              variant="ghost"
              fullWidth
              onPress={onCancel}
              disabled={loading}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t('cases.form.submit')}
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading || !valid}
              onPress={() =>
                onSubmit({
                  animalTag: animalTag.trim() || undefined,
                  sex: sex ?? undefined,
                  diagnosis: diagnosis.trim() || undefined,
                  treatment: treatment.trim() || undefined,
                  startedOn,
                  nextFollowupOn: nextFollowupOn.trim() || undefined,
                })
              }
            />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}
