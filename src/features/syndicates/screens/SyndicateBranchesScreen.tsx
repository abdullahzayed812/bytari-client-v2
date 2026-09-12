import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Routes } from '@/constants/routes';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { SyndicateBranchCard } from '../components';
import { useSyndicateBranches } from '../hooks';

/** Route `/(app)/syndicates/[organizationId]/branches` — "فروع النقابة" (reference screenshot). */
export default function SyndicateBranchesScreen() {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const filter = useMemo(() => ({ search: search || undefined }), [search]);
  const q = useSyndicateBranches(organizationId, filter);

  return (
    <SafeAreaScreen>
      <AppHeader title={t('branches.title')} showBack />
      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.sm }}>
        <SearchInput
          value={rawSearch}
          onChangeText={setRawSearch}
          onClear={() => setRawSearch('')}
          placeholder={t('branches.searchPlaceholder')}
          accessibilityLabel={t('branches.searchPlaceholder')}
        />
      </View>

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.branches}
          numColumns={2}
          keyExtractor={(b) => b.id}
          columnWrapperStyle={{ gap: theme.spacing.md }}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <SyndicateBranchCard branch={item} onPress={() => router.push(Routes.syndicateMain(item.id))} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState icon="business-outline" title={t('branches.empty')} message={t('branches.emptyHint')} />
          }
          ListFooterComponent={q.isFetchingNextPage ? <Loading label={t('branches.loadingMore')} /> : null}
          contentContainerStyle={{
            padding: theme.screenPadding,
            paddingBottom: theme.spacing.huge,
            gap: theme.spacing.md,
            flexGrow: 1,
          }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
          }}
        />
      )}
    </SafeAreaScreen>
  );
}
