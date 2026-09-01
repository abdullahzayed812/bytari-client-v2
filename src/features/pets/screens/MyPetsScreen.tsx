import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { PetCard, PetCardSkeleton } from '../components';
import { usePets } from '../hooks';
import type { Pet } from '../types';

/** "My Pets" — the owner-scoped pet list (§4). FlatList + pull-to-refresh + paging. */
export default function MyPetsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('pets');
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);

  const q = usePets({ search });

  const goToPet = (pet: Pet) => router.push(Routes.petDetail(pet.id));
  const goToCreate = () => router.push(Routes.petsCreate);

  const header = (
    <View style={{ paddingBottom: theme.spacing.md, rowGap: theme.spacing.sm }}>
      <SearchInput
        value={rawSearch}
        onChangeText={setRawSearch}
        onClear={() => setRawSearch('')}
        placeholder={t('list.searchPlaceholder')}
        accessibilityLabel={t('list.searchPlaceholder')}
      />
      {q.total > 0 ? <Caption>{t('list.count', { count: q.total })}</Caption> : null}
    </View>
  );

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('list.title')}
        right={
          <IconButton
            icon="add"
            variant="soft"
            accessibilityLabel={t('list.addCta')}
            onPress={goToCreate}
          />
        }
      />

      {q.isLoading ? (
        <View
          style={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.md,
            rowGap: theme.spacing.md,
          }}
        >
          {header}
          {[0, 1, 2, 3].map((i) => (
            <PetCardSkeleton key={i} />
          ))}
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          {header}
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.pets}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PetCard pet={item} onPress={() => goToPet(item)} />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              icon="paw-outline"
              title={t('list.empty')}
              message={t('list.emptyHint')}
              actionLabel={t('list.addCta')}
              onAction={goToCreate}
            />
          }
          ListFooterComponent={
            q.isFetchingNextPage ? <Loading label={t('list.loadingMore')} /> : null
          }
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingBottom: theme.spacing.huge,
            rowGap: theme.spacing.md,
            flexGrow: 1,
          }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
          }}
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching && !q.isFetchingNextPage}
              onRefresh={() => void q.refetch()}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </SafeAreaScreen>
  );
}
