import { useLocalSearchParams } from 'expo-router';
import { Children, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Divider, Icon, type IconName } from '@/components/content';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { Input, Select } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Modal } from '@/components/overlays';
import { Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { devDataEnabled } from '@/lib/env';
import { useTheme } from '@/theme';

import { DailyRecordCard, DateFieldInput, isValidIsoDate } from '../components';
import { useCreateDailyRecord, useDailyRecords, usePoultryFlocks } from '../hooks';
import type { PoultryActivity, PoultryAppetite } from '../types';
import { POULTRY_ACTIVITY_LEVELS, POULTRY_APPETITE_LEVELS } from '../types';

/** Route `/poultry/[organizationId]/sections/daily` — البيانات اليومية. */
export default function DailyRecordsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const activeFlocks = usePoultryFlocks(orgId, { status: 'ACTIVE', pageSize: 1 });
  const flock = activeFlocks.flocks[0];

  const records = useDailyRecords(orgId, flock?.id, { pageSize: 100, enabled: Boolean(flock) });
  const create = useCreateDailyRecord(orgId, flock?.id ?? '');
  const [formOpen, setFormOpen] = useState(false);

  const total = records.data?.meta.total ?? 0;
  const items = records.data?.items ?? [];

  return (
    <SafeAreaScreen>
      <AppHeader title={t('daily.title')} showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: theme.screenPadding,
          paddingBottom: theme.spacing.huge,
          rowGap: theme.spacing.md,
        }}
      >
        {!flock ? (
          <EmptyState icon="clipboard-outline" title={t('batch.emptyTitle')} message={t('batch.emptyBody')} />
        ) : records.isLoading ? (
          <Loading label={t('common.loading')} />
        ) : records.isError ? (
          <ErrorState error={records.error} onRetry={() => void records.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState icon="clipboard-outline" title={t('daily.emptyTitle')} message={t('daily.emptyBody')} />
        ) : (
          items.map((r, i) => (
            <DailyRecordCard key={r.id} record={r} dayIndex={total - i} />
          ))
        )}
      </ScrollView>

      {flock ? (
        <View style={{ padding: theme.screenPadding }}>
          <Button
            label={t('batch.addDaily')}
            variant="primary"
            fullWidth
            leftIcon="add"
            onPress={() => setFormOpen(true)}
          />
        </View>
      ) : null}

      <AddDailyRecordDialog
        visible={formOpen}
        loading={create.isPending}
        onCancel={() => setFormOpen(false)}
        onSubmit={(input) =>
          create.mutate(input, {
            onSuccess: () => {
              toast.show({ tone: 'success', message: t('daily.success') });
              setFormOpen(false);
            },
            onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
          })
        }
      />
    </SafeAreaScreen>
  );
}

interface DailyRecordFormValues {
  recordDate: string;
  feedKg?: number;
  waterLiters?: number;
  appetite?: PoultryAppetite;
  activity?: PoultryActivity;
  mortalityCount?: number;
  mortalityCause?: string;
  treatment?: string;
  expenseAmount?: number;
  notes?: string;
}

function AddDailyRecordDialog({
  visible,
  loading,
  onSubmit,
  onCancel,
}: {
  visible: boolean;
  loading: boolean;
  onSubmit: (input: DailyRecordFormValues) => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  // DEV-ONLY: pre-filled so the dialog doesn't need retyping on every test run.
  const [recordDate, setRecordDate] = useState(
    devDataEnabled ? new Date().toISOString().slice(0, 10) : '',
  );
  const [feedKg, setFeedKg] = useState(devDataEnabled ? '120' : '');
  const [waterLiters, setWaterLiters] = useState(devDataEnabled ? '200' : '');
  const [appetite, setAppetite] = useState<PoultryAppetite | null>(devDataEnabled ? 'GOOD' : null);
  const [activity, setActivity] = useState<PoultryActivity | null>(
    devDataEnabled ? 'ACTIVE' : null,
  );
  const [mortalityCount, setMortalityCount] = useState(devDataEnabled ? '2' : '');
  const [mortalityCause, setMortalityCause] = useState(devDataEnabled ? 'حرارة مرتفعة' : '');
  const [treatment, setTreatment] = useState(devDataEnabled ? 'فيتامينات مقوية للمناعة' : '');
  const [expenseAmount, setExpenseAmount] = useState(devDataEnabled ? '15000' : '');
  const [notes, setNotes] = useState(devDataEnabled ? 'الدفعة بحالة جيدة بشكل عام' : '');

  const valid = isValidIsoDate(recordDate);

  return (
    <Modal visible={visible} onClose={onCancel} title={t('batch.addDaily')} dismissable={!loading}>
      <ScrollView
        contentContainerStyle={{ rowGap: theme.spacing.md }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <DateFieldInput label={t('daily.dateLabel')} value={recordDate} onChangeText={setRecordDate} />

        <FieldGroup icon="nutrition-outline" label={t('daily.consumptionSection')}>
          <FieldRow>
            <Input
              label={t('daily.feed')}
              hint={t('daily.feedUnit')}
              keyboardType="decimal-pad"
              value={feedKg}
              onChangeText={setFeedKg}
            />
            <Input
              label={t('daily.water')}
              hint={t('daily.waterUnit')}
              keyboardType="decimal-pad"
              value={waterLiters}
              onChangeText={setWaterLiters}
            />
          </FieldRow>
        </FieldGroup>

        <FieldGroup icon="pulse-outline" label={t('daily.healthSection')}>
          <FieldRow>
            <Select<PoultryAppetite>
              label={t('daily.appetite')}
              value={appetite}
              options={POULTRY_APPETITE_LEVELS.map((a) => ({
                value: a,
                label: t(`daily.appetiteLevels.${a}`),
              }))}
              onChange={setAppetite}
            />
            <Select<PoultryActivity>
              label={t('daily.activity')}
              value={activity}
              options={POULTRY_ACTIVITY_LEVELS.map((a) => ({
                value: a,
                label: t(`daily.activityLevels.${a}`),
              }))}
              onChange={setActivity}
            />
          </FieldRow>
          <FieldRow>
            <Input
              label={t('daily.mortality')}
              hint={t('daily.mortalityUnit')}
              keyboardType="number-pad"
              value={mortalityCount}
              onChangeText={setMortalityCount}
            />
            <Input
              label={t('daily.mortalityCause')}
              value={mortalityCause}
              onChangeText={setMortalityCause}
            />
          </FieldRow>
        </FieldGroup>

        <FieldGroup icon="wallet-outline" label={t('daily.otherSection')}>
          <FieldRow>
            <Input label={t('daily.treatment')} value={treatment} onChangeText={setTreatment} />
            <Input
              label={t('daily.expense')}
              hint={t('daily.expenseUnit')}
              keyboardType="decimal-pad"
              value={expenseAmount}
              onChangeText={setExpenseAmount}
            />
          </FieldRow>
          <Input label={t('daily.notes')} multiline numberOfLines={3} value={notes} onChangeText={setNotes} />
        </FieldGroup>

        <Divider spacing="xs" />

        <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button label={t('common.cancel')} variant="ghost" fullWidth onPress={onCancel} disabled={loading} />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t('common.save')}
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading || !valid}
              onPress={() =>
                onSubmit({
                  recordDate,
                  feedKg: feedKg ? Number(feedKg) : undefined,
                  waterLiters: waterLiters ? Number(waterLiters) : undefined,
                  appetite: appetite ?? undefined,
                  activity: activity ?? undefined,
                  mortalityCount: mortalityCount ? Number(mortalityCount) : undefined,
                  mortalityCause: mortalityCause.trim() || undefined,
                  treatment: treatment.trim() || undefined,
                  expenseAmount: expenseAmount ? Number(expenseAmount) : undefined,
                  notes: notes.trim() || undefined,
                })
              }
            />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}

/** A small icon + bold label above a group of related fields, matching the rest of the app's section-header style. */
function FieldGroup({
  icon,
  label,
  children,
}: {
  icon: IconName;
  label: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={{ rowGap: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
        <Icon name={icon} size="iconSm" color="primary" />
        <Text variant="label" weight="bold">
          {label}
        </Text>
      </View>
      <View style={{ rowGap: theme.spacing.sm }}>{children}</View>
    </View>
  );
}

/** Two fields side by side, each taking half the width. */
function FieldRow({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
      {Children.map(children, (child, i) => (
        <View key={i} style={{ flex: 1 }}>
          {child}
        </View>
      ))}
    </View>
  );
}
