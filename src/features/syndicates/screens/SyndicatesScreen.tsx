import { router } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { Card, Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { useMainSyndicates } from '../hooks';

/**
 * Route `/(app)/syndicates` — entry point wired to the "النقابة" tile. There
 * is normally exactly one main syndicate, so this screen goes straight to it;
 * it only falls back to a picker list if more than one exists.
 */
export default function SyndicatesScreen() {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const q = useMainSyndicates();

  useEffect(() => {
    const only = q.syndicates.length === 1 ? q.syndicates[0] : undefined;
    if (only) router.replace(Routes.syndicateMain(only.id));
  }, [q.syndicates]);

  if (q.isLoading || q.syndicates.length === 1) {
    return (
      <SafeAreaScreen>
        <AppHeader title="" showBack />
        <Loading fill />
      </SafeAreaScreen>
    );
  }
  if (q.isError) {
    return (
      <SafeAreaScreen>
        <AppHeader title="" showBack />
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      </SafeAreaScreen>
    );
  }

  return (
    <SafeAreaScreen>
      <AppHeader title={t('home.details')} showBack />
      <FlatList
        data={q.syndicates}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <Card variant="outlined" padding="md" onPress={() => router.push(Routes.syndicateMain(item.id))}>
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
              <Icon name="shield-checkmark-outline" size="iconLg" color="primary" />
              <View style={{ flex: 1, rowGap: 4 }}>
                <Text variant="bodyStrong">{item.name}</Text>
                {item.description ? <Caption numberOfLines={2}>{item.description}</Caption> : null}
              </View>
            </View>
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
        ListEmptyComponent={<EmptyState icon="people-outline" title={t('home.notFound')} />}
        contentContainerStyle={{ padding: theme.screenPadding, paddingBottom: theme.spacing.huge }}
      />
    </SafeAreaScreen>
  );
}
