import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { UserName } from '@/features/users/components';
import { useTheme } from '@/theme';

import { displayDateOnly, recordedByThisClinic } from '../constants';
import type { Vaccination } from '../types';

export interface VaccinationCardProps {
  vaccination: Vaccination;
  organizationId?: string;
  onPress?: () => void;
}

/** Presentation-only vaccination row. Renders only backend DTO fields. */
export function VaccinationCard({ vaccination, organizationId, onPress }: VaccinationCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const mine = recordedByThisClinic(vaccination, organizationId);
  const overdue = Boolean(
    vaccination.nextDueOn && vaccination.nextDueOn < new Date().toISOString().slice(0, 10),
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('vaccinations.openLabel', { name: vaccination.vaccineName })}
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
        <Icon name="shield-checkmark-outline" size="iconSm" color="primary" />
        <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
          {vaccination.vaccineName}
        </Text>
        {organizationId ? (
          <Badge
            label={mine ? t('vaccinations.recordedHere') : t('vaccinations.recordedElsewhere')}
            tone={mine ? 'success' : 'neutral'}
            size="sm"
          />
        ) : null}
      </View>

      <Caption>
        {t('vaccinations.fieldAdministeredOn')}: {displayDateOnly(vaccination.administeredOn)}
      </Caption>
      {vaccination.nextDueOn ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
          <Caption>
            {t('vaccinations.fieldNextDueOn')}: {displayDateOnly(vaccination.nextDueOn)}
          </Caption>
          {overdue ? <Badge label={t('vaccinations.overdue')} tone="warning" size="sm" /> : null}
        </View>
      ) : null}
      {vaccination.recordedByUserId ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
          <Caption>{t('vaccinations.recordedBy')}</Caption>
          <UserName userId={vaccination.recordedByUserId} variant="caption" />
        </View>
      ) : null}
    </Pressable>
  );
}
