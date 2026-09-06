import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Chip } from '@/components/content';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { Input, Select } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Modal } from '@/components/overlays';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import type { FarmExpenseCategory } from '@/features/farm/types';
import { FARM_EXPENSE_CATEGORIES } from '@/features/farm/types';
import { apiErrorMessage } from '@/lib/apiError';
import { devDataEnabled } from '@/lib/env';
import { useTheme } from '@/theme';

import { DateFieldInput, ExpenseCard, isValidIsoDate } from '../components';
import { useCreateFarmExpense, useFarmExpenseSummary, useFarmExpenses } from '../hooks';

type Scope = FarmExpenseCategory | 'ALL';

/** Route `/poultry/[organizationId]/sections/expenses` — المصاريف. */
export default function FarmExpensesScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const [scope, setScope] = useState<Scope>('ALL');
  const summary = useFarmExpenseSummary(orgId);
  const list = useFarmExpenses(orgId, { category: scope === 'ALL' ? undefined : scope });
  const create = useCreateFarmExpense(orgId);

  const [formOpen, setFormOpen] = useState(false);

  return (
    <SafeAreaScreen>
      <AppHeader title={t('expenses.title')} showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: theme.screenPadding,
          paddingBottom: theme.spacing.huge,
          rowGap: theme.spacing.lg,
        }}
      >
        {summary.data ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            <SummaryTile label={t('expenses.dailyAvg')} value={summary.data.dailyAverageThisMonth} />
            <SummaryTile label={t('expenses.monthTotal')} value={summary.data.totalThisMonth} />
            <SummaryTile label={t('expenses.weekTotal')} value={summary.data.totalThisWeek} />
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ alignItems: 'flex-start', columnGap: theme.spacing.sm }}
        >
          <Chip label={t('common.all')} selected={scope === 'ALL'} onPress={() => setScope('ALL')} />
          {FARM_EXPENSE_CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={t(`expenses.categories.${c}`)}
              selected={scope === c}
              onPress={() => setScope(c)}
            />
          ))}
        </ScrollView>

        {list.isLoading ? (
          <Loading label={t('common.loading')} />
        ) : list.isError ? (
          <ErrorState error={list.error} onRetry={() => void list.refetch()} />
        ) : list.data?.items.length === 0 ? (
          <EmptyState icon="wallet-outline" title={t('expenses.empty')} />
        ) : (
          <View style={{ rowGap: theme.spacing.md }}>
            {list.data?.items.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onPress={() =>
                  router.push(Routes.poultryFarmSectionItem(orgId, 'expenses', expense.id))
                }
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={{ padding: theme.screenPadding }}>
        <Button
          label={t('expenses.addButton')}
          variant="primary"
          fullWidth
          leftIcon="add"
          onPress={() => setFormOpen(true)}
        />
      </View>

      <AddExpenseDialog
        visible={formOpen}
        loading={create.isPending}
        onCancel={() => setFormOpen(false)}
        onSubmit={(input) =>
          create.mutate(input, {
            onSuccess: () => {
              toast.show({ tone: 'success', message: t('expenses.success') });
              setFormOpen(false);
            },
            onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
          })
        }
      />
    </SafeAreaScreen>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: '30%',
        minWidth: 100,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        rowGap: theme.spacing.xs,
      }}
    >
      <Caption numberOfLines={1}>{label}</Caption>
      <Text variant="bodyStrong" color="danger">
        {Math.round(value).toLocaleString()} {t('expenses.unit')}
      </Text>
    </View>
  );
}

function AddExpenseDialog({
  visible,
  loading,
  onSubmit,
  onCancel,
}: {
  visible: boolean;
  loading: boolean;
  onSubmit: (input: {
    category: FarmExpenseCategory;
    amount: number;
    spentOn: string;
    description?: string;
  }) => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  // DEV-ONLY: pre-filled so the dialog doesn't need retyping on every test run.
  const [category, setCategory] = useState<FarmExpenseCategory | null>(
    devDataEnabled ? 'FEED' : null,
  );
  const [amount, setAmount] = useState(devDataEnabled ? '250000' : '');
  const [spentOn, setSpentOn] = useState(devDataEnabled ? new Date().toISOString().slice(0, 10) : '');
  const [description, setDescription] = useState(devDataEnabled ? 'شراء علف لمدة أسبوع' : '');

  const amountNum = Number(amount);
  const valid = category !== null && amountNum > 0 && isValidIsoDate(spentOn);

  return (
    <Modal visible={visible} onClose={onCancel} title={t('expenses.formTitle')} dismissable={!loading}>
      <View style={{ rowGap: theme.spacing.md }}>
        <Select<FarmExpenseCategory>
          label={t('expenses.typeLabel')}
          value={category}
          options={FARM_EXPENSE_CATEGORIES.map((c) => ({ value: c, label: t(`expenses.categories.${c}`) }))}
          onChange={setCategory}
        />
        <Input
          label={t('expenses.amountLabel')}
          keyboardType="number-pad"
          value={amount}
          onChangeText={setAmount}
        />
        <DateFieldInput label={t('expenses.dateLabel')} value={spentOn} onChangeText={setSpentOn} />
        <Input
          label={t('expenses.descriptionLabel')}
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
        />
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button label={t('common.cancel')} variant="ghost" fullWidth onPress={onCancel} disabled={loading} />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t('expenses.submit')}
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading || !valid}
              onPress={() =>
                onSubmit({
                  category: category as FarmExpenseCategory,
                  amount: amountNum,
                  spentOn,
                  description: description.trim() || undefined,
                })
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
