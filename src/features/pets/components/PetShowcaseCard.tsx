import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { petAge } from '../constants';
import type { Pet } from '../types';

import { PetImage } from './PetImage';

export interface PetShowcaseCardProps {
  pet: Pet;
  /** Fixed width so the parent carousel can page cleanly. */
  width: number;
  onPress?: () => void;
}

const SEX_ICON: Record<Pet['sex'], IconName> = {
  MALE: 'male',
  FEMALE: 'female',
  UNKNOWN: 'help',
};

function InfoChip({ icon, label }: { icon: IconName; label: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: theme.spacing.xs,
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
      }}
    >
      <Icon name={icon} size="iconXs" color="primary" />
      <Text variant="overline" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

/**
 * A single pet in the Pets-landing "my profiles" carousel — the reference's
 * white rounded card: status dot + name, species · breed, and info chips, with
 * the pet image (or a species placeholder) at the end edge. Presentational only.
 */
export function PetShowcaseCard({ pet, width, onPress }: PetShowcaseCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('pets');
  const age = petAge(pet.dateOfBirth);

  const ageLabel = age
    ? age.years > 0
      ? t('detail.ageYears', { count: age.years })
      : age.months > 0
        ? t('detail.ageMonths', { count: age.months })
        : t('detail.ageNewborn')
    : null;
  const isArchived = pet.status === 'DEACTIVATED';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('landing.petOpenA11y', { name: pet.name })}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width,
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
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={{ flex: 1, rowGap: theme.spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: theme.radius.pill,
              backgroundColor: isArchived ? theme.colors.textMuted : theme.colors.primary,
            }}
          />
          <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
            {pet.name}
          </Text>
        </View>

        <Caption numberOfLines={1}>
          {t(`species.${pet.species}`)}
          {pet.breed ? ` · ${pet.breed}` : ` · ${t('card.unknownBreed')}`}
        </Caption>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: theme.spacing.xs,
            marginTop: theme.spacing.xs,
          }}
        >
          {ageLabel ? <InfoChip icon="calendar-outline" label={ageLabel} /> : null}
          {pet.sex !== 'UNKNOWN' ? (
            <InfoChip icon={SEX_ICON[pet.sex]} label={t(`sex.${pet.sex}`)} />
          ) : null}
        </View>
      </View>

      <PetImage uri={null} species={pet.species} size={92} rounded="lg" />
    </Pressable>
  );
}
