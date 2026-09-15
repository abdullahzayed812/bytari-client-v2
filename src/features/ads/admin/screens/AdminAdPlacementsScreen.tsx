import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { Card, Icon } from '@/components/content';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { AD_PLACEMENTS, type AdPlacement } from '../../types';

/**
 * Route `/(app)/admin/ads` — pick which app section's ads to manage. There is
 * no per-placement authorization scope: `advertisement.manage` (ADMIN or an
 * ACTIVE ADVERTISEMENT system-supervisor) governs every placement, so every
 * placement is listed here.
 */
export default function AdminAdPlacementsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('ads');

  return (
    <SafeAreaScreen>
      <AppHeader title={t('admin.title')} showBack />
      <FlatList
        data={AD_PLACEMENTS}
        keyExtractor={(p) => p}
        contentContainerStyle={{
          padding: theme.screenPadding,
          rowGap: theme.spacing.sm,
          paddingBottom: theme.spacing.huge,
        }}
        ListHeaderComponent={
          <Caption style={{ marginBottom: theme.spacing.sm }}>{t('admin.placementsHint')}</Caption>
        }
        renderItem={({ item }: { item: AdPlacement }) => (
          <Card
            variant="outlined"
            padding="md"
            onPress={() => router.push(Routes.adminAdPlacement(item))}
            accessibilityLabel={t(`placements.${item}`)}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Text variant="bodyStrong">{t(`placements.${item}`)}</Text>
              <Icon name="chevron-back-outline" size="iconSm" color="textMuted" />
            </View>
          </Card>
        )}
      />
    </SafeAreaScreen>
  );
}
