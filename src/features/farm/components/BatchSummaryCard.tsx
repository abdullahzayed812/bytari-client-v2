import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import type { BatchSummary } from '../types';

interface Props {
  summary: BatchSummary;
  canManage: boolean;
  onAddDaily: () => void;
  onWeeklyReport: () => void;
  onSell: () => void;
  selling?: boolean;
}

/** The "الدفعة رقم N" card — every figure is server-computed. */
export function BatchSummaryCard({
  summary,
  canManage,
  onAddDaily,
  onWeeklyReport,
  onSell,
  selling,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const isActive = summary.status === 'ACTIVE';

  const ageText =
    summary.ageMonths >= 1
      ? t('batch.ageMonths', { count: summary.ageMonths })
      : summary.ageWeeks >= 1
        ? t('batch.ageWeeks', { count: summary.ageWeeks })
        : t('batch.ageDays', { count: summary.ageDays });

  const weightText = summary.averageWeightGrams
    ? `${Math.round(Number(summary.averageWeightGrams))}g`
    : t('details.notAvailable');
  const profitText =
    summary.estimatedProfit == null
      ? t('batch.noProfit')
      : `${summary.estimatedProfit.toLocaleString()} ${t('batch.profitUnit')}`;

  const cells = [
    {
      icon: 'people-outline' as const,
      label: t('batch.currentCount'),
      value: summary.currentBirdCount.toLocaleString(),
      unit: t('batch.currentUnit'),
    },
    { icon: 'calendar-outline' as const, label: t('batch.age'), value: ageText },
    { icon: 'scale-outline' as const, label: t('batch.avgWeight'), value: weightText },
    { icon: 'cash-outline' as const, label: t('batch.estimatedProfit'), value: profitText },
  ];

  return (
    <View
      style={{
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.lg,
        rowGap: theme.spacing.md,
        ...theme.shadows.card,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="subtitle" weight="bold">
          {summary.batchNumber != null
            ? t('batch.title', { number: summary.batchNumber })
            : t('batch.titleNoNumber')}
        </Text>
        <Badge
          label={isActive ? t('batch.statusActive') : t('batch.statusClosed')}
          tone={isActive ? 'success' : 'neutral'}
        />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {cells.map((c) => (
          <View
            key={c.label}
            style={{
              flexGrow: 1,
              flexBasis: '45%',
              minWidth: 130,
              rowGap: 2,
              padding: theme.spacing.md,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}
            >
              <Icon name={c.icon} size="iconXs" color="primary" />
              <Caption>{c.label}</Caption>
            </View>
            <Text variant="bodyStrong">{c.value}</Text>
            {c.unit ? <Caption>{c.unit}</Caption> : null}
          </View>
        ))}
      </View>

      {canManage ? (
        <View style={{ rowGap: theme.spacing.sm }}>
          <Button
            label={t('batch.addDaily')}
            leftIcon="add-circle-outline"
            fullWidth
            onPress={onAddDaily}
          />
          <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button
                label={t('batch.weeklyReport')}
                variant="outline"
                leftIcon="stats-chart-outline"
                fullWidth
                onPress={onWeeklyReport}
              />
            </View>
            {isActive ? (
              <View style={{ flex: 1 }}>
                <Button
                  label={t('batch.sellBatch')}
                  variant="outline"
                  leftIcon="cart-outline"
                  fullWidth
                  loading={selling}
                  onPress={onSell}
                />
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
