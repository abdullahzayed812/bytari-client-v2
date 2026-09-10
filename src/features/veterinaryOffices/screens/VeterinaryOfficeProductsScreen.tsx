import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, useWindowDimensions, View } from 'react-native';

import { Button } from '@/components/actions';
import { Chip, type IconName } from '@/components/content';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { PRODUCT_TYPE_ORDER, productTypeIcon, type ProductType } from '@/features/store';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { VeterinaryProductCard } from '../components';
import { useVeterinaryOfficeProducts } from '../hooks';

const NUM_COLUMNS = 2;
const GRID_GAP = 12;

/** Full public product catalog for one veterinary office/store. */
export default function VeterinaryOfficeProductsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryOffices');
  const { t: ts } = useTranslation('store');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const { officeId } = useLocalSearchParams<{ officeId: string }>();

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [type, setType] = useState<ProductType | undefined>(undefined);

  const q = useVeterinaryOfficeProducts(officeId, { search: search || undefined, productType: type });

  const { width: windowWidth } = useWindowDimensions();
  const columnWidth =
    (windowWidth - theme.screenPadding * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

  return (
    <SafeAreaScreen>
      <AppHeader title={t('products.title')} showBack backAlign="left" />

      <View
        style={{
          paddingHorizontal: theme.screenPadding,
          paddingTop: theme.spacing.md,
          rowGap: theme.spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
          <Button
            label={t('products.filter')}
            variant="outline"
            leftIcon="funnel-outline"
            onPress={() => toast.show({ message: tc('comingSoon'), tone: 'info' })}
          />
          <View style={{ flex: 1 }}>
            <SearchInput
              value={rawSearch}
              onChangeText={setRawSearch}
              onClear={() => setRawSearch('')}
              placeholder={t('products.searchPlaceholder')}
              accessibilityLabel={t('products.searchPlaceholder')}
            />
          </View>
        </View>

        <FlatList
          data={PRODUCT_TYPE_ORDER}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          ItemSeparatorComponent={() => <View style={{ width: theme.spacing.sm }} />}
          ListHeaderComponent={
            <Chip
              label={t('products.all')}
              icon={'grid-outline' as IconName}
              selected={type === undefined}
              onPress={() => setType(undefined)}
            />
          }
          ListHeaderComponentStyle={{ marginEnd: theme.spacing.sm }}
          renderItem={({ item }) => (
            <Chip
              label={ts(`productType.${item}`)}
              icon={productTypeIcon(item)}
              selected={type === item}
              onPress={() => setType(item)}
            />
          )}
        />

        <Caption>{t('products.resultsCount', { count: q.total })}</Caption>
      </View>

      {q.isLoading ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <Loading fill />
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.products}
          keyExtractor={(p) => p.id}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={{ columnGap: GRID_GAP }}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
          renderItem={({ item }) => (
            <VeterinaryProductCard
              product={item}
              width={columnWidth}
              onPress={() =>
                router.push(Routes.veterinaryOfficeProductDetail(officeId as string, item.id))
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="cube-outline"
              title={search || type ? t('products.emptySearch') : t('products.empty')}
            />
          }
          ListFooterComponent={
            q.isFetchingNextPage ? (
              <Loading label={t('products.loadingMore')} />
            ) : q.hasNextPage ? (
              <Button
                label={t('list.loadMore')}
                variant="outline"
                fullWidth
                onPress={() => void q.fetchNextPage()}
              />
            ) : null
          }
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing.huge,
            flexGrow: 1,
          }}
        />
      )}
    </SafeAreaScreen>
  );
}
