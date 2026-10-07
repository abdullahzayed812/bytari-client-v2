import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { ANIMAL_STATUS_TONE, CLINIC_ACCESS_STATUS_TONE, animalSpeciesIcon } from '../constants';
import type { OrganizationAnimalGrant } from '../types';

export interface AnimalCardProps {
  grant: OrganizationAnimalGrant;
  onPress?: () => void;
}

/** The short identifier printed on cards — the UUID prefix the search accepts. */
export const shortAnimalId = (animalId: string): string => `#${animalId.slice(0, 8)}`;

/**
 * Presentation-only row for one of the clinic's patients — the fields the
 * backend returns on the `animal-access` list item: photo, name, species,
 * breed, current owner, short id, animal + access status.
 */
export function AnimalCard({ grant, onPress }: AnimalCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('orgAnimals');
  const species = grant.animal.species;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('card.open', { name: grant.animal.name })}
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
        {grant.animal.photoUrl ? (
          <Image
            source={{ uri: grant.animal.photoUrl }}
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
          {grant.animal.name}
        </Text>
        <Caption numberOfLines={1}>
          {[t(`species.${species}`, { defaultValue: species }), grant.animal.breed]
            .filter(Boolean)
            .join(' · ')}
        </Caption>
        {grant.ownerName ? (
          <Caption numberOfLines={1} color="textMuted">
            {t('card.owner', { name: grant.ownerName })}
          </Caption>
        ) : null}
        <Caption numberOfLines={1} color="textMuted" selectable>
          {shortAnimalId(grant.animalId)}
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
          <Badge
            label={t(`accessStatus.${grant.status}`)}
            tone={CLINIC_ACCESS_STATUS_TONE[grant.status]}
            size="sm"
          />
          {grant.animal.status !== 'ACTIVE' ? (
            <Badge
              label={t(`animalStatus.${grant.animal.status}`, {
                defaultValue: grant.animal.status,
              })}
              tone={ANIMAL_STATUS_TONE[grant.animal.status] ?? 'neutral'}
              size="sm"
            />
          ) : null}
        </View>
      </View>

      <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
    </Pressable>
  );
}
