import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { Chip } from '@/components/content';
import { EmptyState, ErrorState, Loading, Skeleton } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { Row, SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useContentCategories, useContentList, type ContentSort } from '@/features/content';
import { useStoreGrid } from '@/features/storeShared';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { ArticleGridCard } from '../components';
import { MAGAZINE_SORT_OPTIONS } from '../constants';

/**
 * Route `/veterinary-magazine/category/[categoryId]` or
 * `/veterinary-magazine/section/[mode]` — a filtered article list ("مقالات
 * الدواجن", "أحدث المقالات", "الأكثر قراءة", "المقالات المحفوظة"). One screen,
 * two entry shapes: a specific category (with a sort switcher, like the
 * reference) or a pre-set section (sort/bookmark fixed by `mode`, no
 * category filter — those already live on the home screen's rails).
 */
export default function MagazineCategoryScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryMagazine');
  const { categoryId, mode } = useLocalSearchParams<{
    categoryId?: string;
    mode?: 'latest' | 'mostRead' | 'saved';
  }>();

  const categories = useContentCategories({ enabled: Boolean(categoryId) });
  const category = categories.data?.find((c) => c.id === categoryId);

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [sort, setSort] = useState<ContentSort>('latest');

  const bookmarkedOnly = mode === 'saved';
  const effectiveSort: ContentSort | undefined =
    mode === 'mostRead' ? 'mostRead' : mode === 'saved' ? undefined : sort;

  const q = useContentList({
    type: 'MAGAZINE',
    categoryId,
    search,
    sort: effectiveSort,
    bookmarkedOnly,
  });

  const goToArticle = (articleId: string) =>
    router.push(Routes.veterinaryMagazineArticle(articleId));
  // Same compact 3-up card grid as the magazine home ("جميع المقالات").
  const grid = useStoreGrid({ padding: theme.screenPadding, gap: 10 });

  const title = category
    ? t('category.title', { name: category.name })
    : mode === 'mostRead'
      ? t('home.mostRead')
      : mode === 'saved'
        ? t('home.saved')
        : t('home.latest');
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
            {MAGAZINE_SORT_OPTIONS.map((opt) => (
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

      <View style={{ flex: 1 }} onLayout={grid.onLayout}>
        {q.isLoading ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: grid.gap,
              paddingHorizontal: grid.padding,
              paddingTop: theme.spacing.lg,
            }}
          >
            {Array.from({ length: grid.columns * 2 }, (_, i) => (
              <Skeleton key={i} width={grid.cardWidth} height={200} radius={12} />
            ))}
          </View>
        ) : q.isError ? (
          <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.lg }}>
            <ErrorState error={q.error} onRetry={() => void q.refetch()} />
          </View>
        ) : (
          <FlatList
            // numColumns cannot change on a mounted FlatList — remount per column count.
            key={`magazine-list-${grid.columns}`}
            data={q.items}
            numColumns={grid.columns}
            keyExtractor={(a) => a.id}
            columnWrapperStyle={{ gap: grid.gap }}
            ItemSeparatorComponent={() => <View style={{ height: grid.gap }} />}
            renderItem={({ item }) => (
              <View style={{ flexDirection: 'row' }}>
                <ArticleGridCard
                  article={item}
                  width={grid.cardWidth}
                  onPress={() => goToArticle(item.id)}
                />
              </View>
            )}
            ListHeaderComponent={
              q.total > 0 ? (
                <Caption>{t('category.resultsCount', { count: q.total })}</Caption>
              ) : null
            }
            ListHeaderComponentStyle={{ marginBottom: theme.spacing.sm }}
            ListEmptyComponent={
              <EmptyState
                icon="newspaper-outline"
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
      </View>
    </SafeAreaScreen>
  );
}
