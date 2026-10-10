import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { formatPetCode } from '@/features/pets/petCode';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { ANIMAL_STATUS_TONE, animalSpeciesIcon } from '../constants';
import type { ClinicPet } from '../types';

/**
 * A clinic-pets list row, or a pet opened by its ID (`clinic-pets/lookup`),
 * which carries no clinic activity / status / owner — those lines are skipped.
 */
export type AnimalCardPet = Pick<ClinicPet, 'animalId' | 'publicCode' | 'ownerName'> & {
  animal: Pick<ClinicPet['animal'], 'name' | 'species' | 'breed' | 'photoUrl'> & {
    status?: string;
  };
  lastActivityAt?: string | null;
};

export interface AnimalCardProps {
  pet: AnimalCardPet;
  onPress?: () => void;
}

/**
 * Presentation-only row for one of the clinic's pets — the fields the backend
 * returns on the `clinic-pets` list item: photo, name, species, breed, current
 * owner, short public ID, this clinic's latest activity, animal status.
 */
export function AnimalCard({ pet, onPress }: AnimalCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('orgAnimals');
  const species = pet.animal.species;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('card.open', { name: pet.animal.name })}
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
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {pet.animal.photoUrl ? (
          <Image
            source={{ uri: pet.animal.photoUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Icon name={animalSpeciesIcon(species)} size="iconMd" color="primary" />
        )}
      </View>

      <View style={{ flex: 1, rowGap: 4 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {pet.animal.name}
        </Text>
        <Caption numberOfLines={1}>
          {[t(`species.${species}`, { defaultValue: species }), pet.animal.breed]
            .filter(Boolean)
            .join(' · ')}
        </Caption>
        {pet.ownerName ? (
          <Caption numberOfLines={1} color="textMuted">
            {t('card.owner', { name: pet.ownerName })}
          </Caption>
        ) : null}
        <Caption numberOfLines={1} color="textMuted" selectable>
          {`#${formatPetCode(pet.publicCode)}`}
        </Caption>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: theme.spacing.xs,
            flexWrap: 'wrap',
            marginTop: 2,
          }}
        >
          {pet.lastActivityAt ? (
            <Caption color="textMuted">
              {t('card.lastActivity', { date: formatDate(pet.lastActivityAt) })}
            </Caption>
          ) : null}
          {pet.animal.status && pet.animal.status !== 'ACTIVE' ? (
            <Badge
              label={t(`animalStatus.${pet.animal.status}`, {
                defaultValue: pet.animal.status,
              })}
              tone={ANIMAL_STATUS_TONE[pet.animal.status] ?? 'neutral'}
              size="sm"
            />
          ) : null}
        </View>
      </View>

      <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
    </Pressable>
  );
}
