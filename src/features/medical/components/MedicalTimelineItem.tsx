import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { UserName } from '@/features/users/components';
import { useTheme } from '@/theme';

import { displayDateOnly, recordedByThisClinic } from '../constants';
import type { MedicalTimelineEntry } from '../types';

export interface MedicalTimelineItemProps {
  entry: MedicalTimelineEntry;
  /** Current CLINIC context, if any — decides the "recorded here" badge. */
  organizationId?: string;
  onPress?: () => void;
}

/** One chronological entry — a medical record or a vaccination. Backend fields only. */
export function MedicalTimelineItem({ entry, organizationId, onPress }: MedicalTimelineItemProps) {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const isRecord = entry.type === 'MEDICAL_RECORD';
  const mine = recordedByThisClinic(entry, organizationId);

  const title = isRecord
    ? entry.medicalRecord?.diagnosis || entry.medicalRecord?.reason || t('timeline.recordFallback')
    : entry.vaccination?.vaccineName || t('timeline.vaccinationFallback');

  const subtitle = isRecord
    ? entry.medicalRecord?.reason && entry.medicalRecord?.diagnosis
      ? entry.medicalRecord.reason
      : (entry.medicalRecord?.treatment ?? '')
    : entry.vaccination?.nextDueOn
      ? t('vaccinations.fieldNextDueOn') + ': ' + displayDateOnly(entry.vaccination.nextDueOn)
      : '';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('timeline.openLabel', {
        kind: t(`timeline.type.${entry.type}`),
        date: displayDateOnly(entry.occurredOn),
      })}
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
        <Icon
          name={isRecord ? 'medkit-outline' : 'shield-checkmark-outline'}
          size="iconSm"
          color="primary"
        />
        <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
          {displayDateOnly(entry.occurredOn)}
        </Text>
        <Badge
          label={t(`timeline.type.${entry.type}`)}
          tone={isRecord ? 'primary' : 'info'}
          size="sm"
        />
        {organizationId ? (
          <Badge
            label={mine ? t('records.recordedHere') : t('records.recordedElsewhere')}
            tone={mine ? 'success' : 'neutral'}
            size="sm"
          />
        ) : null}
      </View>

      <Text variant="body" numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? <Caption numberOfLines={1}>{subtitle}</Caption> : null}

      {entry.recordedByUserId ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
          <Caption>{t('timeline.recordedBy')}</Caption>
          <UserName userId={entry.recordedByUserId} variant="caption" />
        </View>
      ) : null}
    </Pressable>
  );
}
