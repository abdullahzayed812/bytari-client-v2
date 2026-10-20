import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

import { IconButton } from '@/components/actions';
import { Icon, type IconName } from '@/components/content';
import { EmptyState, ErrorState, Skeleton } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { CenteredTitleHeader } from '@/components/navigation';
import { Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useContentCategories, useContentList } from '@/features/content';
import { useStoreGrid } from '@/features/storeShared';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { ArticleGridCard } from '../components';
import { MAGAZINE_CATEGORY_SLUGS } from '../constants';

/** Palette of the "جميع المقالات" reference. */
const C = {
  active: '#087A4A',
  border: '#E3E9E6',
  chipText: '#556760',
  green: '#079653',
  soft: '#E8F5EE',
};

/**
 * Route `/veterinary-magazine` — "المجلة البيطرية", laid out after the
 * "جميع المقالات" reference: centred title, search, category chips filtering
 * the grid in place (server-side `categoryId`), and a 3-up grid of every
 * article (more columns on wide screens) that loads more automatically.
 * The saved articles stay one tap away (header bookmark, in the slot the
 * reference leaves empty) and "most read" keeps its own list (last chip).
 */
export default function MagazineHomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryMagazine');
  const grid = useStoreGrid({ padding: 16, gap: 10 });

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [categoryId, setCategoryId] = useState<string | undefined>();

  const categories = useContentCategories();
  const categoryChips = MAGAZINE_CATEGORY_SLUGS.map((c) => ({
    ...c,
    category: categories.data?.find((cat) => cat.slug === c.slug),
  })).filter((c) => c.category);

  const q = useContentList({ type: 'MAGAZINE', search, categoryId, sort: 'latest' });
  const goToArticle = (articleId: string) =>
    router.push(Routes.veterinaryMagazineArticle(articleId));

  const header = (
    <View style={{ rowGap: 14, paddingBottom: 14 }}>
      <View style={{ paddingHorizontal: 16 }}>
        <SearchInput
          value={rawSearch}
          onChangeText={setRawSearch}
          onClear={() => setRawSearch('')}
          placeholder={t('search.placeholder')}
          accessibilityLabel={t('search.placeholder')}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ columnGap: 8, paddingHorizontal: 16 }}
      >
        <MagazineChip
          icon="apps"
          label={t('home.allChip')}
          active={categoryId === undefined}
          onPress={() => setCategoryId(undefined)}
        />
        {categoryChips.map((c) => (
          <MagazineChip
            key={c.slug}
            label={c.category?.name ?? ''}
            active={categoryId === c.category?.id}
            onPress={() => setCategoryId(c.category?.id)}
          />
        ))}
        <MagazineChip
          icon="stats-chart-outline"
          label={t('home.mostRead')}
          active={false}
          onPress={() => router.push(Routes.veterinaryMagazineSection('mostRead'))}
        />
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaScreen>
      <CenteredTitleHeader
        title={t('home.allTitle')}
        subtitle={t('home.allSubtitle')}
        icon="book-outline"
        right={
          <IconButton
            icon="bookmark-outline"
            accessibilityLabel={t('home.saved')}
            onPress={() => router.push(Routes.veterinaryMagazineSection('saved'))}
          />
        }
      />

      <View style={{ flex: 1, paddingTop: 10 }} onLayout={grid.onLayout}>
        {q.isLoading ? (
          <View>
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
                <Skeleton key={i} width={grid.cardWidth} height={200} radius={12} />
              ))}
            </View>
          </View>
        ) : q.isError ? (
          <View>
            {header}
            <ErrorState error={q.error} onRetry={() => void q.refetch()} />
          </View>
        ) : (
          <FlatList
            // numColumns cannot change on a mounted FlatList — remount per column count.
            key={`magazine-${grid.columns}`}
            data={q.items}
            keyExtractor={(a) => a.id}
            numColumns={grid.columns}
            columnWrapperStyle={{ gap: grid.gap, paddingHorizontal: grid.padding }}
            renderItem={({ item }) => (
              <View style={{ flexDirection: 'row' }}>
                <ArticleGridCard
                  article={item}
                  width={grid.cardWidth}
                  onPress={() => goToArticle(item.id)}
                />
              </View>
            )}
            ListHeaderComponent={header}
            ListEmptyComponent={
              <EmptyState
                icon="newspaper-outline"
                title={search ? t('search.empty') : t('home.emptyLatest')}
              />
            }
            ListFooterComponent={
              q.isFetchingNextPage ? <AutoLoadPill label={t('home.autoLoading')} /> : null
            }
            contentContainerStyle={{
              paddingBottom: theme.spacing.huge,
              rowGap: grid.gap,
              flexGrow: 1,
            }}
            onEndReachedThreshold={0.5}
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

function MagazineChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon?: IconName;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 6,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: active ? C.active : theme.colors.surface,
        borderWidth: active ? 0 : 1,
        borderColor: dark ? theme.colors.border : C.border,
        opacity: pressed ? 0.85 : 1,
        ...theme.shadows.xs,
      })}
    >
      {icon ? <Icon name={icon} size={15} color={active ? 'onPrimary' : 'textSecondary'} /> : null}
      <Text
        numberOfLines={1}
        style={{
          fontFamily: theme.fontFamily.displaySemiBold,
          fontSize: 12,
          lineHeight: 18,
          color: active ? '#FFFFFF' : dark ? theme.colors.textSecondary : C.chipText,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** "جاري تحميل المزيد من المقالات تلقائياً..." pill of the reference. */
function AutoLoadPill({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: 8,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: theme.scheme === 'dark' ? theme.colors.surfaceAccent : C.soft,
        }}
      >
        <ActivityIndicator size="small" color={C.green} />
        <Text
          style={{
            fontFamily: theme.fontFamily.displaySemiBold,
            fontSize: 12,
            lineHeight: 18,
            color: theme.scheme === 'dark' ? theme.colors.primary : C.green,
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}
