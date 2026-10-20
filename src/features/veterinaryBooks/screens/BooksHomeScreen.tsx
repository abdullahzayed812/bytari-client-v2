import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { EmptyState, ErrorState, Skeleton } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { CenteredTitleHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useContentCategories, useContentList, type ContentItem } from '@/features/content';
import { useStoreGrid } from '@/features/storeShared';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import {
  BookGridCard,
  BooksCategoryTiles,
  BooksSectionHeader,
  BooksTrustBanner,
  type BooksCategoryTile,
} from '../components';
import { BOOKS_CATEGORY_SLUGS } from '../constants';

/** "الكل" shows two rows of three on the reference. */
const ALL_PREVIEW = 6;
const FAVORITES_PREVIEW = 3;

/**
 * Route `/veterinary-books` — "الكتب البيطرية", laid out after the reference:
 * centred title, search, round category tiles (الكل / categories / المفضلة),
 * a "الكل" section (two rows of three) and "الكتب المفضلة" (one row), each
 * with "عرض الكل", and the trust banner. A search shows the matching books
 * in the same 3-up grid.
 */
export default function BooksHomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryBooks');
  const grid = useStoreGrid({ padding: 14, gap: 8 });

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const searching = search.trim().length > 0;

  const categories = useContentCategories();
  const categoryTiles: BooksCategoryTile[] = BOOKS_CATEGORY_SLUGS.flatMap((c) => {
    const category = categories.data?.find((cat) => cat.slug === c.slug);
    return category ? [{ key: category.id, label: category.name, icon: c.icon }] : [];
  });
  const tiles: BooksCategoryTile[] = [
    { key: 'all', label: t('home.allTile'), icon: 'grid' },
    ...categoryTiles,
    { key: 'favorites', label: t('home.favoritesChip'), icon: 'bookmark-outline' },
  ];

  const searchResults = useContentList({ type: 'BOOK', search, enabled: searching });
  const all = useContentList({
    type: 'BOOK',
    sort: 'latest',
    pageSize: ALL_PREVIEW,
    enabled: !searching,
  });
  const favorites = useContentList({
    type: 'BOOK',
    bookmarkedOnly: true,
    pageSize: FAVORITES_PREVIEW,
    enabled: !searching,
  });

  const goToBook = (bookId: string) => router.push(Routes.veterinaryBooksDetail(bookId));
  const onTile = (key: string) => {
    if (key === 'all') router.push(Routes.veterinaryBooksSection('all'));
    else if (key === 'favorites') router.push(Routes.veterinaryBooksSection('favorites'));
    else router.push(Routes.veterinaryBooksCategory(key));
  };

  const bookGrid = (q: ReturnType<typeof useContentList>, limit: number, empty: string) =>
    q.isLoading ? (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: grid.gap }}>
        {Array.from({ length: Math.min(limit, grid.columns) }, (_, i) => (
          <Skeleton key={i} width={grid.cardWidth} height={grid.cardWidth * 1.33 + 90} radius={8} />
        ))}
      </View>
    ) : q.isError ? (
      <ErrorState error={q.error} onRetry={() => void q.refetch()} />
    ) : q.items.length === 0 ? (
      <Caption>{empty}</Caption>
    ) : (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: grid.gap }}>
        {q.items.slice(0, limit).map((book: ContentItem) => (
          <View key={book.id} style={{ flexDirection: 'row' }}>
            <BookGridCard book={book} width={grid.cardWidth} onPress={() => goToBook(book.id)} />
          </View>
        ))}
      </View>
    );

  return (
    <SafeAreaScreen>
      <CenteredTitleHeader title={t('home.title')} subtitle={t('home.subtitle')} icon="book" />
      <ScrollView
        onLayout={grid.onLayout}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: theme.spacing.huge }}
      >
        <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
          <SearchInput
            value={rawSearch}
            onChangeText={setRawSearch}
            onClear={() => setRawSearch('')}
            placeholder={t('search.placeholder')}
            accessibilityLabel={t('search.placeholder')}
          />
        </View>
        <BooksCategoryTiles tiles={tiles} activeKey="all" onSelect={onTile} />

        <View style={{ paddingHorizontal: grid.padding, paddingTop: 12, rowGap: 20 }}>
          {searching ? (
            searchResults.isLoading || searchResults.items.length > 0 ? (
              bookGrid(searchResults, searchResults.items.length || grid.columns, '')
            ) : (
              <EmptyState icon="search-outline" title={t('search.empty')} />
            )
          ) : (
            <>
              <View>
                <BooksSectionHeader
                  title={t('home.allSection')}
                  icon="grid"
                  actionLabel={all.total > 0 ? t('home.viewAll') : undefined}
                  onAction={() => router.push(Routes.veterinaryBooksSection('all'))}
                />
                {bookGrid(all, ALL_PREVIEW, t('home.emptyAll'))}
              </View>
              <View>
                <BooksSectionHeader
                  title={t('home.favoritesSection')}
                  icon="heart"
                  actionLabel={favorites.total > 0 ? t('home.viewAll') : undefined}
                  onAction={() => router.push(Routes.veterinaryBooksSection('favorites'))}
                />
                {bookGrid(favorites, FAVORITES_PREVIEW, t('home.emptyFavorites'))}
              </View>
            </>
          )}
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <BooksTrustBanner text={t('home.trust')} />
        </View>
      </ScrollView>
    </SafeAreaScreen>
  );
}
