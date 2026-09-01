import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { publicationSpeciesIcon } from '../constants';
import type { PublicPublication } from '../types';

import { PublicationKindBadge } from './PublicationKindBadge';

export interface PublicationCardProps {
  publication: PublicPublication;
  onPress?: () => void;
}

/**
 * Presentation-only public-listing row. Renders ONLY the public DTO fields
 * (animal name / species / breed, kind, published date) — no owner identity,
 * no status, no contact info (the backend exposes none). No image field exists
 * on the model, so a species-icon tile stands in.
 */
export function PublicationCard({ publication, onPress }: PublicationCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('publications');
  const { animal } = publication;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('card.open', { name: animal.name })}
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
          width: 48,
          height: 48,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={publicationSpeciesIcon(animal.species)} size="iconMd" color="primary" />
      </View>

      <View style={{ flex: 1, rowGap: 4 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {animal.name}
        </Text>
        <Caption numberOfLines={1}>
          {t(`species.${animal.species}`, { defaultValue: animal.species })}
          {animal.breed ? ` · ${animal.breed}` : ''}
        </Caption>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: theme.spacing.xs,
            marginTop: 2,
          }}
        >
          <PublicationKindBadge kind={publication.kind} />
          <Caption>{formatDate(publication.publishedAt)}</Caption>
        </View>
      </View>

      <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
    </Pressable>
  );
}
