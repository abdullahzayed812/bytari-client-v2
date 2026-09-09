import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { Card } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { OrderStatusBadge, StoreHeader } from '../components';
import { usePetOwnerStoreOrders } from '../hooks';
import { formatAmount } from '../utils';

/** Route `/pet-owner-store/orders` — the shopper's order history. */
export default function PetOwnerStoreOrdersScreen() {
  const theme = useTheme();
  const { t } = useTranslation('petOwnerStore');
  const q = usePetOwnerStoreOrders();

  return (
    <SafeAreaScreen>
      <StoreHeader title={t('orders.title')} showBack />

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
              onPress={() => router.push(Routes.petOwnerStoreOrder(item.id))}
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
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Caption>{t('orders.itemCount', { count: item.items.length })}</Caption>
                  <Text variant="label" color="primary">
                    {t('common.price', { value: formatAmount(item.totalAmount) })}
                  </Text>
                </View>
              </View>
            </Card>
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
