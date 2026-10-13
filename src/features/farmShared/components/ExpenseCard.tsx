import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import type { FarmExpense } from '@/features/farm/types';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { EXPENSE_CATEGORY_ICON } from '../constants';

export function ExpenseCard({ expense, onPress }: { expense: FarmExpense; onPress?: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const amount = Number(expense.amount);
  const daily = expense.source === 'DAILY_RECORD' ? (expense.dailyRecord ?? null) : null;

  return (
    <Card variant="outlined" padding="md" onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon
            name={
              daily
                ? 'calendar-outline'
                : (EXPENSE_CATEGORY_ICON[expense.category] ?? 'ellipsis-horizontal')
            }
            size="iconMd"
            color="primary"
          />
        </View>
        <View style={{ flex: 1, rowGap: 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Caption>{t('expenses.dateLabel')}</Caption>
            <Caption>{t('expenses.amountLabel')}</Caption>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="bodyMedium">{formatDate(expense.spentOn)}</Text>
            <Text variant="bodyMedium" color="danger">
              {amount.toLocaleString()} {t('expenses.unit')}
            </Text>
          </View>
          <Text variant="bodyStrong">
            {daily ? t('expenses.dailyRecordTitle') : t(`expenses.categories.${expense.category}`)}
          </Text>
          {daily?.batchName ? (
            <Caption>{t('expenses.dailyRecordBatch', { name: daily.batchName })}</Caption>
          ) : null}
          {expense.description ? (
            <>
              <Caption>{t('expenses.descriptionLabel')}</Caption>
              <Text variant="caption">{expense.description}</Text>
            </>
          ) : null}
        </View>
      </View>
    </Card>
  );
}
