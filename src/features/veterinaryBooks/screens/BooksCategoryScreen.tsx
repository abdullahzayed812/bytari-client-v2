import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { Icon } from '@/components/content';
import { EmptyState, ErrorState, Skeleton } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { CenteredTitleHeader } from '@/components/navigation';
import { Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useContentCategories, useContentPage, type ContentSort } from '@/features/content';
import { useStoreGrid } from '@/features/storeShared';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import {
  BOOKS_C,
  BookGridCard,
  BooksCategoryTiles,
  BooksTrustBanner,
  type BooksCategoryTile,
} from '../components';
import { BOOKS_CATEGORY_SLUGS, BOOKS_SORT_OPTIONS } from '../constants';

/** Nine books per page — three rows of three, like the reference. */
const PAGE_SIZE = 9;
/** Page-number buttons shown at once. */
const PAGE_WINDOW = 4;

type Filter = { kind: 'all' } | { kind: 'favorites' } | { kind: 'category'; id: string };

/**
 * Route `/veterinary-books/section/[mode]` or `/veterinary-books/category/
 * [categoryId]` — "عرض كل الكتب", laid out after the reference: centred title
 * with the live total, search, the category tiles (switching the filter in
 * place), a "جميع الكتب (عرض a - b من n)" row with the sort switch (الأحدث /
 * الأكثر قراءة / الأعلى تقييماً), a 3-up grid of nine books per page with
 * numbered pagination, and the trust banner.
 */
export default function BooksCategoryScreen() {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';
  const { t } = useTranslation('veterinaryBooks');
  const { categoryId, mode } = useLocalSearchParams<{
    categoryId?: string;
    mode?: 'all' | 'mostRead' | 'favorites';
  }>();
  const grid = useStoreGrid({ padding: 14, gap: 8 });

  const [filter, setFilter] = useState<Filter>(
    categoryId
      ? { kind: 'category', id: categoryId }
      : mode === 'favorites'
        ? { kind: 'favorites' }
        : { kind: 'all' },
  );
  const [sort, setSort] = useState<ContentSort>(mode === 'mostRead' ? 'mostRead' : 'latest');
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [page, setPage] = useState(1);

  // Any filter / sort / search change starts again from page 1.
  useEffect(() => setPage(1), [filter, sort, search]);

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
  const activeKey = filter.kind === 'category' ? filter.id : filter.kind;
  const category =
    filter.kind === 'category' ? categories.data?.find((c) => c.id === filter.id) : undefined;

  const q = useContentPage({
    type: 'BOOK',
    page,
    pageSize: PAGE_SIZE,
    categoryId: filter.kind === 'category' ? filter.id : undefined,
    bookmarkedOnly: filter.kind === 'favorites',
    sort: filter.kind === 'favorites' ? undefined : sort,
    search,
  });
  const total = q.data?.meta.total ?? 0;
  const totalPages = Math.max(1, q.data?.meta.totalPages ?? 1);
  const items = q.data?.items ?? [];
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, page * PAGE_SIZE);

  const title = category
    ? t('category.title', { name: category.name })
    : filter.kind === 'favorites'
      ? t('home.favoritesSection')
      : t('allBooks.title');

  const nextSort = (): void => {
    const i = BOOKS_SORT_OPTIONS.findIndex((o) => o.value === sort);
    setSort(BOOKS_SORT_OPTIONS[(i + 1) % BOOKS_SORT_OPTIONS.length]!.value);
  };
  const sortIcon = BOOKS_SORT_OPTIONS.find((o) => o.value === sort)?.icon ?? 'swap-vertical';

  // A window of page numbers around the current page.
  const firstPage = Math.max(1, Math.min(page - 1, totalPages - PAGE_WINDOW + 1));
  const pages = Array.from({ length: Math.min(PAGE_WINDOW, totalPages) }, (_, i) => firstPage + i);

  const pageButton = (
    label: string,
    target: number,
    opts: { active?: boolean; disabled?: boolean; wide?: boolean } = {},
  ) => (
    <Pressable
      key={`${label}-${target}`}
      accessibilityRole="button"
      accessibilityLabel={opts.wide ? label : t('allBooks.pageA11y', { page: target })}
      accessibilityState={{ selected: opts.active, disabled: opts.disabled }}
      disabled={opts.disabled || opts.active}
      onPress={() => setPage(target)}
      style={{
        minWidth: 32,
        height: 32,
        paddingHorizontal: opts.wide ? 10 : 0,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: opts.active ? BOOKS_C.primary : theme.colors.surface,
        borderWidth: opts.active ? 0 : 1,
        borderColor: dark ? theme.colors.border : '#E5E7EB',
      }}
    >
      <Text
        style={{
          fontFamily: opts.active ? theme.fontFamily.displayBold : theme.fontFamily.bodyMedium,
          fontSize: 12,
          lineHeight: 18,
          color: opts.active
            ? '#FFFFFF'
            : opts.disabled
              ? theme.colors.textMuted
              : theme.colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaScreen>
      <CenteredTitleHeader
        title={title}
        subtitle={
          category
            ? t('category.subtitle', { name: category.name })
            : t('allBooks.subtitle', { count: total })
        }
        icon="book"
      />
      <ScrollView
        onLayout={grid.onLayout}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: theme.spacing.huge }}
        refreshControl={
          <RefreshControl
            refreshing={q.isRefetching && !q.isPlaceholderData}
            onRefresh={() => void q.refetch()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
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
        <BooksCategoryTiles
          tiles={tiles}
          activeKey={activeKey}
          onSelect={(key) =>
            setFilter(
              key === 'all'
                ? { kind: 'all' }
                : key === 'favorites'
                  ? { kind: 'favorites' }
                  : { kind: 'category', id: key },
            )
          }
        />

        <View style={{ paddingHorizontal: grid.padding, paddingTop: 12 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6, flexShrink: 1 }}
            >
              <Text
                style={{
                  fontFamily: theme.fontFamily.displayBold,
                  fontSize: 12,
                  lineHeight: 18,
                  color: theme.colors.textPrimary,
                }}
              >
                {t('home.all')}
              </Text>
              {total > 0 ? (
                <Text style={{ fontSize: 11, lineHeight: 17, color: theme.colors.textMuted }}>
                  {t('allBooks.range', { from, to, total })}
                </Text>
              ) : null}
            </View>
            {filter.kind !== 'favorites' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('allBooks.sortA11y', { current: t(`sort.${sort}`) })}
                onPress={nextSort}
                hitSlop={8}
                style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
              >
                <Icon name={sortIcon} size={14} color="primary" />
                <Text
                  style={{
                    fontFamily: theme.fontFamily.bodyMedium,
                    fontSize: 12,
                    lineHeight: 18,
                    color: dark ? theme.colors.primary : BOOKS_C.primary,
                  }}
                >
                  {t(`sort.${sort}`)}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {q.isLoading ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: grid.gap }}>
              {Array.from({ length: grid.columns * 2 }, (_, i) => (
                <Skeleton
                  key={i}
                  width={grid.cardWidth}
                  height={grid.cardWidth * 1.33 + 90}
                  radius={8}
                />
              ))}
            </View>
          ) : q.isError ? (
            <ErrorState error={q.error} onRetry={() => void q.refetch()} />
          ) : items.length === 0 ? (
            <EmptyState
              icon="book-outline"
              title={
                search
                  ? t('category.emptySearch')
                  : filter.kind === 'favorites'
                    ? t('home.emptyFavorites')
                    : t('category.empty')
              }
            />
          ) : (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: grid.gap,
                opacity: q.isPlaceholderData ? 0.6 : 1,
              }}
            >
              {items.map((book) => (
                <View key={book.id} style={{ flexDirection: 'row' }}>
                  <BookGridCard
                    book={book}
                    width={grid.cardWidth}
                    onPress={() => router.push(Routes.veterinaryBooksDetail(book.id))}
                  />
                </View>
              ))}
            </View>
          )}

          {totalPages > 1 ? (
            <View
              accessibilityRole="toolbar"
              accessibilityLabel={t('allBooks.paginationA11y')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 4,
                paddingTop: 16,
                paddingBottom: 8,
              }}
            >
              {pageButton(t('allBooks.previous'), page - 1, { disabled: page <= 1, wide: true })}
              {pages.map((p) => pageButton(String(p), p, { active: p === page }))}
              {pageButton(t('allBooks.next'), page + 1, {
                disabled: page >= totalPages,
                wide: true,
              })}
            </View>
          ) : null}
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <BooksTrustBanner text={t('home.trust')} />
        </View>
      </ScrollView>
    </SafeAreaScreen>
  );
}
