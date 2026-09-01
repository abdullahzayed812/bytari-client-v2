import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { UserName } from '@/features/users/components';
import { useTheme } from '@/theme';

import { displayDateOnly, recordedByThisClinic } from '../constants';
import type { MedicalRecord } from '../types';

export interface MedicalRecordCardProps {
  record: MedicalRecord;
  /** Current CLINIC context, if any — decides the "recorded here" badge. */
  organizationId?: string;
  onPress?: () => void;
}

/** Presentation-only medical-record row. Renders only backend DTO fields. */
export function MedicalRecordCard({ record, organizationId, onPress }: MedicalRecordCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const mine = recordedByThisClinic(record, organizationId);
  // The diagnosis gets its own line; the summary uses the next non-empty field
  // so nothing is shown twice.
  const summary = record.reason || record.treatment || record.notes || '';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('records.openLabel', { date: displayDateOnly(record.visitDate) })}
      onPress={onPress}
      style={({ pressed }) => [
        {
          padding: theme.spacing.lg,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          rowGap: 6,
          ...theme.shadows.xs,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
        <Icon name="medkit-outline" size="iconSm" color="primary" />
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          {displayDateOnly(record.visitDate)}
        </Text>
        {organizationId ? (
          <Badge
            label={mine ? t('records.recordedHere') : t('records.recordedElsewhere')}
            tone={mine ? 'success' : 'neutral'}
            size="sm"
          />
        ) : null}
      </View>

      {record.diagnosis ? (
        <Text variant="body" numberOfLines={1}>
          {t('records.fieldDiagnosis')}: {record.diagnosis}
        </Text>
      ) : null}
      {summary ? (
        <Caption numberOfLines={2}>{summary}</Caption>
      ) : !record.diagnosis ? (
        <Caption>{t('records.noSummary')}</Caption>
      ) : null}
      {record.recordedByUserId ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
          <Caption>{t('records.recordedBy')}</Caption>
          <UserName userId={record.recordedByUserId} variant="caption" />
        </View>
      ) : null}
    </Pressable>
  );
}
