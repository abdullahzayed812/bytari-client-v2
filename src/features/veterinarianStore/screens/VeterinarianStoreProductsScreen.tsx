import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { Routes } from '@/constants/routes';
import {
  StoreGridProductCard,
  StoreGridProductCardSkeleton,
  StorePills,
  StoreTopBar,
  storeCategoryStyle,
  useStoreGrid,
  type StorePill,
} from '@/features/storeShared';
import { useDebouncedValue } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import {
  useVeterinarianStore,
  useVeterinarianStoreCartMutations,
  useVeterinarianStoreCategories,
  useVeterinarianStoreProducts,
} from '../hooks';
import type { VetStoreCategory } from '../types';
import { formatAmount } from '../utils';

/**
 * Route `/veterinarian-store/products` — the category page of the references
 * (أدوية / معدات طبية / مكملات غذائية / مستلزمات مختبر): centred title with the
 * category's tinted icon, search, "الكل" + sub-section pills, and a compact
 * 3-up product grid (more columns on wide screens) with infinite scroll.
 *
 * Opened with `?categoryId=<section>` from the home cards, the page is locked
 * to that section; without it (search / "all products") the pills list the
 * sections, and picking one drills into it.
 */
export default function VeterinarianStoreProductsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinarianStore');
  const toast = useToast();
  const params = useLocalSearchParams<{ categoryId?: string; search?: string }>();
  const grid = useStoreGrid({ padding: 12, gap: 8 });

  const [rawSearch, setRawSearch] = useState(params.search ?? '');
  const search = useDebouncedValue(rawSearch);
  const [categoryId, setCategoryId] = useState<string | undefined>(params.categoryId);
  // A section picked from the pills when the page was not opened on one.
  const [pickedSectionId, setPickedSectionId] = useState<string | undefined>();

  const { itemCount } = useVeterinarianStore();
  const categoriesQ = useVeterinarianStoreCategories();
  const q = useVeterinarianStoreProducts({ search, categoryId });
  const { addItem } = useVeterinarianStoreCartMutations();

  const categories = categoriesQ.data ?? [];
  const ids = new Set(categories.map((c) => c.id));
  // a sub-category whose section is hidden / inactive is shown as a section
  const isSection = (c: VetStoreCategory) => !c.parentId || !ids.has(c.parentId);
  const sectionOf = (id: string | undefined): VetStoreCategory | undefined => {
    const c = categories.find((x) => x.id === id);
    if (!c) return undefined;
    return isSection(c) ? c : categories.find((x) => x.id === c.parentId);
  };
  const lockedSection = sectionOf(params.categoryId);
  const section = lockedSection ?? sectionOf(pickedSectionId);
  const style = storeCategoryStyle(section);

  const pills: StorePill[] = section
    ? [
        { id: section.id, label: t('categories.all') },
        ...categories
          .filter((c) => c.parentId === section.id)
          .map((c) => ({ id: c.id, label: c.name })),
      ]
    : [
        { id: undefined, label: t('categories.all') },
        ...categories.filter(isSection).map((c) => ({ id: c.id, label: c.name })),
      ];

  const onSelectPill = (id: string | undefined): void => {
    if (!section && id) setPickedSectionId(id); // drill into the picked section
    setCategoryId(id);
  };

  const onBack = (): void => {
    // Leave a drilled-into section first, then the page.
    if (!lockedSection && pickedSectionId) {
      setPickedSectionId(undefined);
      setCategoryId(undefined);
      return;
    }
    router.back();
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

  const header = (
    <View style={{ rowGap: 10, paddingBottom: 10 }}>
      <View style={{ paddingHorizontal: 16 }}>
        <SearchInput
          value={rawSearch}
          onChangeText={setRawSearch}
          onClear={() => setRawSearch('')}
          placeholder={
            section
              ? t('products.searchInPlaceholder', { name: section.name })
              : t('products.searchPlaceholder')
          }
          accessibilityLabel={t('products.searchPlaceholder')}
        />
      </View>
      {pills.length > 1 ? (
        <StorePills
          items={pills}
          selectedId={categoryId}
          onSelect={onSelectPill}
          accent={style.accent}
        />
      ) : null}
    </View>
  );

  const topBar = (
    <StoreTopBar
      title={section?.name ?? t('products.title')}
      subtitle={section ? undefined : t('products.subtitle')}
      icon={style.icon}
      accent={style.accent}
      cartCount={itemCount}
      onCartPress={() => router.push(Routes.veterinarianStoreCart)}
      cartA11yLabel={t('cart.open')}
      back={{ a11yLabel: t('common.back'), onPress: onBack }}
    />
  );

  return (
    <SafeAreaScreen>
      {topBar}

      <View style={{ flex: 1 }} onLayout={grid.onLayout}>
        {q.isLoading ? (
          <View style={{ paddingTop: 4 }}>
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
                <StoreGridProductCardSkeleton key={i} width={grid.cardWidth} />
              ))}
            </View>
          </View>
        ) : q.isError ? (
          <View style={{ paddingTop: 4 }}>
            {header}
            <ErrorState error={q.error} onRetry={() => void q.refetch()} />
          </View>
        ) : (
          <FlatList
            // numColumns cannot change on a mounted FlatList — remount per column count.
            key={`grid-${grid.columns}`}
            data={q.products}
            keyExtractor={(item) => item.id}
            numColumns={grid.columns}
            columnWrapperStyle={{ gap: grid.gap, paddingHorizontal: grid.padding }}
            renderItem={({ item }) => {
              const category = categories.find((c) => c.id === item.categoryId);
              return (
                <StoreGridProductCard
                  width={grid.cardWidth}
                  title={item.name}
                  subtitle={item.categoryName}
                  imageUrl={item.primaryImageUrl}
                  price={formatAmount(item.price)}
                  currency={t('common.currencyShort')}
                  rating={{ average: item.ratingAverage, count: item.ratingCount }}
                  accent={
                    section
                      ? style.accent
                      : storeCategoryStyle(category, sectionOf(item.categoryId ?? undefined)).accent
                  }
                  actionLabel={item.inStock ? t('product.shop') : t('product.outOfStock')}
                  actionDisabled={!item.inStock}
                  actionLoading={addItem.isPending && addItem.variables?.productId === item.id}
                  onAction={() => onAdd(item.id)}
                  onPress={() => router.push(Routes.veterinarianStoreProduct(item.id))}
                />
              );
            }}
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
              paddingTop: 4,
              paddingBottom: theme.spacing.huge,
              rowGap: grid.gap,
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
      </View>
    </SafeAreaScreen>
  );
}
