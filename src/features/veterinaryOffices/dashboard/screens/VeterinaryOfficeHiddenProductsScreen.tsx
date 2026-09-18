import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, useWindowDimensions, View } from 'react-native';

import { Alert, ConfirmationDialog, EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useOrganization } from '@/features/organizations';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { VeterinaryOfficeDashboardShell, VeterinaryOfficeProductManageCard } from '../components';
import {
  useDeleteVeterinaryOfficeProduct,
  useUpdateVeterinaryOfficeProduct,
  useVeterinaryOfficeProducts,
} from '../hooks';
import { veterinaryOfficeErrorMessage } from '../../validation/schemas';
import type { VeterinaryOfficeProduct } from '../../types';

const NUM_COLUMNS = 3;
const GRID_GAP = 12;

/** Route `/vet-office-dashboard/[organizationId]/hidden-products` — "المنتجات المخفية". */
export default function VeterinaryOfficeHiddenProductsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryOfficeDashboard');
  const { t: tOffice } = useTranslation('veterinaryOffices');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const org = useOrganization(orgId);
  const canOperate =
    org.data?.status === 'ACTIVE' && org.data?.details.subscriptionStatus === 'ACTIVE';

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const q = useVeterinaryOfficeProducts(orgId, { search, status: 'ACTIVE', hidden: true });
  const update = useUpdateVeterinaryOfficeProduct(orgId);
  const del = useDeleteVeterinaryOfficeProduct(orgId);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { width: windowWidth } = useWindowDimensions();
  const cardWidth =
    (windowWidth - theme.screenPadding * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

  const onShow = (product: VeterinaryOfficeProduct) => {
    update.mutate(
      { productId: product.id, body: { isHidden: false } },
      {
        onSuccess: () => toast.show({ tone: 'success', message: t('hiddenProducts.showSuccess') }),
        onError: (error) =>
          toast.show({ tone: 'danger', message: veterinaryOfficeErrorMessage(error, tOffice) }),
      },
    );
  };

  const onConfirmDelete = () => {
    if (!confirmDeleteId) return;
    const productId = confirmDeleteId;
    setConfirmDeleteId(null);
    del.mutate(
      { productId },
      {
        onSuccess: () => toast.show({ tone: 'success', message: t('products.deleteSuccess') }),
        onError: (error) =>
          toast.show({ tone: 'danger', message: veterinaryOfficeErrorMessage(error, tOffice) }),
      },
    );
  };

  return (
    <VeterinaryOfficeDashboardShell organizationId={orgId} active="home">
      <AppHeader title={t('hiddenProducts.title')} showBack />

      <View style={{ paddingHorizontal: theme.screenPadding, paddingBottom: theme.spacing.md, rowGap: theme.spacing.md }}>
        {canOperate ? null : <Alert tone="warning" message={t('status.actionsDisabledNotice')} />}
        <SearchInput
          value={rawSearch}
          onChangeText={setRawSearch}
          onClear={() => setRawSearch('')}
          placeholder={t('hiddenProducts.searchPlaceholder')}
          accessibilityLabel={t('hiddenProducts.searchPlaceholder')}
        />
      </View>

      {q.isLoading ? (
        <View style={{ paddingHorizontal: theme.screenPadding }}>
          <Loading />
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.products}
          keyExtractor={(p) => p.id}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={{ columnGap: GRID_GAP }}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingBottom: theme.spacing.huge,
            flexGrow: 1,
          }}
          ListHeaderComponent={
            q.total > 0 ? (
              <Caption style={{ paddingBottom: theme.spacing.sm }}>
                {t('hiddenProducts.count', { count: q.total })}
              </Caption>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="eye-off-outline"
              title={search ? t('products.emptyFiltered') : t('hiddenProducts.empty')}
              message={t('hiddenProducts.emptyHint')}
            />
          }
          ListFooterComponent={q.isFetchingNextPage ? <Loading label={t('products.loadingMore')} /> : null}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
          }}
          renderItem={({ item }) => (
            <VeterinaryOfficeProductManageCard
              product={item}
              width={cardWidth}
              onPress={() => router.push(Routes.organizationOfficeProduct(orgId, item.id))}
              onEdit={() => router.push(Routes.organizationOfficeProductEdit(orgId, item.id))}
              onDelete={() => setConfirmDeleteId(item.id)}
              onToggleHidden={() => onShow(item)}
              readOnly={!canOperate}
            />
          )}
        />
      )}

      <ConfirmationDialog
        visible={confirmDeleteId != null}
        title={t('products.deleteConfirmTitle')}
        message={t('products.deleteConfirmBody')}
        confirmLabel={t('products.deleteConfirmCta')}
        cancelLabel={t('products.cancel')}
        destructive
        loading={del.isPending}
        onConfirm={onConfirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </VeterinaryOfficeDashboardShell>
  );
}
