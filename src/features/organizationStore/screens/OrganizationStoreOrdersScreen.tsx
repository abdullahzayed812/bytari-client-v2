import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';

import { Chip } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { OrgStoreOrderCard } from '../components';
import { useMyOrgStoreOrders, useOrgStoreRealtime } from '../hooks';
import { ORG_STORE_ORDER_STATUSES, type OrgStoreOrderStatus } from '../types';

/** Route `/organization-store/orders` — the customer's clinic / office orders (history). */
export default function OrganizationStoreOrdersScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizationStore');
  useOrgStoreRealtime();
  const [status, setStatus] = useState<OrgStoreOrderStatus | undefined>(undefined);
  const q = useMyOrgStoreOrders({ status });

  return (
    <SafeAreaScreen>
      <AppHeader title={t('orders.title')} showBack />
      <View style={{ paddingHorizontal: theme.screenPadding, paddingBottom: theme.spacing.sm }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', columnGap: theme.spacing.xs }}>
            <Chip
              label={t('orders.filterAll')}
              selected={status === undefined}
              onPress={() => setStatus(undefined)}
            />
            {ORG_STORE_ORDER_STATUSES.map((s) => (
              <Chip
                key={s}
                label={t(`order.status.${s}`)}
                selected={status === s}
                onPress={() => setStatus(s)}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : (
        <FlatList
          data={q.orders}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => (
            <OrgStoreOrderCard
              order={item}
              side="CUSTOMER"
              onPress={() => router.push(Routes.orgStoreOrder(item.id))}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title={t('orders.empty')}
              message={t('orders.emptyHint')}
            />
          }
          ListFooterComponent={
            q.isFetchingNextPage ? <Loading label={t('orders.loadingMore')} /> : null
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
          }}
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching && !q.isFetchingNextPage}
              onRefresh={() => void q.refetch()}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={{
            padding: theme.screenPadding,
            rowGap: theme.spacing.md,
            paddingBottom: theme.spacing.huge,
            flexGrow: 1,
          }}
        />
      )}
    </SafeAreaScreen>
  );
}
