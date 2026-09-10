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

import { ArticleCard, ArticleCardSkeleton } from '../components';
import { MAGAZINE_CATEGORY_SLUGS, MAGAZINE_SECTION_SIZE } from '../constants';

const CARD_WIDTH = 150;

/** Route `/veterinary-magazine` — "المجلة البيطرية" (Veterinarian Home). */
export default function MagazineHomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryMagazine');

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const searching = search.trim().length > 0;

  const categories = useContentCategories();
  const categoryChips = MAGAZINE_CATEGORY_SLUGS.map((c) => ({
    ...c,
    category: categories.data?.find((cat) => cat.slug === c.slug),
  })).filter((c) => c.category);

  const searchResults = useContentList({ type: 'MAGAZINE', search, enabled: searching });
  const latest = useContentList({
    type: 'MAGAZINE',
    sort: 'latest',
    pageSize: MAGAZINE_SECTION_SIZE,
    enabled: !searching,
  });
  const mostRead = useContentList({
    type: 'MAGAZINE',
    sort: 'mostRead',
    pageSize: MAGAZINE_SECTION_SIZE,
    enabled: !searching,
  });
  const saved = useContentList({
    type: 'MAGAZINE',
    bookmarkedOnly: true,
    pageSize: MAGAZINE_SECTION_SIZE,
    enabled: !searching,
  });

  const goToArticle = (articleId: string) => router.push(Routes.veterinaryMagazineArticle(articleId));
  const goToCategory = (categoryId: string) => router.push(Routes.veterinaryMagazineCategory(categoryId));
  const goToSection = (mode: 'latest' | 'mostRead' | 'saved') =>
    router.push(Routes.veterinaryMagazineSection(mode));

  const renderSection = (
    titleKey: 'home.latest' | 'home.mostRead' | 'home.saved',
    q: ReturnType<typeof useContentList>,
    mode: 'latest' | 'mostRead' | 'saved',
    emptyKey: 'home.emptyLatest' | 'home.emptyMostRead' | 'home.emptySaved',
  ) => (
    <View style={{ rowGap: theme.spacing.sm }}>
      <Row justify="space-between" align="center">
        <Label>{t(titleKey)}</Label>
        {q.total > MAGAZINE_SECTION_SIZE ? (
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
            <ArticleCardSkeleton key={i} width={CARD_WIDTH} />
          ))}
        </Row>
      ) : q.items.length === 0 ? (
        <Caption>{t(emptyKey)}</Caption>
      ) : (
        <FlatList
          data={q.items}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(a) => a.id}
          ItemSeparatorComponent={() => <View style={{ width: theme.spacing.md }} />}
          renderItem={({ item }) => (
            <ArticleCard article={item} width={CARD_WIDTH} onPress={() => goToArticle(item.id)} />
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
                icon="bookmark-outline"
                label={t('home.savedChip')}
                onPress={() => goToSection('saved')}
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
                <ArticleCardSkeleton key={i} />
              ))}
            </View>
          ) : searchResults.isError ? (
            <ErrorState error={searchResults.error} onRetry={() => void searchResults.refetch()} />
          ) : searchResults.items.length === 0 ? (
            <EmptyState icon="search-outline" title={t('search.empty')} />
          ) : (
            <View style={{ rowGap: theme.spacing.md }}>
              {searchResults.items.map((a) => (
                <ArticleCard key={a.id} article={a} onPress={() => goToArticle(a.id)} />
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
          {renderSection('home.latest', latest, 'latest', 'home.emptyLatest')}
          {renderSection('home.mostRead', mostRead, 'mostRead', 'home.emptyMostRead')}
          {renderSection('home.saved', saved, 'saved', 'home.emptySaved')}
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
