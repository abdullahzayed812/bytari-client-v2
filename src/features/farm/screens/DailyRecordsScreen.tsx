import { useLocalSearchParams } from 'expo-router';
import { Children, useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Divider, Icon, type IconName } from '@/components/content';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  Loading,
  useToast,
} from '@/components/feedback';
import { Input, Select } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Modal } from '@/components/overlays';
import { Caption, Text } from '@/components/typography';
import { DailyRecordWeekStrip, DAILY_RECORDS_PER_BATCH } from '@/features/farmShared/components/DailyRecordWeekStrip';
import { orgCapabilities, useOrganization } from '@/features/organizations';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { businessToday } from '@/lib/businessDate';
import { devDataEnabled } from '@/lib/env';
import { useTheme } from '@/theme';

import { DailyRecordCard } from '../components';
import {
  useCreateDailyRecord,
  useDailyRecords,
  useDeleteDailyRecord,
  usePoultryFlocks,
  useUpdateDailyRecord,
} from '../hooks';
import type { PoultryActivity, PoultryAppetite, PoultryDailyRecord } from '../types';
import { POULTRY_ACTIVITY_LEVELS, POULTRY_APPETITE_LEVELS } from '../types';

/**
 * Route `/poultry/[organizationId]/sections/daily` — البيانات اليومية as a
 * swipeable Day 1 … Day 7 strip. The date is server-assigned (today); each
 * card shows who added it and — for roles that may manage the flock — edit /
 * delete (confirmed). The backend enforces the one-per-day and seven-per-batch
 * rules; the UI only reflects them.
 */
export default function DailyRecordsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const { t: tf } = useTranslation('farm');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';
  const { isAdmin } = useCapabilities();
  const org = useOrganization(orgId);
  const canManage = orgCapabilities(org.data?.myRole, isAdmin).canManageFarmPoultry;

  const activeFlocks = usePoultryFlocks(orgId, { status: 'ACTIVE', pageSize: 1 });
  const flock = activeFlocks.flocks[0];

  const records = useDailyRecords(orgId, flock?.id, { pageSize: 100, enabled: Boolean(flock) });
  const create = useCreateDailyRecord(orgId, flock?.id ?? '');
  const update = useUpdateDailyRecord(orgId, flock?.id ?? '');
  const remove = useDeleteDailyRecord(orgId, flock?.id ?? '');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PoultryDailyRecord | null>(null);
  const [deleting, setDeleting] = useState<PoultryDailyRecord | null>(null);

  const items = records.data?.items ?? [];
  const today = businessToday();
  const todayRecorded = items.some((r) => r.recordDate === today);
  const full = items.length >= DAILY_RECORDS_PER_BATCH;

  const onError = (error: unknown) => toast.show({ tone: 'danger', message: apiErrorMessage(error) });

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
        ) : (
          <DailyRecordWeekStrip
            records={items}
            todayRecorded={todayRecorded}
            onAddPress={canManage && !full ? () => setFormOpen(true) : undefined}
            renderRecord={(r, day) => (
              <DailyRecordCard
                record={r}
                dayIndex={day}
                onEdit={canManage ? () => setEditing(r) : undefined}
                onDelete={canManage ? () => setDeleting(r) : undefined}
              />
            )}
          />
        )}
      </ScrollView>

      {flock && canManage ? (
        <View style={{ padding: theme.screenPadding }}>
          <Button
            label={full ? tf('daily.limitReached') : todayRecorded ? tf('daily.alreadyToday') : t('batch.addDaily')}
            variant="primary"
            fullWidth
            leftIcon="add"
            disabled={full || todayRecorded}
            onPress={() => setFormOpen(true)}
          />
        </View>
      ) : null}

      <AddDailyRecordDialog
        visible={formOpen || editing != null}
        initial={editing}
        title={editing ? tf('daily.editTitle', { day: editing.dayNumber ?? '' }) : t('batch.addDaily')}
        loading={create.isPending || update.isPending}
        onCancel={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={(input) => {
          if (editing) {
            update.mutate(
              { recordId: editing.id, body: input },
              {
                onSuccess: () => {
                  toast.show({ tone: 'success', message: tf('daily.updated') });
                  setEditing(null);
                },
                onError,
              },
            );
            return;
          }
          create.mutate(input, {
            onSuccess: () => {
              toast.show({ tone: 'success', message: t('daily.success') });
              setFormOpen(false);
            },
            onError,
          });
        }}
      />

      <ConfirmationDialog
        visible={deleting != null}
        title={tf('daily.deleteTitle')}
        message={tf('daily.deleteBody')}
        confirmLabel={tf('daily.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => {
              toast.show({ tone: 'success', message: tf('daily.deleted') });
              setDeleting(null);
            },
            onError: (e) => {
              setDeleting(null);
              onError(e);
            },
          });
        }}
      />
    </SafeAreaScreen>
  );
}

interface DailyRecordFormValues {
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
  initial,
  title,
  loading,
  onSubmit,
  onCancel,
}: {
  visible: boolean;
  /** Editing an existing record — pre-fills every field. */
  initial: PoultryDailyRecord | null;
  title: string;
  loading: boolean;
  onSubmit: (input: DailyRecordFormValues) => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const { t: tf } = useTranslation('farm');
  // DEV-ONLY: pre-filled so the dialog doesn't need retyping on every test run.
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

  // Re-seed from the record being edited (or clear for a new one) whenever the dialog opens.
  useEffect(() => {
    if (!visible || !initial) return;
    const num = (v: string | null) => (v == null ? '' : String(Number(v)));
    setFeedKg(num(initial.feedKg));
    setWaterLiters(num(initial.waterLiters));
    setAppetite(initial.appetite);
    setActivity(initial.activity);
    setMortalityCount(String(initial.mortalityCount));
    setMortalityCause(initial.mortalityCause ?? '');
    setTreatment(initial.treatment ?? '');
    setExpenseAmount(num(initial.expenseAmount));
    setNotes(initial.notes ?? '');
  }, [visible, initial]);

  return (
    <Modal visible={visible} onClose={onCancel} title={title} dismissable={!loading}>
      <ScrollView
        contentContainerStyle={{ rowGap: theme.spacing.md }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {initial ? null : <Caption>{tf('daily.autoDate')}</Caption>}

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
              disabled={loading}
              onPress={() =>
                onSubmit({
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
