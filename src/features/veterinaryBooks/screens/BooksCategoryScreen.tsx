import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { Chip } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { Row, SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useContentCategories, useContentList, type ContentSort } from '@/features/content';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { BookCard, BookCardSkeleton } from '../components';
import { BOOKS_SORT_OPTIONS } from '../constants';

/**
 * Route `/veterinary-books/category/[categoryId]` or
 * `/veterinary-books/section/[mode]` — a filtered book list. One screen, two
 * entry shapes: a specific category (with a sort switcher, like the
 * reference) or a pre-set section (sort/bookmark fixed by `mode`, no category
 * filter — those already live on the home screen's rails).
 */
export default function BooksCategoryScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryBooks');
  const { categoryId, mode } = useLocalSearchParams<{
    categoryId?: string;
    mode?: 'all' | 'mostRead' | 'favorites';
  }>();

  const categories = useContentCategories({ enabled: Boolean(categoryId) });
  const category = categories.data?.find((c) => c.id === categoryId);

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [sort, setSort] = useState<ContentSort>('latest');

  const bookmarkedOnly = mode === 'favorites';
  const effectiveSort: ContentSort | undefined =
    mode === 'mostRead' ? 'mostRead' : mode === 'favorites' ? undefined : sort;

  const q = useContentList({
    type: 'BOOK',
    categoryId,
    search,
    sort: effectiveSort,
    bookmarkedOnly,
  });

  const goToBook = (bookId: string) => router.push(Routes.veterinaryBooksDetail(bookId));

  const title = category
    ? t('category.title', { name: category.name })
    : mode === 'mostRead'
      ? t('home.mostRead')
      : mode === 'favorites'
        ? t('home.favorites')
        : t('home.all');
  const subtitle = category ? t('category.subtitle', { name: category.name }) : undefined;

  return (
    <SafeAreaScreen>
      <AppHeader title={title} subtitle={subtitle} showBack backAlign="left" />

      <View style={{ paddingHorizontal: theme.screenPadding, rowGap: theme.spacing.md }}>
        <SearchInput
          value={rawSearch}
          onChangeText={setRawSearch}
          onClear={() => setRawSearch('')}
          placeholder={t('category.searchPlaceholder')}
          accessibilityLabel={t('category.searchPlaceholder')}
        />
        {categoryId ? (
          <Row gap="sm" wrap>
            {BOOKS_SORT_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={t(`sort.${opt.value}`)}
                icon={opt.icon}
                selected={sort === opt.value}
                onPress={() => setSort(opt.value)}
              />
            ))}
          </Row>
        ) : null}
      </View>

      {q.isLoading ? (
        <View
          style={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.lg,
            rowGap: theme.spacing.md,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <BookCardSkeleton key={i} />
          ))}
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.lg }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.items}
          numColumns={2}
          keyExtractor={(b) => b.id}
          columnWrapperStyle={{ columnGap: theme.spacing.md }}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <BookCard book={item} onPress={() => goToBook(item.id)} />
            </View>
          )}
          ListHeaderComponent={
            q.total > 0 ? <Caption>{t('category.resultsCount', { count: q.total })}</Caption> : null
          }
          ListHeaderComponentStyle={{ marginBottom: theme.spacing.sm }}
          ListEmptyComponent={
            <EmptyState
              icon="book-outline"
              title={search ? t('category.emptySearch') : t('category.empty')}
            />
          }
          ListFooterComponent={
            q.isFetchingNextPage ? <Loading label={t('common.loadingMore')} /> : null
          }
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing.huge,
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
