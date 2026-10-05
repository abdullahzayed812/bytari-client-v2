import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Icon, type IconName } from '@/components/content';
import { Loading } from '@/components/feedback';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useOrganizations } from '@/features/organizations';
import type { FarmSpecies, MyOrganization } from '@/features/organizations/types';
import { useTheme } from '@/theme';

const SPECIES_ICON: Record<FarmSpecies, IconName> = {
  POULTRY: 'egg-outline',
  SHEEP: 'paw-outline',
  CATTLE: 'paw-outline',
  MIXED: 'leaf-outline',
};

/**
 * "المزارع والحقول" under the My Pets list — the farms / fields linked to the
 * signed-in account. Reuses `GET /organizations?scope=farm_section` (the same
 * backend scope as the farm landings): only farms the user OWNS or works at as
 * STAFF, never anyone else's. Nothing is duplicated — each row opens the
 * existing species-correct farm dashboard.
 */
export function MyFarmsSection() {
  const theme = useTheme();
  const { t } = useTranslation('pets');
  const q = useOrganizations({ scope: 'farm_section', pageSize: 50 });
  const farms = useMemo(() => q.organizations.filter((o) => o.type === 'FARM'), [q.organizations]);

  return (
    <View style={{ marginTop: theme.spacing.xl, rowGap: theme.spacing.sm }}>
      <View style={{ rowGap: 2 }}>
        <Text variant="bodyStrong">{t('list.farmsTitle')}</Text>
        <Caption color="textSecondary">{t('list.farmsSubtitle')}</Caption>
      </View>
      {q.isLoading ? (
        <Loading />
      ) : q.isError ? (
        <Caption color="danger">{t('list.farmsError')}</Caption>
      ) : farms.length === 0 ? (
        <Caption color="textMuted">{t('list.farmsEmpty')}</Caption>
      ) : (
        farms.map((farm) => <FarmRow key={farm.id} farm={farm} />)
      )}
    </View>
  );
}

function FarmRow({ farm }: { farm: MyOrganization }) {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const species = farm.farmSpecies ?? null;
  const place = farm.location ?? farm.governorate ?? farm.address ?? null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={farm.name}
      onPress={() => router.push(Routes.farmDashboard(farm.id, species))}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {farm.imageUrl ? (
          <Image
            source={{ uri: farm.imageUrl }}
            style={{ width: 52, height: 52 }}
            contentFit="cover"
          />
        ) : (
          <Icon
            name={species ? SPECIES_ICON[species] : 'leaf-outline'}
            size="iconMd"
            color="primary"
          />
        )}
      </View>
      <View style={{ flex: 1, rowGap: 2 }}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {farm.name}
        </Text>
        {place ? (
          <Caption color="textSecondary" numberOfLines={1}>
            {place}
          </Caption>
        ) : null}
      </View>
      {species ? <Badge label={t(`card.farmSpecies.${species}`)} tone="primary" size="sm" /> : null}
      <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
    </Pressable>
  );
}
