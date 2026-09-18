import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { petAge } from '../constants';
import type { Pet } from '../types';

import { PetImage } from './PetImage';

export interface PetCardProps {
  pet: Pet;
  onPress?: () => void;
}

/**
 * Purely presentational pet row. **No API / query logic.** Shows only fields the
 * backend actually returns (name, species, breed, sex, DOB → rough age, status).
 */
export function PetCard({ pet, onPress }: PetCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('pets');
  const age = petAge(pet.dateOfBirth);

  const ageLabel = age
    ? age.years > 0
      ? age.months > 0
        ? t('detail.ageYearsMonths', { years: age.years, months: age.months })
        : t('detail.ageYears', { count: age.years })
      : age.months > 0
        ? t('detail.ageMonths', { count: age.months })
        : t('detail.ageNewborn')
    : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('card.open', { name: pet.name })}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.lg,
          padding: theme.spacing.lg,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.xs,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <PetImage uri={pet.galleryUrls?.[0] ?? null} species={pet.species} size={60} />

      <View style={{ flex: 1, rowGap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
            {pet.name}
          </Text>
          {pet.status === 'DEACTIVATED' ? (
            <Badge label={t('status.DEACTIVATED')} tone="neutral" size="sm" />
          ) : null}
        </View>

        <Caption numberOfLines={1}>
          {t(`species.${pet.species}`)}
          {pet.breed ? ` · ${pet.breed}` : ` · ${t('card.unknownBreed')}`}
        </Caption>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: theme.spacing.sm,
            marginTop: 2,
          }}
        >
          {pet.sex !== 'UNKNOWN' ? (
            <Badge label={t(`sex.${pet.sex}`)} tone="primary" size="sm" />
          ) : null}
          {ageLabel ? <Caption>{ageLabel}</Caption> : null}
        </View>
      </View>
    </Pressable>
  );
}
