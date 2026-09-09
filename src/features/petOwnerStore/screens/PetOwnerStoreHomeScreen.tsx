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
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import {
  HomeCategoryCircle,
  StoreHeader,
  StoreProductCard,
  StoreProductCardSkeleton,
} from '../components';
import {
  usePetOwnerStoreCartMutations,
  usePetOwnerStoreCategories,
  usePetOwnerStoreProducts,
} from '../hooks';

/** Route `/pet-owner-store` — the store home. Also the Pet Owner mode's 3rd tab. */
export default function PetOwnerStoreHomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation('petOwnerStore');
  const toast = useToast();
  const [search, setSearch] = useState('');

  const homeCats = usePetOwnerStoreCategories({ homeOnly: true });
  const products = usePetOwnerStoreProducts({ pageSize: 6 });
  const { addItem } = usePetOwnerStoreCartMutations();

  const cardWidth = 168;

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

  return (
    <SafeAreaScreen>
      <StoreHeader title={t('home.title')} subtitle={t('home.subtitle')} />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: theme.spacing.huge,
          rowGap: theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: theme.screenPadding }}>
          <SearchInput
            value={search}
            onChangeText={setSearch}
            onClear={() => setSearch('')}
            onSubmitEditing={submitSearch}
            placeholder={t('home.searchPlaceholder')}
            accessibilityLabel={t('home.searchPlaceholder')}
          />
        </View>

        <View style={{ paddingHorizontal: theme.screenPadding }}>
          <Advertisement placement="PET_OWNER_STORE" />
        </View>

        {homeCats.data && homeCats.data.length > 0 ? (
          <View style={{ rowGap: theme.spacing.sm }}>
            <Label style={{ paddingHorizontal: theme.screenPadding }}>
              {t('home.shopByAnimal')}
            </Label>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                columnGap: theme.spacing.md,
                paddingHorizontal: theme.screenPadding,
              }}
            >
              {homeCats.data.map((c) => (
                <HomeCategoryCircle
                  key={c.id}
                  category={c}
                  onPress={() =>
                    router.push({
                      pathname: Routes.petOwnerStoreProducts,
                      params: { categoryId: c.id },
                    })
                  }
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={{ rowGap: theme.spacing.md, paddingHorizontal: theme.screenPadding }}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Label>{t('home.picks')}</Label>
          </View>

          {products.isError ? (
            <ErrorState error={products.error} onRetry={() => void products.refetch()} />
          ) : (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                rowGap: theme.spacing.md,
              }}
            >
              {products.isLoading
                ? [0, 1, 2, 3].map((i) => <StoreProductCardSkeleton key={i} width={cardWidth} />)
                : products.products.map((p) => (
                    <StoreProductCard
                      key={p.id}
                      product={p}
                      width={cardWidth}
                      adding={addItem.isPending && addItem.variables?.productId === p.id}
                      onPress={() => router.push(Routes.petOwnerStoreProduct(p.id))}
                      onAddToCart={() => onAdd(p.id)}
                    />
                  ))}
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
