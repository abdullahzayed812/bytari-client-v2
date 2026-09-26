import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { DailyRecordFooter } from '@/features/farmShared/components/DailyRecordFooter';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import type { CattleDailyRecord, SheepDailyRecord } from '../types';

interface RowProps {
  record: SheepDailyRecord | CattleDailyRecord;
  /** Fallback when the server's `dayNumber` is absent (older payload). */
  dayIndex: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

function trimNum(v: string): string {
  const n = Number(v);
  return Number.isFinite(n) ? String(Math.round(n * 100) / 100) : v;
}

/** A populated "اليوم N" card — shared by Sheep and Cattle (mirrors `DailyRecordCard`, plus sickCasesCount/feedType). */
export function LivestockDailyRecordCard({ record, dayIndex, onEdit, onDelete }: RowProps) {
  const theme = useTheme();
  const { t } = useTranslation('sheepCattleFarm');

  const rows: { label: string; value: string }[] = [
    { label: t('daily.feed'), value: `${trimNum(record.feedKg)} ${t('daily.feedUnit')}` },
    { label: t('daily.water'), value: `${trimNum(record.waterLiters)} ${t('daily.waterUnit')}` },
    { label: t('daily.mortality'), value: `${record.mortalityCount} ${t('daily.mortalityUnit')}` },
    { label: t('daily.activity'), value: record.activity ? t(`daily.activityLevels.${record.activity}`) : t('daily.none') },
    { label: t('daily.sickCasesCount'), value: record.sickCasesCount != null ? String(record.sickCasesCount) : '0' },
    { label: t('daily.appetite'), value: record.appetite ? t(`daily.appetiteLevels.${record.appetite}`) : t('daily.none') },
    { label: t('daily.feedType'), value: record.feedType ? t(`daily.feedTypes.${record.feedType}`) : t('daily.none') },
    { label: t('daily.treatment'), value: record.treatment ?? t('daily.none') },
    { label: t('daily.expense'), value: `${trimNum(record.expenseAmount)} ${t('daily.expenseUnit')}` },
    { label: t('daily.notes'), value: record.notes ?? t('daily.none') },
    { label: t('daily.dateLabel'), value: formatDate(record.recordDate) },
  ];

  return (
    <View
      style={{
        flex: 1,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.successSoft,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        rowGap: theme.spacing.xs,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
        <Icon name="checkmark-circle" size="iconSm" color="success" />
        <Text variant="label" weight="bold">
          {t('daily.dayLabel', { index: String(record.dayNumber ?? dayIndex).padStart(2, '0') })}
        </Text>
        <Caption style={{ marginStart: 'auto' }}>{formatDate(record.recordDate)}</Caption>
      </View>
      {rows.map((r) => (
        <View key={r.label} style={{ flexDirection: 'row', justifyContent: 'space-between', columnGap: theme.spacing.md }}>
          <Caption style={{ flexShrink: 1 }}>{r.label}</Caption>
          <Text variant="caption" numberOfLines={1} style={{ flexShrink: 1, textAlign: 'right' }}>
            {r.value}
          </Text>
        </View>
      ))}
      <DailyRecordFooter createdBy={record.createdBy} onEdit={onEdit} onDelete={onDelete} />
    </View>
  );
}

/** The empty "اليوم N" tile. Mirrors `DailyRecordEmptyCard` exactly. */
export function LivestockDailyRecordEmptyCard({ dayIndex, date, onPress }: { dayIndex: number; date?: string; onPress?: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation('sheepCattleFarm');
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? t('daily.emptyBody') : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flex: 1,
          minHeight: 160,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: theme.colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          rowGap: theme.spacing.xs,
          padding: theme.spacing.lg,
        },
        pressed && onPress ? { opacity: 0.7 } : null,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
        <Icon name="calendar-outline" size="iconXs" color="textMuted" />
        <Caption>
          {t('daily.dayLabel', { index: String(dayIndex).padStart(2, '0') })}
          {date ? ` · ${formatDate(date)}` : ''}
        </Caption>
      </View>
      <Icon name="clipboard-outline" size="iconLg" color="textMuted" />
      <Text variant="label" color="textMuted">
        {t('daily.emptyTitle')}
      </Text>
      <Caption center>{t('daily.emptyBody')}</Caption>
    </Pressable>
  );
}
