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

import { VeterinaryOfficeProductCard, VeterinaryOfficeProductCardSkeleton } from '../components';
import { VETERINARY_OFFICE_PRODUCT_TYPE_ORDER } from '../../constants';
import { useVeterinaryOfficeProducts } from '../hooks';
import type { VeterinaryOfficeProduct, VeterinaryOfficeProductType } from '../../types';

/** Route `/organizations/[organizationId]/office-products` — a veterinary office's catalogue (management). */
export default function VeterinaryOfficeProductsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryOffices');
  const { isAdmin } = useCapabilities();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const detail = useOrganization(orgId);
  const caps = orgCapabilities(detail.data?.myRole, isAdmin);
  const canAdd = caps.canManageStoreProducts;

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [type, setType] = useState<VeterinaryOfficeProductType | undefined>(undefined);

  const q = useVeterinaryOfficeProducts(orgId, { search, productType: type });

  const goToDetail = (p: VeterinaryOfficeProduct) => router.push(Routes.organizationOfficeProduct(orgId, p.id));
  const goToCreate = () => router.push(Routes.organizationOfficeProductCreate(orgId));

  const header = (
    <View style={{ paddingBottom: theme.spacing.md, rowGap: theme.spacing.sm }}>
      <SearchInput
        value={rawSearch}
        onChangeText={setRawSearch}
        onClear={() => setRawSearch('')}
        placeholder={t('manage.list.searchPlaceholder')}
        accessibilityLabel={t('manage.list.searchPlaceholder')}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
        <Chip
          label={t('manage.list.filterAll')}
          selected={type === undefined}
          onPress={() => setType(undefined)}
        />
        {VETERINARY_OFFICE_PRODUCT_TYPE_ORDER.map((pt) => (
          <Chip
            key={pt}
            label={t(`productType.${pt}`)}
            selected={type === pt}
            onPress={() => setType((cur) => (cur === pt ? undefined : pt))}
          />
        ))}
      </View>
      {q.total > 0 ? <Caption>{t('manage.list.count', { count: q.total })}</Caption> : null}
    </View>
  );

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('manage.list.title')}
        showBack
        right={
          canAdd ? (
            <IconButton
              icon="add"
              variant="soft"
              accessibilityLabel={t('manage.list.addCta')}
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
            <VeterinaryOfficeProductCardSkeleton key={i} />
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
          renderItem={({ item }) => (
            <VeterinaryOfficeProductCard product={item} onPress={() => goToDetail(item)} />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              icon="storefront-outline"
              title={search || type ? t('manage.list.emptyFiltered') : t('manage.list.empty')}
              message={
                search || type
                  ? t('manage.list.emptyFilteredHint')
                  : canAdd
                    ? t('manage.list.emptyHintManage')
                    : t('manage.list.emptyHint')
              }
              actionLabel={canAdd && !search && !type ? t('manage.list.addCta') : undefined}
              onAction={canAdd && !search && !type ? goToCreate : undefined}
            />
          }
          ListFooterComponent={
            q.isFetchingNextPage ? <Loading label={t('manage.list.loadingMore')} /> : null
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
