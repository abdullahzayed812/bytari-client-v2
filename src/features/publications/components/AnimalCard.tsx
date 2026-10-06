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
 * (age / gender / location). The corner badge is the kind ("مفقود" /
 * "متاح للتبني" / "متاح للتزاوج"). A RESOLVED listing (FOUND / ADOPTED /
 * MATED / CLOSED) stays in the list with the same design (photo NOT dimmed)
 * and a clear status strip («تم التبني» / «تم التزاوج» / «تم العثور عليه»)
 * across the top, but is NON-INTERACTIVE: pressing it opens nothing. There
 * is no delete control on the card — the owner finishes a listing with the
 * kind's completion action inside the listing.
 */
export function AnimalCard({ publication, kind, width, onPress, status }: AnimalCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('publications');
  const { animal } = publication;
  const meta = PUBLICATION_KIND_META[kind];
  const accent = theme.colors[meta.accent];
  const cover = animal.galleryUrls[0] ?? null;
  const location = kind === 'LOST' ? publication.lostDistrict : publication.city;
  const age = ageLabel(animal, t);
  const resolution = publication.resolution ?? null;
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
      accessibilityRole={resolution ? undefined : 'button'}
      accessibilityLabel={
        resolution
          ? `${animal.name} — ${t(`resolution.status.${resolution}`)}`
          : t('card.open', { name: animal.name })
      }
      accessibilityState={{ disabled: Boolean(resolution) }}
      disabled={Boolean(resolution)}
      onPress={resolution ? undefined : onPress}
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
        pressed && !resolution && { opacity: 0.85 },
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
        {resolution ? null : (
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
        )}

        {status && !resolution ? (
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

        {resolution ? (
          <View
            accessible
            accessibilityLabel={t(`resolution.status.${resolution}`)}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              columnGap: 4,
              paddingVertical: 6,
              backgroundColor:
                resolution === 'CLOSED' ? theme.colors.textMuted : theme.colors.success,
            }}
          >
            <Icon
              name={resolution === 'CLOSED' ? 'lock-closed' : 'checkmark-circle'}
              size="iconXs"
              color="onPrimary"
            />
            <Text variant="label" style={{ color: theme.colors.onPrimary }}>
              {t(`resolution.status.${resolution}`)}
            </Text>
          </View>
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
