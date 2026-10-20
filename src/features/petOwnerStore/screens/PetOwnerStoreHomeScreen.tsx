import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { EmptyState, ErrorState, useToast } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { Label } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { Advertisement } from '@/features/ads';
import {
  StoreGridProductCard,
  StoreGridProductCardSkeleton,
  StoreHomeCategories,
  StoreLogoMark,
  StoreTopBar,
  storeCategoryStyle,
  useStoreGrid,
} from '@/features/storeShared';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import {
  usePetOwnerStore,
  usePetOwnerStoreCartMutations,
  usePetOwnerStoreCategories,
  usePetOwnerStoreProducts,
} from '../hooks';
import { formatAmount } from '../utils';

/**
 * Route `/pet-owner-store` — the store home (also the Pet Owner mode's 3rd
 * tab), laid out after the "متجر أصحاب الحيوانات" reference: brand bar with
 * the cart badge, search, the admin promo carousel, the category cards
 * (first one full width), then the store's picks as compact 3-up cards.
 */
export default function PetOwnerStoreHomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation('petOwnerStore');
  const toast = useToast();
  const [search, setSearch] = useState('');
  const grid = useStoreGrid({ padding: 20, gap: 8 });

  const { itemCount } = usePetOwnerStore();
  const homeCats = usePetOwnerStoreCategories({ homeOnly: true });
  const allCats = usePetOwnerStoreCategories();
  const products = usePetOwnerStoreProducts({ pageSize: grid.columns * 2 });
  const { addItem } = usePetOwnerStoreCartMutations();

  const submitSearch = (): void => {
    const q = search.trim();
    router.push(
      q
        ? { pathname: Routes.petOwnerStoreProducts, params: { search: q } }
        : Routes.petOwnerStoreProducts,
    );
  };

  const onAdd = (productId: string): void => {
    addItem.mutate(
      { productId, quantity: 1 },
      {
        onSuccess: () => toast.show({ message: t('cart.added'), tone: 'success' }),
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  const categories = allCats.data ?? [];

  return (
    <SafeAreaScreen>
      <StoreTopBar
        title={t('home.title')}
        subtitle={t('home.subtitle')}
        logo={<StoreLogoMark icon="paw" />}
        cartCount={itemCount}
        onCartPress={() => router.push(Routes.petOwnerStoreCart)}
        cartA11yLabel={t('cart.open')}
      />

      <ScrollView
        onLayout={grid.onLayout}
        contentContainerStyle={{ paddingBottom: theme.spacing.huge, rowGap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 20 }}>
          <SearchInput
            value={search}
            onChangeText={setSearch}
            onClear={() => setSearch('')}
            onSubmitEditing={submitSearch}
            placeholder={t('home.searchPlaceholder')}
            accessibilityLabel={t('home.searchPlaceholder')}
          />
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <Advertisement placement="PET_OWNER_STORE" />
        </View>

        {homeCats.data && homeCats.data.length > 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <StoreHomeCategories
              categories={homeCats.data}
              allCategories={categories}
              layout="featured"
              onOpen={(c) =>
                router.push({
                  pathname: Routes.petOwnerStoreProducts,
                  params: { categoryId: c.id },
                })
              }
            />
          </View>
        ) : null}

        <View style={{ rowGap: 10, paddingHorizontal: 20 }}>
          <Label>{t('home.picks')}</Label>

          {products.isError ? (
            <ErrorState error={products.error} onRetry={() => void products.refetch()} />
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: grid.gap }}>
              {products.isLoading
                ? Array.from({ length: grid.columns }, (_, i) => (
                    <StoreGridProductCardSkeleton key={i} width={grid.cardWidth} />
                  ))
                : products.products.map((p) => {
                    const category = categories.find((c) => c.id === p.categoryId);
                    const section = category?.parentId
                      ? categories.find((c) => c.id === category.parentId)
                      : undefined;
                    return (
                      <StoreGridProductCard
                        key={p.id}
                        width={grid.cardWidth}
                        title={p.name}
                        subtitle={p.categoryName}
                        imageUrl={p.primaryImageUrl}
                        price={formatAmount(p.price)}
                        currency={t('common.currencyShort')}
                        rating={{ average: p.ratingAverage, count: p.ratingCount }}
                        accent={storeCategoryStyle(category, section).accent}
                        actionLabel={p.inStock ? t('product.shop') : t('product.outOfStock')}
                        actionDisabled={!p.inStock}
                        actionLoading={addItem.isPending && addItem.variables?.productId === p.id}
                        onAction={() => onAdd(p.id)}
                        onPress={() => router.push(Routes.petOwnerStoreProduct(p.id))}
                      />
                    );
                  })}
              {!products.isLoading && products.products.length === 0 ? (
                <EmptyState icon="pricetags-outline" title={t('home.emptyPicks')} />
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaScreen>
  );
}
