import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Chip } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { orgCapabilities, useOrganization } from '@/features/organizations';
import { useCapabilities, useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { VeterinaryStoreProductCard, VeterinaryStoreProductCardSkeleton } from '../components';
import { VETERINARY_STORE_PRODUCT_TYPE_ORDER } from '../constants';
import { useVeterinaryStoreProducts } from '../hooks';
import type { VeterinaryStoreProduct, VeterinaryStoreProductType } from '../types';

/** Route `/organizations/[organizationId]/store-products` — a veterinary store's catalogue. */
export default function VeterinaryStoreProductsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryStore');
  const { isAdmin } = useCapabilities();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const detail = useOrganization(orgId);
  const caps = orgCapabilities(detail.data?.myRole, isAdmin);
  const canAdd = caps.canManageStoreProducts;

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [type, setType] = useState<VeterinaryStoreProductType | undefined>(undefined);

  const q = useVeterinaryStoreProducts(orgId, { search, productType: type });

  const goToDetail = (p: VeterinaryStoreProduct) => router.push(Routes.organizationStoreProduct(orgId, p.id));
  const goToCreate = () => router.push(Routes.organizationStoreProductCreate(orgId));

  const header = (
    <View style={{ paddingBottom: theme.spacing.md, rowGap: theme.spacing.sm }}>
      <SearchInput
        value={rawSearch}
        onChangeText={setRawSearch}
        onClear={() => setRawSearch('')}
        placeholder={t('list.searchPlaceholder')}
        accessibilityLabel={t('list.searchPlaceholder')}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
        <Chip
          label={t('list.filterAll')}
          selected={type === undefined}
          onPress={() => setType(undefined)}
        />
        {VETERINARY_STORE_PRODUCT_TYPE_ORDER.map((pt) => (
          <Chip
            key={pt}
            label={t(`productType.${pt}`)}
            selected={type === pt}
            onPress={() => setType((cur) => (cur === pt ? undefined : pt))}
          />
        ))}
      </View>
      {q.total > 0 ? <Caption>{t('list.count', { count: q.total })}</Caption> : null}
    </View>
  );

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('list.title')}
        showBack
        right={
          canAdd ? (
            <IconButton
              icon="add"
              variant="soft"
              accessibilityLabel={t('list.addCta')}
              onPress={goToCreate}
            />
          ) : undefined
        }
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
          {[0, 1, 2, 3].map((i) => (
            <VeterinaryStoreProductCardSkeleton key={i} />
          ))}
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          {header}
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.products}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <VeterinaryStoreProductCard product={item} onPress={() => goToDetail(item)} />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              icon="storefront-outline"
              title={search || type ? t('list.emptyFiltered') : t('list.empty')}
              message={
                search || type
                  ? t('list.emptyFilteredHint')
                  : canAdd
                    ? t('list.emptyHintManage')
                    : t('list.emptyHint')
              }
              actionLabel={canAdd && !search && !type ? t('list.addCta') : undefined}
              onAction={canAdd && !search && !type ? goToCreate : undefined}
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
