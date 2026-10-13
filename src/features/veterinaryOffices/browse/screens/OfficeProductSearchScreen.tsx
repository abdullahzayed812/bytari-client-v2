import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';

import { Button } from '@/components/actions';
import { Chip, Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { BottomSheet } from '@/components/overlays';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import {
  VETERINARY_OFFICE_PRODUCT_TYPES,
  type OfficeProductSearchHit,
  type VeterinaryOfficeProductType,
} from '../../types';
import { formatProductPrice, productCurrency } from '../../utils';
import { useOfficeProductFacetsAll, useOfficeProductSearch } from '../hooks';

/**
 * Route `/(app)/veterinary-offices/products-search` — "البحث عن منتج في كل
 * المكاتب": one search over the products of EVERY public veterinary office.
 * Each result shows the product (photo, name, type, price) and the office that
 * sells it; tapping opens the product, tapping the office line opens the office.
 * The filter sheet narrows by brand / country of origin (values from every
 * office's public products).
 */
export default function OfficeProductSearchScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryOffices');
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [productType, setProductType] = useState<VeterinaryOfficeProductType | undefined>();
  const [brand, setBrand] = useState<string | undefined>();
  const [country, setCountry] = useState<string | undefined>();
  const [filterOpen, setFilterOpen] = useState(false);
  const activeFilters = (brand ? 1 : 0) + (country ? 1 : 0);
  const q = useOfficeProductSearch({ search, productType, brand, country });
  const facets = useOfficeProductFacetsAll();

  const renderItem = ({ item }: { item: OfficeProductSearchHit }) => (
    <SearchHitRow
      hit={item}
      onOpenProduct={() =>
        router.push(Routes.veterinaryOfficeProductDetail(item.office.id, item.product.id))
      }
      onOpenOffice={() => router.push(Routes.veterinaryOfficeDetail(item.office.id))}
    />
  );

  return (
    <SafeAreaScreen>
      <AppHeader title={t('productSearch.title')} showBack />
      <View style={{ paddingHorizontal: theme.screenPadding, rowGap: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
          <Button
            label={
              activeFilters > 0
                ? t('products.filterActive', { count: activeFilters })
                : t('products.filter')
            }
            variant={activeFilters > 0 ? 'primary' : 'outline'}
            leftIcon="funnel-outline"
            onPress={() => setFilterOpen(true)}
          />
          <View style={{ flex: 1 }}>
            <SearchInput
              value={rawSearch}
              onChangeText={setRawSearch}
              onClear={() => setRawSearch('')}
              placeholder={t('productSearch.placeholder')}
              accessibilityLabel={t('productSearch.placeholder')}
              autoFocus
            />
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          <Chip
            label={t('productSearch.allTypes')}
            selected={!productType}
            onPress={() => setProductType(undefined)}
          />
          {VETERINARY_OFFICE_PRODUCT_TYPES.map((type) => (
            <Chip
              key={type}
              label={t(`productType.${type}`)}
              selected={productType === type}
              onPress={() => setProductType(productType === type ? undefined : type)}
            />
          ))}
        </View>
        {q.enabled && q.isSuccess ? (
          <Caption color="textSecondary">{t('productSearch.count', { count: q.total })}</Caption>
        ) : null}
      </View>

      {!q.enabled ? (
        <EmptyState
          icon="search-outline"
          title={t('productSearch.hintTitle')}
          message={t('productSearch.hintBody')}
        />
      ) : q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.hits}
          keyExtractor={(h) => h.product.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              icon="cube-outline"
              title={t('productSearch.emptyTitle')}
              message={t('productSearch.emptyBody')}
            />
          }
          ListFooterComponent={q.isFetchingNextPage ? <Loading /> : null}
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
          contentContainerStyle={{
            padding: theme.screenPadding,
            paddingBottom: theme.spacing.huge,
            rowGap: theme.spacing.md,
            flexGrow: 1,
          }}
        />
      )}
      <BottomSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        title={t('products.filterTitle')}
      >
        <View style={{ rowGap: theme.spacing.md, paddingBottom: theme.spacing.lg }}>
          {(
            [
              ['filterBrand', facets.data?.brands ?? [], brand, setBrand],
              ['filterCountry', facets.data?.countries ?? [], country, setCountry],
            ] as const
          ).map(([labelKey, values, current, set]) => (
            <View key={labelKey} style={{ rowGap: theme.spacing.xs }}>
              <Label>{t(`products.${labelKey}`)}</Label>
              {values.length === 0 ? (
                <Caption>{t('products.filterNone')}</Caption>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                  {values.map((v) => {
                    const selected = current?.toLowerCase() === v.toLowerCase();
                    return (
                      <Chip
                        key={v}
                        label={v}
                        selected={selected}
                        onPress={() => set(selected ? undefined : v)}
                      />
                    );
                  })}
                </View>
              )}
            </View>
          ))}
          <Button
            label={t('products.filterApply')}
            fullWidth
            onPress={() => setFilterOpen(false)}
          />
          {activeFilters > 0 ? (
            <Button
              label={t('products.filterClear')}
              variant="ghost"
              fullWidth
              onPress={() => {
                setBrand(undefined);
                setCountry(undefined);
              }}
            />
          ) : null}
        </View>
      </BottomSheet>
    </SafeAreaScreen>
  );
}

function SearchHitRow({
  hit,
  onOpenProduct,
  onOpenOffice,
}: {
  hit: OfficeProductSearchHit;
  onOpenProduct: () => void;
  onOpenOffice: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryOffices');
  const { product, office } = hit;

  return (
    <View
      style={{
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('productSearch.openProductA11y', {
          product: product.name,
          office: office.name,
        })}
        onPress={onOpenProduct}
        style={({ pressed }) => ({
          flexDirection: 'row',
          columnGap: theme.spacing.md,
          padding: theme.spacing.md,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surfaceAccent,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {product.primaryImageUrl ? (
            <Image
              source={{ uri: product.primaryImageUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <Icon name="image-outline" size="iconLg" color="textMuted" />
          )}
        </View>
        <View style={{ flex: 1, rowGap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {product.name}
          </Text>
          <Caption color="textSecondary" numberOfLines={1}>
            {[t(`productType.${product.productType}`), product.brand].filter(Boolean).join(' · ')}
          </Caption>
          <Text variant="bodyStrong" color="primary">
            {product.price != null
              ? t('product.price', {
                  value: formatProductPrice(product.price),
                  currency: t(`currency.${productCurrency(product)}`),
                })
              : t('product.noPrice')}
          </Text>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('productSearch.openOfficeA11y', { office: office.name })}
        onPress={onOpenOffice}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          borderTopWidth: theme.sizes.hairline,
          borderTopColor: theme.colors.divider,
          backgroundColor: pressed ? theme.colors.surfaceMuted : theme.colors.surfaceAccent,
        })}
      >
        {office.logoUrl ? (
          <Image
            source={{ uri: office.logoUrl }}
            style={{ width: 24, height: 24, borderRadius: 12 }}
            contentFit="cover"
          />
        ) : (
          <Icon name="business-outline" size="iconSm" color="primary" />
        )}
        <View style={{ flex: 1 }}>
          <Caption color="textSecondary">{t('productSearch.soldBy')}</Caption>
          <Text variant="bodyMedium" numberOfLines={1}>
            {office.name}
          </Text>
          {office.address ? (
            <Caption numberOfLines={1} color="textMuted">
              {office.address}
            </Caption>
          ) : null}
        </View>
        <Icon name="chevron-back" directional size="iconSm" color="textMuted" />
      </Pressable>
    </View>
  );
}
