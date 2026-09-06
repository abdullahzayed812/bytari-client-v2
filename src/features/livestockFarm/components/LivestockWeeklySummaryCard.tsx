import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

export interface LivestockWeeklySummaryLike {
  recordsCount: number;
  averageMortality: number;
  averageFeedKg: number;
  totalWaterLiters: number;
  totalFeedKg: number;
  weightChangeKg: number | null;
}

function round(n: number): string {
  return String(Math.round(n * 100) / 100);
}

/** The "ملخص الأسبوع" card — shared by Sheep and Cattle (mirrors `WeeklySummaryCard`, kg instead of grams). */
export function LivestockWeeklySummaryCard({ summary }: { summary: LivestockWeeklySummaryLike }) {
  const theme = useTheme();
  const { t } = useTranslation('sheepCattleFarm');

  const cells: { icon: Parameters<typeof Icon>[0]['name']; label: string; value: string }[] = [
    { icon: 'skull-outline', label: t('weekly.avgMortality'), value: `${round(summary.averageMortality)} ${t('weekly.mortalityUnit')}` },
    { icon: 'nutrition-outline', label: t('weekly.avgConsumption'), value: `${round(summary.averageFeedKg)} ${t('weekly.feedUnit')}` },
    { icon: 'water-outline', label: t('weekly.totalWater'), value: `${round(summary.totalWaterLiters)} ${t('weekly.waterUnit')}` },
    { icon: 'basket-outline', label: t('weekly.totalFeed'), value: `${round(summary.totalFeedKg)} ${t('weekly.feedUnit')}` },
    {
      icon: 'trending-up-outline',
      label: t('weekly.weightChange'),
      value: summary.weightChangeKg == null ? '—' : `${round(summary.weightChangeKg)}kg`,
    },
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
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
        <Icon name="stats-chart-outline" size="iconSm" color="primary" />
        <Text variant="subtitle" weight="bold">
          {t('weekly.title')}
        </Text>
      </View>

      {summary.recordsCount === 0 ? (
        <Caption>{t('weekly.empty')}</Caption>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {cells.map((c) => (
            <View
              key={c.label}
              style={{
                flexGrow: 1,
                flexBasis: '30%',
                minWidth: 100,
                rowGap: 2,
                padding: theme.spacing.sm,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surfaceMuted,
              }}
            >
              <Icon name={c.icon} size="iconXs" color="primary" />
              <Caption numberOfLines={1}>{c.label}</Caption>
              <Text variant="label" weight="bold">
                {c.value}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
