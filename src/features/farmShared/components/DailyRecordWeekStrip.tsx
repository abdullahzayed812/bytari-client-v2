import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

/** Mirrors the backend's `DAILY_RECORDS_PER_BATCH`. */
export const DAILY_RECORDS_PER_BATCH = 7;

export interface WeekStripRecord {
  id: string;
  recordDate: string;
  dayNumber?: number | null;
}

export interface DailyRecordWeekStripProps<R extends WeekStripRecord> {
  records: R[];
  renderRecord: (record: R, day: number) => ReactNode;
  /** Pressing the next empty day opens the add dialog. `undefined` → read-only. */
  onAddPress?: () => void;
  /** Business "today" already has a record → the next slot is shown but not pressable. */
  todayRecorded?: boolean;
}

/**
 * The batch's daily data as a horizontal, swipeable Day 1 … Day 7 sequence
 * (plain paged ScrollView — no carousel library). Filled days render the
 * caller's record card; the first empty day is the "add today's data" tile;
 * later days are placeholders. After Day 7 the backend refuses new records
 * (`DAILY_RECORD_LIMIT_REACHED`) — the tile just reflects that.
 */
export function DailyRecordWeekStrip<R extends WeekStripRecord>({
  records,
  renderRecord,
  onAddPress,
  todayRecorded = false,
}: DailyRecordWeekStripProps<R>) {
  const theme = useTheme();
  const { t } = useTranslation('farm');
  const { width } = useWindowDimensions();
  // ~1.15 cards per screen on phones (a peek of the next day), 2 on wide screens.
  const cardWidth = Math.min(340, Math.max(240, (width - theme.screenPadding * 2) / (width >= 700 ? 2.1 : 1.15)));

  const ordered = [...records].sort(
    (a, b) =>
      (a.dayNumber ?? Number.MAX_SAFE_INTEGER) - (b.dayNumber ?? Number.MAX_SAFE_INTEGER) ||
      a.recordDate.localeCompare(b.recordDate),
  );
  const filled = ordered.slice(0, DAILY_RECORDS_PER_BATCH);
  const full = ordered.length >= DAILY_RECORDS_PER_BATCH;
  const slots = Array.from({ length: DAILY_RECORDS_PER_BATCH }, (_, i) => i + 1);

  return (
    <View style={{ rowGap: theme.spacing.xs }}>
      <Caption>
        {full
          ? t('daily.weekComplete')
          : t('daily.weekProgress', { done: filled.length, total: DAILY_RECORDS_PER_BATCH })}
      </Caption>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + theme.spacing.sm}
        decelerationRate="fast"
        contentContainerStyle={{ columnGap: theme.spacing.sm, paddingVertical: theme.spacing.xs }}
      >
        {slots.map((day) => {
          const record = filled[day - 1];
          if (record) {
            return (
              <View key={record.id} style={{ width: cardWidth }}>
                {renderRecord(record, day)}
              </View>
            );
          }
          const isNext = day === filled.length + 1;
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
