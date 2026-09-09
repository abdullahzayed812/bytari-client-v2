import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { Routes } from '@/constants/routes';
import { useDebouncedValue } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import {
  CategoryChips,
  StoreHeader,
  StoreProductCard,
  StoreProductCardSkeleton,
} from '../components';
import {
  usePetOwnerStoreCartMutations,
  usePetOwnerStoreCategories,
  usePetOwnerStoreProducts,
} from '../hooks';

const GAP = 12;

/** Route `/pet-owner-store/products` — search + category filter + infinite grid. */
export default function PetOwnerStoreProductsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('petOwnerStore');
  const toast = useToast();
  const params = useLocalSearchParams<{ categoryId?: string; search?: string }>();

  const [rawSearch, setRawSearch] = useState(params.search ?? '');
  const search = useDebouncedValue(rawSearch);
  const [categoryId, setCategoryId] = useState<string | undefined>(params.categoryId);

  const categories = usePetOwnerStoreCategories();
  const q = usePetOwnerStoreProducts({ search, categoryId });
  const { addItem } = usePetOwnerStoreCartMutations();

  const cardWidth = 168;

  const onAdd = (productId: string): void => {
    addItem.mutate(
      { productId, quantity: 1 },
      {
        onSuccess: () => toast.show({ message: t('cart.added'), tone: 'success' }),
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  const header = (
    <View style={{ rowGap: theme.spacing.md, paddingBottom: theme.spacing.md }}>
      <View style={{ paddingHorizontal: theme.screenPadding }}>
        <SearchInput
          value={rawSearch}
          onChangeText={setRawSearch}
          onClear={() => setRawSearch('')}
          placeholder={t('products.searchPlaceholder')}
          accessibilityLabel={t('products.searchPlaceholder')}
        />
      </View>
      {categories.data && categories.data.length > 0 ? (
        <CategoryChips
          categories={categories.data}
          selectedId={categoryId}
          onSelect={setCategoryId}
        />
      ) : null}
    </View>
  );

  return (
    <SafeAreaScreen>
      <StoreHeader title={t('products.title')} subtitle={t('products.subtitle')} showBack />

      {q.isLoading ? (
        <View style={{ paddingTop: theme.spacing.md }}>
          {header}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              paddingHorizontal: theme.screenPadding,
              rowGap: GAP,
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <StoreProductCardSkeleton key={i} width={cardWidth} />
            ))}
          </View>
        </View>
      ) : q.isError ? (
        <View style={{ paddingTop: theme.spacing.md }}>
          {header}
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: 'space-between',
            paddingHorizontal: theme.screenPadding,
          }}
          renderItem={({ item }) => (
            <StoreProductCard
              product={item}
              width={cardWidth}
              adding={addItem.isPending && addItem.variables?.productId === item.id}
              onPress={() => router.push(Routes.petOwnerStoreProduct(item.id))}
              onAddToCart={() => onAdd(item.id)}
            />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              icon="pricetags-outline"
              title={search ? t('products.emptySearch') : t('products.empty')}
              message={search ? t('products.emptySearchHint') : t('products.emptyHint')}
            />
          }
          ListFooterComponent={
            q.isFetchingNextPage ? <Loading label={t('products.loadingMore')} /> : null
          }
          contentContainerStyle={{
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
            <RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} />
          }
        />
      )}
    </SafeAreaScreen>
  );
}
