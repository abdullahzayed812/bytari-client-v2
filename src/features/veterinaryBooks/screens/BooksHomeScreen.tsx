import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { Card, Icon } from '@/components/content';
import { EmptyState, ErrorState } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { Row, SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useContentCategories, useContentList } from '@/features/content';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { BookCard, BookCardSkeleton } from '../components';
import { BOOKS_CATEGORY_SLUGS, BOOKS_SECTION_SIZE } from '../constants';

const CARD_WIDTH = 150;

/** Route `/veterinary-books` — "الكتب البيطرية" (Veterinarian Home). */
export default function BooksHomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryBooks');

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const searching = search.trim().length > 0;

  const categories = useContentCategories();
  const categoryChips = BOOKS_CATEGORY_SLUGS.map((c) => ({
    ...c,
    category: categories.data?.find((cat) => cat.slug === c.slug),
  })).filter((c) => c.category);

  const searchResults = useContentList({ type: 'BOOK', search, enabled: searching });
  const all = useContentList({
    type: 'BOOK',
    sort: 'latest',
    pageSize: BOOKS_SECTION_SIZE,
    enabled: !searching,
  });
  const mostRead = useContentList({
    type: 'BOOK',
    sort: 'mostRead',
    pageSize: BOOKS_SECTION_SIZE,
    enabled: !searching,
  });
  const favorites = useContentList({
    type: 'BOOK',
    bookmarkedOnly: true,
    pageSize: BOOKS_SECTION_SIZE,
    enabled: !searching,
  });

  const goToBook = (bookId: string) => router.push(Routes.veterinaryBooksDetail(bookId));
  const goToCategory = (categoryId: string) => router.push(Routes.veterinaryBooksCategory(categoryId));
  const goToSection = (mode: 'all' | 'mostRead' | 'favorites') =>
    router.push(Routes.veterinaryBooksSection(mode));

  const renderSection = (
    titleKey: 'home.all' | 'home.mostRead' | 'home.favorites',
    q: ReturnType<typeof useContentList>,
    mode: 'all' | 'mostRead' | 'favorites',
    emptyKey: 'home.emptyAll' | 'home.emptyMostRead' | 'home.emptyFavorites',
  ) => (
    <View style={{ rowGap: theme.spacing.sm }}>
      <Row justify="space-between" align="center">
        <Label>{t(titleKey)}</Label>
        {q.total > BOOKS_SECTION_SIZE ? (
          <Text
            variant="label"
            color="primary"
            onPress={() => goToSection(mode)}
            accessibilityRole="link"
          >
            {t('home.viewAll')}
          </Text>
        ) : null}
      </Row>
      {q.isLoading ? (
        <Row gap="md">
          {[0, 1, 2].map((i) => (
            <BookCardSkeleton key={i} width={CARD_WIDTH} />
          ))}
        </Row>
      ) : q.items.length === 0 ? (
        <Caption>{t(emptyKey)}</Caption>
      ) : (
        <FlatList
          data={q.items}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(b) => b.id}
          ItemSeparatorComponent={() => <View style={{ width: theme.spacing.md }} />}
          renderItem={({ item }) => (
            <BookCard book={item} width={CARD_WIDTH} onPress={() => goToBook(item.id)} />
          )}
        />
      )}
    </View>
  );

  return (
    <SafeAreaScreen>
      <AppHeader title={t('home.title')} subtitle={t('home.subtitle')} showBack backAlign="left" />

      <View style={{ paddingHorizontal: theme.screenPadding, rowGap: theme.spacing.lg }}>
        <SearchInput
          value={rawSearch}
          onChangeText={setRawSearch}
          onClear={() => setRawSearch('')}
          placeholder={t('search.placeholder')}
          accessibilityLabel={t('search.placeholder')}
        />

        <FlatList
          data={categoryChips}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(c) => c.slug}
          ItemSeparatorComponent={() => <View style={{ width: theme.spacing.sm }} />}
          ListHeaderComponent={
            <View style={{ marginEnd: theme.spacing.sm }}>
              <ChipButton
                icon="heart-outline"
                label={t('home.favoritesChip')}
                onPress={() => goToSection('favorites')}
              />
            </View>
          }
          renderItem={({ item }) => (
            <ChipButton
              icon={item.icon}
              label={item.category?.name ?? ''}
              onPress={() => goToCategory(item.category?.id as string)}
            />
          )}
        />
      </View>

      {searching ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.lg }}>
          {searchResults.isLoading ? (
            <View style={{ rowGap: theme.spacing.md }}>
              {[0, 1, 2].map((i) => (
                <BookCardSkeleton key={i} />
              ))}
            </View>
          ) : searchResults.isError ? (
            <ErrorState error={searchResults.error} onRetry={() => void searchResults.refetch()} />
          ) : searchResults.items.length === 0 ? (
            <EmptyState icon="search-outline" title={t('search.empty')} />
          ) : (
            <View style={{ rowGap: theme.spacing.md }}>
              {searchResults.items.map((b) => (
                <BookCard key={b.id} book={b} onPress={() => goToBook(b.id)} />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View
          style={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing.huge,
            rowGap: theme.spacing.xl,
          }}
        >
          {renderSection('home.all', all, 'all', 'home.emptyAll')}
          {renderSection('home.mostRead', mostRead, 'mostRead', 'home.emptyMostRead')}
          {renderSection('home.favorites', favorites, 'favorites', 'home.emptyFavorites')}
        </View>
      )}
    </SafeAreaScreen>
  );
}

function ChipButton({
  icon,
  label,
  onPress,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Card
      variant="outlined"
      padding="sm"
      onPress={onPress}
      accessibilityLabel={label}
      style={{ alignItems: 'center', rowGap: 4, width: 76 }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size="iconMd" color="primary" />
      </View>
      <Caption numberOfLines={2} style={{ textAlign: 'center' }}>
        {label}
      </Caption>
    </Card>
  );
}
