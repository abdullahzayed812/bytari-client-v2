import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { ContentCard, ContentCardSkeleton, ContentFilters } from '../components';
import { contentTypeFromSlug } from '../constants';
import { useContentCategories, useContentList } from '../hooks';
import type { ContentItem } from '../types';

/**
 * Route `/content/[type]` — a type-scoped list (Articles / Magazines / Books).
 * An unknown slug falls back to the all-content list. Server-side search +
 * category filter; backend pagination (§4, §7, §8, §14, §29).
 */
export default function ContentListScreen() {
  const theme = useTheme();
  const { t } = useTranslation('content');
  const { type: typeSlug } = useLocalSearchParams<{ type: string }>();
  const type = contentTypeFromSlug(typeSlug);

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

  const categories = useContentCategories();
  const q = useContentList({ type, categoryId, search });

  const title = type ? t(`list.title.${type}`) : t('home.title');
  const emptyTitle =
    search || categoryId
      ? t('list.emptyFiltered')
      : type
        ? t(`list.empty.${type}`)
        : t('list.emptyAll');

  const header = (
    <View style={{ paddingBottom: theme.spacing.md, rowGap: theme.spacing.sm }}>
      <SearchInput
        value={rawSearch}
        onChangeText={setRawSearch}
        onClear={() => setRawSearch('')}
        placeholder={t('search.placeholder')}
        accessibilityLabel={t('search.placeholder')}
      />
      <ContentFilters
        type={null}
        categories={categories.data ?? []}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
      />
      {q.total > 0 ? <Caption>{t('list.count', { count: q.total })}</Caption> : null}
    </View>
  );

  const goToItem = (item: ContentItem) => router.push(Routes.contentItem(item.id));

  return (
    <SafeAreaScreen>
      <AppHeader title={title} showBack />

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
            <ContentCardSkeleton key={i} />
          ))}
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          {header}
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.items}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <ContentCard item={item} onPress={() => goToItem(item)} />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              icon="library-outline"
              title={emptyTitle}
              message={search || categoryId ? t('list.emptyFilteredHint') : t('list.emptyHint')}
            />
          }
          ListFooterComponent={
            q.isFetchingNextPage ? <Loading label={t('common.loadingMore')} /> : null
          }
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.md,
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
