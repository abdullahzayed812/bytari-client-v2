import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { TextButton } from '@/components/actions';
import { Badge, Card, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import type { DailyRecordWeekSummary } from '../weeks';

export interface CompletedWeeksSectionProps {
  weeks: DailyRecordWeekSummary[];
  /** Weeks before this one are listed (the current week is on the strip above). */
  currentWeek: number;
  /** Renders that week's daily records when the card is expanded. */
  renderWeekRecords: (weekNumber: number) => ReactNode;
  /** e.g. "1,250 غ" / "320 كغ". */
  formatWeight?: (value: string) => string;
}

/**
 * "الأسابيع السابقة" — every finished week of a batch, below the batch card.
 * Each week keeps its server-computed summary and can expand to show its
 * daily records (fetched on demand by `renderWeekRecords`). Nothing is ever
 * deleted when a week closes.
 */
export function CompletedWeeksSection({
  weeks,
  currentWeek,
  renderWeekRecords,
  formatWeight = (v) => v,
}: CompletedWeeksSectionProps) {
  const theme = useTheme();
  const { t } = useTranslation('farm');
  const [open, setOpen] = useState<number | null>(null);
  const previous = weeks.filter((w) => w.weekNumber < currentWeek);
  if (previous.length === 0) return null;

  return (
    <View style={{ rowGap: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
        <Icon name="calendar-outline" size="iconSm" color="primary" />
        <Text variant="subtitle" weight="bold">
          {t('daily.completedWeeks')}
        </Text>
      </View>
      {previous.map((w) => {
        const expanded = open === w.weekNumber;
        return (
          <Card
            key={w.weekNumber}
            variant="outlined"
            padding="md"
            style={{ rowGap: theme.spacing.xs }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}
            >
              <Text variant="bodyStrong" style={{ flex: 1 }}>
                {t('daily.weekTitle', { week: w.weekNumber })}
              </Text>
              {w.complete ? <Badge tone="success" label={t('daily.weekCompleteBadge')} /> : null}
              <Caption>{t('daily.weekDays', { done: w.daysRecorded })}</Caption>
            </View>
            {w.firstDate && w.lastDate ? (
              <Caption color="textMuted">
                {t('daily.weekRange', { from: w.firstDate, to: w.lastDate })}
              </Caption>
            ) : null}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                columnGap: theme.spacing.md,
                rowGap: 2,
              }}
            >
              <Caption>{t('daily.weekMortality', { count: w.totalMortality })}</Caption>
              <Caption>{t('daily.weekFeed', { kg: w.totalFeedKg.toLocaleString() })}</Caption>
              <Caption>
                {t('daily.weekWater', { liters: w.totalWaterLiters.toLocaleString() })}
              </Caption>
              <Caption>
                {t('daily.weekExpenses', { amount: w.totalExpenses.toLocaleString() })}
              </Caption>
              {w.latestAverageWeight ? (
                <Caption>
                  {t('daily.weekWeight', { weight: formatWeight(w.latestAverageWeight) })}
                </Caption>
              ) : null}
            </View>
            <TextButton
              label={expanded ? t('daily.hideDays') : t('daily.showDays')}
              icon={expanded ? 'chevron-up' : 'chevron-down'}
              onPress={() => setOpen(expanded ? null : w.weekNumber)}
            />
            {expanded ? (
              <View style={{ rowGap: theme.spacing.sm }}>{renderWeekRecords(w.weekNumber)}</View>
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}
