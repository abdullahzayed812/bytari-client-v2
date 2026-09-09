import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';

import { Card, Chip } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { OrderStatusBadge } from '../../components';
import { PET_STORE_ORDER_STATUSES, type PetStoreOrderStatus } from '../../types';
import { formatAmount } from '../../utils';
import { usePetStoreAdminOrders } from '../hooks';

/** Route `/(app)/admin/pet-owner-store/orders` — the store order queue. */
export default function PetOwnerStoreAdminOrdersScreen() {
  const theme = useTheme();
  const { t } = useTranslation('petOwnerStore');
  const [status, setStatus] = useState<PetStoreOrderStatus | undefined>();
  const q = usePetStoreAdminOrders(status);

  return (
    <SafeAreaScreen>
      <AppHeader title={t('admin.orders.title')} showBack />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          columnGap: theme.spacing.sm,
          paddingHorizontal: theme.screenPadding,
          paddingVertical: theme.spacing.sm,
        }}
      >
        <Chip
          label={t('admin.orders.filterAll')}
          selected={!status}
          onPress={() => setStatus(undefined)}
        />
        {PET_STORE_ORDER_STATUSES.map((s) => (
          <Chip
            key={s}
            label={t(`order.status.${s}`)}
            selected={status === s}
            onPress={() => setStatus(s)}
          />
        ))}
      </ScrollView>

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : (
        <FlatList
          data={q.orders}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => (
            <Card
              variant="outlined"
              padding="md"
              onPress={() => router.push(Routes.adminPetStoreOrder(item.id))}
              accessibilityLabel={item.orderNumber}
            >
              <View style={{ rowGap: theme.spacing.xs }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text variant="bodyStrong">{item.orderNumber}</Text>
                  <OrderStatusBadge status={item.status} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Caption>
                    {item.recipientName} · {item.city}
                  </Caption>
                  <Text variant="label" color="primary">
                    {t('common.price', { value: formatAmount(item.totalAmount) })}
                  </Text>
                </View>
              </View>
            </Card>
          )}
          ListEmptyComponent={<EmptyState icon="receipt-outline" title={t('admin.orders.empty')} />}
          ListFooterComponent={q.isFetchingNextPage ? <Loading /> : null}
          contentContainerStyle={{
            padding: theme.screenPadding,
            rowGap: theme.spacing.md,
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
