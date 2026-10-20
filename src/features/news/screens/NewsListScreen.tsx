import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { ContentHighlightBanner, Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading, Skeleton } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { parseAnimalSections } from '@/constants/animalSections';
import { Routes } from '@/constants/routes';
import { useContentCategories } from '@/features/content/hooks';
import { StorePills, useStoreGrid, type StorePill } from '@/features/storeShared';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { NewsGridCard } from '../components';
import { useFeaturedNews, useNews, useNewsBookmark } from '../hooks';

/** The references' dark-green active filter pill. */
const PILL_ACCENT = { main: '#073D24', strong: '#052E1B', soft: '#E9F3E9', border: '#DCEEE0' };

/**
 * Route `/news` — "آخر الأخبار", laid out after the reference: search, the
 * highlighted item banner, category pills ("الكل (n)" + categories, filtered
 * server-side) and a 3-up grid of compact cards (more columns on wide
 * screens) with infinite scroll.
 */
export default function NewsListScreen() {
  const theme = useTheme();
  const { t } = useTranslation('news');
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const grid = useStoreGrid({ padding: 12, gap: 8 });

  // `?section=POULTRY` / `SHEEP,CATTLE` — opened from a section landing: that
  // section's items only (no cross-section featured item).
  const { section } = useLocalSearchParams<{ section?: string }>();
  const sections = parseAnimalSections(section);
  const { t: tc } = useTranslation('common');
  const sectionTitle = sections?.map((s) => tc(`animalSections.${s}`)).join(' / ');

  const q = useNews({ search, sections, categoryId });
  const featured = useFeaturedNews({
    enabled: search.trim().length === 0 && !sections && !categoryId,
  });
  const categories = useContentCategories();
  const { toggleBookmark } = useNewsBookmark();

  const goToItem = (id: string): void => router.push(Routes.newsDetail(id));
  const featuredItem = featured.data ?? null;
  const showFeatured = Boolean(featuredItem) && search.trim().length === 0 && !categoryId;

  const pills: StorePill[] = [
    {
      id: undefined,
      label: categoryId ? t('list.all') : t('list.allWithCount', { count: q.total }),
    },
    // The categories table is shared with the magazine (`mag-*`) and books
    // (`book-*`) — only general categories make sense as filters here.
    ...(categories.data ?? [])
      .filter((c) => !/^(mag|book)-/.test(c.slug))
      .map((c) => ({ id: c.id, label: c.name })),
  ];

  const header = (
    <View style={{ rowGap: 12, paddingBottom: 10 }}>
      <View style={{ paddingHorizontal: 16 }}>
        <SearchInput
          value={rawSearch}
          onChangeText={setRawSearch}
          onClear={() => setRawSearch('')}
          placeholder={t('list.searchPlaceholder')}
          accessibilityLabel={t('list.searchPlaceholder')}
        />
      </View>
      {showFeatured && featuredItem ? (
        <View style={{ paddingHorizontal: 16 }}>
          <ContentHighlightBanner
            badgeLabel={t('featured.badge')}
            title={featuredItem.title}
            summary={featuredItem.summary}
            ctaLabel={t('featured.cta')}
            imageUrl={featuredItem.coverImageUrl}
            onPress={() => goToItem(featuredItem.id)}
            accessibilityLabel={t('card.open', { title: featuredItem.title })}
          />
        </View>
      ) : null}
      {pills.length > 1 ? (
        <StorePills
          items={pills}
          selectedId={categoryId}
          onSelect={setCategoryId}
          accent={PILL_ACCENT}
        />
      ) : null}
    </View>
  );

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('list.title')}
        subtitle={sectionTitle}
        showBack
        right={<Icon name="newspaper-outline" size="iconMd" color="primary" />}
      />

      <View style={{ flex: 1 }} onLayout={grid.onLayout}>
        {q.isLoading ? (
          <View style={{ paddingTop: theme.spacing.sm }}>
            {header}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: grid.gap,
                paddingHorizontal: grid.padding,
              }}
            >
              {Array.from({ length: grid.columns * 2 }, (_, i) => (
                <Skeleton key={i} width={grid.cardWidth} height={190} radius={12} />
              ))}
            </View>
          </View>
        ) : q.isError ? (
          <View style={{ paddingTop: theme.spacing.sm }}>
            {header}
            <ErrorState error={q.error} onRetry={() => void q.refetch()} />
          </View>
        ) : (
          <FlatList
            // numColumns cannot change on a mounted FlatList — remount per column count.
            key={`news-${grid.columns}`}
            data={q.news}
            keyExtractor={(item) => item.id}
            numColumns={grid.columns}
            columnWrapperStyle={{ gap: grid.gap, paddingHorizontal: grid.padding }}
            renderItem={({ item }) => (
              <View style={{ flexDirection: 'row' }}>
                <NewsGridCard
                  item={item}
                  width={grid.cardWidth}
                  onPress={() => goToItem(item.id)}
                  onToggleBookmark={(next) => toggleBookmark(item.id, next, item.bookmarkCount)}
                />
              </View>
            )}
            ListHeaderComponent={header}
            ListEmptyComponent={
              <EmptyState
                icon="newspaper-outline"
                title={search ? t('list.emptySearch') : t('list.empty')}
                message={search ? t('list.emptySearchHint') : t('list.emptyHint')}
              />
            }
            ListFooterComponent={
              q.isFetchingNextPage ? <Loading label={t('list.loadingMore')} /> : null
            }
            contentContainerStyle={{
              paddingTop: theme.spacing.sm,
              paddingBottom: theme.spacing.huge,
              rowGap: grid.gap,
              flexGrow: 1,
            }}
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
            }}
            refreshControl={
              <RefreshControl
                refreshing={q.isRefetching && !q.isFetchingNextPage}
                onRefresh={() => {
                  void q.refetch();
                  void featured.refetch();
                }}
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
