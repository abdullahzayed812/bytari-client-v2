import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

/** Mirrors the backend's `DAYS_PER_WEEK` — daily data runs in 7-day weekly cycles. */
export const DAILY_RECORDS_PER_BATCH = 7;

export interface WeekStripRecord {
  id: string;
  recordDate: string;
  /** Batch-relative week (server-assigned). */
  weekNumber?: number | null;
  /** Day within the week, 1 … 7 (server-assigned). */
  dayNumber?: number | null;
}

export interface DailyRecordWeekStripProps<R extends WeekStripRecord> {
  /** The records of ONE week (the current week on the batch card). */
  records: R[];
  /** Which week this strip shows — titles the strip ("الأسبوع 2"). */
  weekNumber?: number;
  renderRecord: (record: R, day: number) => ReactNode;
  /** Pressing the next empty day opens the add dialog. `undefined` → read-only. */
  onAddPress?: () => void;
  /** Business "today" already has a record → the next slot is shown but not pressable. */
  todayRecorded?: boolean;
}

/**
 * One week of a batch's daily data as a horizontal, swipeable Day 1 … Day 7
 * sequence (plain paged ScrollView — no carousel library). Filled days render
 * the caller's record card at their server-assigned day; the next empty day is
 * the "add today's data" tile; later days are placeholders. After Day 7 the
 * server starts the next week automatically — the caller then passes that
 * week's (empty) records and the finished week moves to the history list.
 */
export function DailyRecordWeekStrip<R extends WeekStripRecord>({
  records,
  weekNumber,
  renderRecord,
  onAddPress,
  todayRecorded = false,
}: DailyRecordWeekStripProps<R>) {
  const theme = useTheme();
  const { t } = useTranslation('farm');
  const { width } = useWindowDimensions();
  // ~1.15 cards per screen on phones (a peek of the next day), 2 on wide screens.
  const cardWidth = Math.min(
    340,
    Math.max(240, (width - theme.screenPadding * 2) / (width >= 700 ? 2.1 : 1.15)),
  );

  const ordered = [...records].sort(
    (a, b) =>
      (a.dayNumber ?? Number.MAX_SAFE_INTEGER) - (b.dayNumber ?? Number.MAX_SAFE_INTEGER) ||
      a.recordDate.localeCompare(b.recordDate),
  );
  // Place each record on its server-assigned day; records without one (older
  // payloads) fill the remaining slots in order.
  const byDay = new Map<number, R>();
  const unplaced: R[] = [];
  for (const r of ordered) {
    const d = r.dayNumber;
    if (d != null && d >= 1 && d <= DAILY_RECORDS_PER_BATCH && !byDay.has(d)) byDay.set(d, r);
    else unplaced.push(r);
  }
  for (let d = 1; d <= DAILY_RECORDS_PER_BATCH && unplaced.length > 0; d += 1) {
    if (!byDay.has(d)) byDay.set(d, unplaced.shift() as R);
  }
  const filledCount = byDay.size;
  const lastFilled = Math.max(0, ...byDay.keys());
  const full = filledCount >= DAILY_RECORDS_PER_BATCH;
  const slots = Array.from({ length: DAILY_RECORDS_PER_BATCH }, (_, i) => i + 1);

  return (
    <View style={{ rowGap: theme.spacing.xs }}>
      {weekNumber ? (
        <Text variant="label" weight="bold" color="primary">
          {t('daily.weekTitle', { week: weekNumber })}
        </Text>
      ) : null}
      <Caption>
        {full
          ? t('daily.weekComplete')
          : t('daily.weekProgress', { done: filledCount, total: DAILY_RECORDS_PER_BATCH })}
      </Caption>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + theme.spacing.sm}
        decelerationRate="fast"
        contentContainerStyle={{ columnGap: theme.spacing.sm, paddingVertical: theme.spacing.xs }}
      >
        {slots.map((day) => {
          const record = byDay.get(day);
          if (record) {
            return (
              <View key={record.id} style={{ width: cardWidth }}>
                {renderRecord(record, day)}
              </View>
            );
          }
          const isNext = day === lastFilled + 1;
          const pressable = isNext && Boolean(onAddPress) && !todayRecorded;
          return (
            <Pressable
              key={`empty-${day}`}
              accessibilityRole={pressable ? 'button' : undefined}
              accessibilityLabel={pressable ? t('daily.addToday') : undefined}
              disabled={!pressable}
              onPress={onAddPress}
              style={({ pressed }) => [
                {
                  width: cardWidth,
                  minHeight: 180,
                  borderRadius: theme.radius.lg,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: isNext ? theme.colors.primary : theme.colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  rowGap: theme.spacing.xs,
                  padding: theme.spacing.lg,
                },
                pressed && pressable ? { opacity: 0.7 } : null,
              ]}
            >
              <Text variant="label" weight="bold" color={isNext ? 'primary' : 'textMuted'}>
                {t('daily.day', { day })}
              </Text>
              <Icon
                name={pressable ? 'add-circle-outline' : 'calendar-outline'}
                size="iconLg"
                color={pressable ? 'primary' : 'textMuted'}
              />
              <Caption center>
                {isNext
                  ? todayRecorded
                    ? t('daily.comeBackTomorrow')
                    : onAddPress
                      ? t('daily.addToday')
                      : t('daily.noData')
                  : t('daily.noData')}
              </Caption>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
