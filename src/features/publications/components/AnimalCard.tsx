import { Image } from 'expo-image';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Pressable, View, type DimensionValue } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import {
  PUBLICATION_KIND_META,
  PUBLICATION_STATUS_TONE,
  publicationSpeciesIcon,
} from '../constants';
import type { PublicationKind, PublicationStatus, PublicPublication } from '../types';

export interface AnimalCardProps {
  publication: PublicPublication;
  kind: PublicationKind;
  width: DimensionValue;
  onPress: () => void;
  /** "My Listings" view — show the moderation status pill. */
  status?: PublicationStatus;
  /** "My Listings" view — show a delete affordance on the card. */
  onDelete?: () => void;
}

/** Age label from the joined animal — falls back to the age-estimate bucket. */
function ageLabel(
  animal: PublicPublication['animal'],
  t: TFunction<'publications'>,
): string | null {
  if (animal.ageEstimate) return t(`ageEstimate.${animal.ageEstimate}`);
  if (!animal.dateOfBirth) return null;
  const months =
    (Date.now() - new Date(animal.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 30.4);
  if (months < 12) return t('card.ageMonths', { count: Math.max(1, Math.round(months)) });
  return t('card.ageYears', { count: Math.round(months / 12) });
}

/**
 * The list-screen card — image, name/breed, and a 3-icon info row
 * (age / gender / location), matching the reference grid exactly. The
 * top-corner badge is the kind's single real state — "مفقود" for LOST,
 * "متاح للتبني" for ADOPTION, "متاح للتزاوج" for MATING (no
 * found/adopted/mated tracking exists on the backend, so every APPROVED
 * listing of a kind shows the same badge — no fake per-card state).
 */
export function AnimalCard({
  publication,
  kind,
  width,
  onPress,
  status,
  onDelete,
}: AnimalCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('publications');
  const { animal } = publication;
  const meta = PUBLICATION_KIND_META[kind];
  const accent = theme.colors[meta.accent];
  const cover = animal.galleryUrls[0] ?? null;
  const location = kind === 'LOST' ? publication.lostDistrict : publication.city;
  const age = ageLabel(animal, t);
  const statusColor = status
    ? theme.colors[
        PUBLICATION_STATUS_TONE[status] === 'success'
          ? 'success'
          : PUBLICATION_STATUS_TONE[status] === 'danger'
            ? 'danger'
            : 'warning'
      ]
    : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('card.open', { name: animal.name })}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: 'hidden',
          ...theme.shadows.xs,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={{ aspectRatio: 1, backgroundColor: theme.colors.surfaceAccent }}>
        {cover ? (
          <Image
            source={cover}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={publicationSpeciesIcon(animal.species)} size="iconXl" color="primary" />
          </View>
        )}
        <View
          style={{
            position: 'absolute',
            top: theme.spacing.sm,
            left: theme.spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: 4,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.pill,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: 4,
            ...theme.shadows.xs,
          }}
        >
          <Icon name={meta.icon} size="iconXs" color={meta.accent} />
          <Text variant="overline" style={{ color: accent }}>
            {t(`card.badge.${kind}`)}
          </Text>
        </View>

        {status ? (
          <View
            style={{
              position: 'absolute',
              top: theme.spacing.sm,
              right: theme.spacing.sm,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.pill,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: 4,
              ...theme.shadows.xs,
            }}
          >
            <Text variant="overline" style={{ color: statusColor }}>
              {t(`status.${status}`)}
            </Text>
          </View>
        ) : null}

        {onDelete ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('mine.delete')}
            onPress={onDelete}
            hitSlop={8}
            style={{
              position: 'absolute',
              bottom: theme.spacing.sm,
              right: theme.spacing.sm,
              width: 30,
              height: 30,
              borderRadius: 15,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.surface,
              ...theme.shadows.xs,
            }}
          >
            <Icon name="trash-outline" size="iconXs" color="danger" />
          </Pressable>
        ) : null}
      </View>

      <View style={{ padding: theme.spacing.md, rowGap: 4 }}>
        <Text variant="bodyStrong" numberOfLines={1} style={{ color: accent }}>
          {animal.name}
        </Text>
        <Caption numberOfLines={1}>
          {t(`species.${animal.species}`, { defaultValue: animal.species })}
          {animal.breed ? ` · ${animal.breed}` : ''}
        </Caption>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: theme.spacing.xs,
            paddingTop: theme.spacing.xs,
            borderTopWidth: theme.sizes.hairline,
            borderTopColor: theme.colors.divider,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 3 }}>
            <Icon name="calendar-outline" size="iconXs" color="textMuted" />
            <Caption numberOfLines={1}>{age ?? '—'}</Caption>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 3 }}>
            <Icon
              name={animal.sex === 'FEMALE' ? 'female' : 'male'}
              size="iconXs"
              color="textMuted"
            />
            <Caption numberOfLines={1}>
              {t(`sex.${animal.sex}`, { defaultValue: animal.sex })}
            </Caption>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 3 }}>
            <Icon name="location-outline" size="iconXs" color="textMuted" />
            <Caption numberOfLines={1} style={{ maxWidth: 56 }}>
              {location ?? '—'}
            </Caption>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
