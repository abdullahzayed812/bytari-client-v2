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

import { FeaturedTipCard, TipCard, TipCardSkeleton } from '../components';
import { useTipEngagement, useTipOfTheDay, useTips } from '../hooks';
import type { TipListItem } from '../types';

const GAP = 12;

/** Route `/tips` — "أفضل النصائح": search, featured "نصيحة اليوم", 2-up grid. */
export default function TipsListScreen() {
  const theme = useTheme();
  const { t } = useTranslation('tips');
  const { width } = useWindowDimensions();
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);

  const q = useTips({ search });
  const featured = useTipOfTheDay({ enabled: search.trim().length === 0 });
  const { toggleBookmark } = useTipEngagement();

  const cardWidth = Math.floor((width - theme.screenPadding * 2 - GAP) / 2);
  const goToTip = (tip: TipListItem) => router.push(Routes.tip(tip.id));

  const header = (
    <View style={{ rowGap: theme.spacing.lg, paddingBottom: theme.spacing.md }}>
      <SearchInput
        value={rawSearch}
        onChangeText={setRawSearch}
        onClear={() => setRawSearch('')}
        placeholder={t('list.searchPlaceholder')}
        accessibilityLabel={t('list.searchPlaceholder')}
      />
      {featured.data && search.trim().length === 0 ? (
        <View style={{ rowGap: theme.spacing.sm }}>
          <Label>{t('featured.section')}</Label>
          <FeaturedTipCard
            tip={featured.data}
            onPress={() => goToTip(featured.data as TipListItem)}
          />
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
        right={<Icon name="bulb-outline" size="iconMd" color="primary" />}
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
              <TipCardSkeleton key={i} width={cardWidth} />
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
          data={q.tips}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: GAP }}
          renderItem={({ item }) => (
            <TipCard
              tip={item}
              width={cardWidth}
              onPress={() => goToTip(item)}
              onToggleBookmark={(next) => toggleBookmark(item.id, next)}
            />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              icon="bulb-outline"
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
