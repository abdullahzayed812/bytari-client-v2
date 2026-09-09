import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Badge, Card, Chip } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import type { PetStoreProductStatus } from '../../types';
import { formatAmount } from '../../utils';
import { usePetStoreAdminProducts } from '../hooks';

/** Route `/(app)/admin/pet-owner-store/products` — catalogue management list. */
export default function PetOwnerStoreAdminProductsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('petOwnerStore');
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [status, setStatus] = useState<PetStoreProductStatus | undefined>();

  const q = usePetStoreAdminProducts({ search, status });

  const header = (
    <View style={{ rowGap: theme.spacing.sm, paddingBottom: theme.spacing.md }}>
      <SearchInput
        value={rawSearch}
        onChangeText={setRawSearch}
        onClear={() => setRawSearch('')}
        placeholder={t('admin.products.searchPlaceholder')}
      />
      <View style={{ flexDirection: 'row', columnGap: theme.spacing.xs }}>
        <Chip
          label={t('admin.products.filterAll')}
          selected={!status}
          onPress={() => setStatus(undefined)}
        />
        <Chip
          label={t('admin.products.filterActive')}
          selected={status === 'ACTIVE'}
          onPress={() => setStatus('ACTIVE')}
        />
        <Chip
          label={t('admin.products.filterInactive')}
          selected={status === 'INACTIVE'}
          onPress={() => setStatus('INACTIVE')}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('admin.products.title')}
        showBack
        right={
          <IconButton
            icon="add"
            accessibilityLabel={t('admin.products.add')}
            onPress={() => router.push(Routes.adminPetStoreProductCreate)}
          />
        }
      />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : (
        <FlatList
          data={q.products}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <Card
              variant="outlined"
              padding="md"
              onPress={() => router.push(Routes.adminPetStoreProduct(item.id))}
              accessibilityLabel={item.name}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}
              >
                <View style={{ flex: 1, rowGap: 4 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Caption numberOfLines={1}>
                    {item.categoryName ?? '—'} ·{' '}
                    {t('common.price', { value: formatAmount(item.price) })} ·{' '}
                    {t('admin.detail.stock', { count: item.stockQuantity })}
                  </Caption>
                </View>
                <Badge
                  label={t(
                    item.status === 'ACTIVE'
                      ? 'admin.form.statusActive'
                      : 'admin.form.statusInactive',
                  )}
                  tone={item.status === 'ACTIVE' ? 'success' : 'neutral'}
                  size="sm"
                />
              </View>
            </Card>
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              icon="pricetags-outline"
              title={t('admin.products.empty')}
              message={t('admin.products.emptyHint')}
              actionLabel={t('admin.products.add')}
              onAction={() => router.push(Routes.adminPetStoreProductCreate)}
            />
          }
          ListFooterComponent={
            q.isFetchingNextPage ? <Loading label={t('admin.products.loadingMore')} /> : null
          }
          contentContainerStyle={{
            padding: theme.screenPadding,
            rowGap: theme.spacing.sm,
            flexGrow: 1,
            paddingBottom: theme.spacing.huge,
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
