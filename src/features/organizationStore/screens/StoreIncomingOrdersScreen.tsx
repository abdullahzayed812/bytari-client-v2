import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';

import { Card, Chip } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { orgCapabilities, useOrganization } from '@/features/organizations';
import { useCapabilities, useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { OrgStoreOrderCard } from '../components';
import {
  useIncomingOrgStoreOrders,
  useIncomingOrgStoreOrdersSummary,
  useOrgStoreRealtime,
} from '../hooks';
import { ORG_STORE_ORDER_STATUSES, type OrgStoreOrderStatus } from '../types';

/**
 * Route `/organization-store/[organizationId]/incoming-orders` — "الطلبات الواردة"
 * of a clinic / veterinary office. Owner, ADMIN, or a member holding
 * `store.order.read` (the server re-checks every call).
 */
export default function StoreIncomingOrdersScreen() {
  const { t } = useTranslation('organizationStore');
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  return (
    <SafeAreaScreen>
      <StoreIncomingOrdersContent
        organizationId={organizationId ?? ''}
        header={(name) => <AppHeader title={t('incoming.title')} subtitle={name} showBack />}
      />
    </SafeAreaScreen>
  );
}

/**
 * The incoming-orders list body (stats, search, filters, list) — also hosted
 * inside the Veterinary Office Dashboard's own tab shell ("الطلبات" tab).
 */
export function StoreIncomingOrdersContent({
  organizationId,
  header,
}: {
  organizationId: string;
  header: (organizationName: string | undefined) => ReactNode;
}) {
  const theme = useTheme();
  const { t } = useTranslation('organizationStore');
  const { isAdmin } = useCapabilities();
  const orgId = organizationId;
  useOrgStoreRealtime();

  const org = useOrganization(orgId);
  const caps = orgCapabilities(org.data?.myRole, isAdmin, org.data?.myPermissions);
  const allowed = Boolean(org.data) && caps.canViewStoreOrders;

  const [status, setStatus] = useState<OrgStoreOrderStatus | undefined>(undefined);
  const [newOnly, setNewOnly] = useState(false);
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const summary = useIncomingOrgStoreOrdersSummary(orgId, { enabled: allowed });
  const q = useIncomingOrgStoreOrders(
    orgId,
    { status, newOnly, search: search || undefined },
    { enabled: allowed },
  );

  if (org.isLoading) {
    return (
      <>
        {header(undefined)}
        <Loading fill />
      </>
    );
  }
  if (!allowed) {
    return (
      <>
        {header(undefined)}
        {org.error ? (
          <ErrorState error={org.error} onRetry={() => void org.refetch()} />
        ) : (
          <EmptyState icon="lock-closed-outline" title={t('incoming.readOnly')} />
        )}
      </>
    );
  }

  const stat = (label: string, value: number | undefined) => (
    <Card variant="flat" padding="md" style={{ flex: 1 }}>
      <Text variant="title" color="primary">
        {value ?? '–'}
      </Text>
      <Caption numberOfLines={1}>{label}</Caption>
    </Card>
  );

  return (
    <>
      {header(org.data?.name)}
      <View
        style={{
          paddingHorizontal: theme.screenPadding,
          rowGap: theme.spacing.sm,
          paddingBottom: theme.spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
          {stat(t('incoming.stats.pending'), summary.data?.pendingCount)}
          {stat(t('incoming.stats.active'), summary.data?.activeCount)}
          {stat(t('incoming.stats.delivered'), summary.data?.deliveredCount)}
        </View>
        <SearchInput
          value={rawSearch}
          onChangeText={setRawSearch}
          onClear={() => setRawSearch('')}
          placeholder={t('incoming.searchPlaceholder')}
          accessibilityLabel={t('incoming.searchPlaceholder')}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', columnGap: theme.spacing.xs }}>
            <Chip
              label={
                summary.data?.newCount
                  ? t('incoming.newCount', { count: summary.data.newCount })
                  : t('incoming.newOnly')
              }
              selected={newOnly}
              onPress={() => setNewOnly((v) => !v)}
            />
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
              side="SELLER"
              onPress={() => router.push(Routes.orgStoreIncomingOrder(orgId, item.id))}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title={t('incoming.empty')}
              message={t('incoming.emptyHint')}
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
              onRefresh={() => {
                void q.refetch();
                void summary.refetch();
              }}
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
    </>
  );
}
