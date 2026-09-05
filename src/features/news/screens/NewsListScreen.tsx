import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, useWindowDimensions, View } from 'react-native';

import { Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Label } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { FeaturedNewsCard, NewsCard, NewsCardSkeleton } from '../components';
import { useFeaturedNews, useNews, useNewsBookmark } from '../hooks';

const GAP = 12;

/** Route `/news` — "آخر الأخبار": search, featured "خبر مميز", 2-up grid. */
export default function NewsListScreen() {
  const theme = useTheme();
  const { t } = useTranslation('news');
  const { width } = useWindowDimensions();
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);

  const q = useNews({ search });
  const featured = useFeaturedNews({ enabled: search.trim().length === 0 });
  const { toggleBookmark } = useNewsBookmark();

  const cardWidth = Math.floor((width - theme.screenPadding * 2 - GAP) / 2);
  const goToItem = (id: string): void => router.push(Routes.newsDetail(id));
  const featuredItem = featured.data ?? null;

  const header = (
    <View style={{ rowGap: theme.spacing.lg, paddingBottom: theme.spacing.md }}>
      <SearchInput
        value={rawSearch}
        onChangeText={setRawSearch}
        onClear={() => setRawSearch('')}
        placeholder={t('list.searchPlaceholder')}
        accessibilityLabel={t('list.searchPlaceholder')}
      />
      {featuredItem && search.trim().length === 0 ? (
        <View style={{ rowGap: theme.spacing.sm }}>
          <Label>{t('featured.section')}</Label>
          <FeaturedNewsCard item={featuredItem} onPress={() => goToItem(featuredItem.id)} />
        </View>
      ) : null}
      <Label>{t('list.section')}</Label>
    </View>
  );

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('list.title')}
        showBack
        right={<Icon name="newspaper-outline" size="iconMd" color="primary" />}
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
          <View style={{ flexDirection: 'row', columnGap: GAP, flexWrap: 'wrap', rowGap: GAP }}>
            {[0, 1, 2, 3].map((i) => (
              <NewsCardSkeleton key={i} width={cardWidth} />
            ))}
          </View>
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          {header}
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.news}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: GAP }}
          renderItem={({ item }) => (
            <NewsCard
              item={item}
              width={cardWidth}
              onPress={() => goToItem(item.id)}
              onToggleBookmark={(next) => toggleBookmark(item.id, next, item.bookmarkCount)}
            />
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
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.huge,
            rowGap: GAP,
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
    </SafeAreaScreen>
  );
}
