import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { Card, Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { Row, SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { ContentCard, ContentCardSkeleton, ContentFilters } from '../components';
import { CONTENT_TYPE_META, CONTENT_TYPE_ORDER } from '../constants';
import { useContentCategories, useContentList } from '../hooks';
import type { ContentItem, ContentType } from '../types';

/**
 * Route `/content` — the Knowledge landing. Search (server-side) + category
 * chips + a type-filter chip row + one infinite list. Three type entry cards
 * (Articles / Magazines / Books) sit on top and hide once a search / filter is
 * active. No "featured" / "popular" — the backend exposes no such ranking (§2).
 */
export default function ContentHomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation('content');

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [type, setType] = useState<ContentType | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

  const categories = useContentCategories();
  const q = useContentList({ type, categoryId, search });
  const filtersActive = Boolean(search || type || categoryId);

  const goToItem = (item: ContentItem) => router.push(Routes.contentItem(item.id));
  const goToType = (ct: ContentType) => router.push(Routes.contentType(CONTENT_TYPE_META[ct].slug));

  const header = (
    <View style={{ paddingBottom: theme.spacing.md, rowGap: theme.spacing.md }}>
      <SearchInput
        value={rawSearch}
        onChangeText={setRawSearch}
        onClear={() => setRawSearch('')}
        placeholder={t('search.placeholder')}
        accessibilityLabel={t('search.placeholder')}
      />

      {!filtersActive ? (
        <View style={{ rowGap: theme.spacing.sm }}>
          {CONTENT_TYPE_ORDER.map((ct) => (
            <Card
              key={ct}
              variant="outlined"
              padding="md"
              onPress={() => goToType(ct)}
              accessibilityLabel={t(`home.browse.${ct}`)}
            >
              <Row gap="md">
                <Icon name={CONTENT_TYPE_META[ct].icon} size="iconMd" color="primary" />
                <Text variant="bodyMedium" style={{ flex: 1 }}>
                  {t(`home.browse.${ct}`)}
                </Text>
                <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
              </Row>
            </Card>
          ))}
        </View>
      ) : null}

      <ContentFilters
        type={type ?? undefined}
        onTypeChange={setType}
        categories={categories.data ?? []}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
      />

      <Caption>{filtersActive ? t('home.resultsLabel') : t('home.latestLabel')}</Caption>
    </View>
  );

  return (
    <SafeAreaScreen>
      <AppHeader title={t('home.title')} showBack />

      {q.isLoading ? (
        <View
          style={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.md,
            rowGap: theme.spacing.md,
          }}
        >
          {header}
          {[0, 1, 2].map((i) => (
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
              title={filtersActive ? t('search.empty') : t('list.emptyAll')}
              message={filtersActive ? t('list.emptyFilteredHint') : t('list.emptyHint')}
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
