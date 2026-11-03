import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';
import { realtimeClient } from '@/services/realtime';

import { organizationStoreService, orgStoreKeys } from '../api';
import type {
  OrgStoreCheckoutInput,
  OrgStoreOrder,
  OrgStoreOrdersSummary,
  OrgStoreOrderStatus,
  Paginated,
} from '../types';

// --- customer -------------------------------------------------------

/** Checkout one store's cart. On success the cart is emptied server-side. */
export function usePlaceOrgStoreOrder(organizationId: string) {
  const qc = useQueryClient();
  return useMutation<OrgStoreOrder, ApiError, OrgStoreCheckoutInput>({
    mutationFn: (input) => organizationStoreService.placeOrder(organizationId, input),
    onSuccess: (order) => {
      qc.setQueryData(orgStoreKeys.myOrder(order.id), order);
      void qc.invalidateQueries({ queryKey: orgStoreKeys.cart(organizationId) });
      void qc.invalidateQueries({ queryKey: orgStoreKeys.carts() });
      void qc.invalidateQueries({ queryKey: orgStoreKeys.myOrders() });
    },
  });
}

/** The shopper's clinic / office orders (all stores, or one). */
export function useMyOrgStoreOrders(
  filter: { status?: OrgStoreOrderStatus; organizationId?: string } = {},
) {
  const pageSize = AppConfig.defaultPageSize;
  const query = useInfiniteQuery<
    Paginated<OrgStoreOrder>,
    ApiError,
    InfiniteData<Paginated<OrgStoreOrder>>,
    ReturnType<typeof orgStoreKeys.myOrderList>,
    number
  >({
    queryKey: orgStoreKeys.myOrderList(filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      organizationStoreService.listMyOrders({ page: pageParam, pageSize, ...filter }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    staleTime: 10_000,
  });
  const orders = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  return { ...query, orders, total: query.data?.pages[0]?.meta.total ?? 0 };
}

export function useMyOrgStoreOrder(orderId: string | undefined) {
  return useQuery<OrgStoreOrder, ApiError>({
    queryKey: orgStoreKeys.myOrder(orderId ?? 'unknown'),
    queryFn: () => organizationStoreService.getMyOrder(orderId as string),
    enabled: Boolean(orderId),
  });
}

export function useCancelMyOrgStoreOrder() {
  const qc = useQueryClient();
  return useMutation<OrgStoreOrder, ApiError, { orderId: string; note?: string | null }>({
    mutationFn: ({ orderId, note }) => organizationStoreService.cancelMyOrder(orderId, note),
    onSuccess: (order) => {
      qc.setQueryData(orgStoreKeys.myOrder(order.id), order);
      void qc.invalidateQueries({ queryKey: orgStoreKeys.myOrders() });
    },
  });
}

// --- seller ---------------------------------------------------------

export function useIncomingOrgStoreOrders(
  organizationId: string,
  filter: { status?: OrgStoreOrderStatus; newOnly?: boolean; search?: string } = {},
  options: { enabled?: boolean } = {},
) {
  const pageSize = AppConfig.defaultPageSize;
  const query = useInfiniteQuery<
    Paginated<OrgStoreOrder>,
    ApiError,
    InfiniteData<Paginated<OrgStoreOrder>>,
    ReturnType<typeof orgStoreKeys.sellerOrders>,
    number
  >({
    queryKey: orgStoreKeys.sellerOrders(organizationId, filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      organizationStoreService.listIncomingOrders(organizationId, {
        page: pageParam,
        pageSize,
        ...filter,
      }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: Boolean(organizationId) && (options.enabled ?? true),
    staleTime: 10_000,
  });
  const orders = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  return { ...query, orders, total: query.data?.pages[0]?.meta.total ?? 0 };
}

/** Counters for the dashboards' "الطلبات الواردة" tile. Only enable with `store.order.read`. */
export function useIncomingOrgStoreOrdersSummary(
  organizationId: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery<OrgStoreOrdersSummary, ApiError>({
    queryKey: orgStoreKeys.sellerSummary(organizationId),
    queryFn: () => organizationStoreService.incomingOrdersSummary(organizationId),
    enabled: Boolean(organizationId) && (options.enabled ?? true),
    staleTime: 15_000,
  });
}

export function useIncomingOrgStoreOrder(organizationId: string, orderId: string | undefined) {
  const qc = useQueryClient();
  return useQuery<OrgStoreOrder, ApiError>({
    queryKey: orgStoreKeys.sellerOrder(organizationId, orderId ?? 'unknown'),
    queryFn: async () => {
      const order = await organizationStoreService.getIncomingOrder(
        organizationId,
        orderId as string,
      );
      // Opening it cleared the "new" flag server-side.
      void qc.invalidateQueries({ queryKey: orgStoreKeys.sellerSummary(organizationId) });
      return order;
    },
    enabled: Boolean(organizationId && orderId),
  });
}

export function useUpdateIncomingOrgStoreOrderStatus(organizationId: string) {
  const qc = useQueryClient();
  return useMutation<
    OrgStoreOrder,
    ApiError,
    { orderId: string; status: OrgStoreOrderStatus; note?: string | null }
  >({
    mutationFn: ({ orderId, status, note }) =>
      organizationStoreService.updateIncomingOrderStatus(organizationId, orderId, status, note),
    onSuccess: (order) => {
      qc.setQueryData(orgStoreKeys.sellerOrder(organizationId, order.id), order);
      void qc.invalidateQueries({ queryKey: orgStoreKeys.seller(organizationId) });
    },
  });
}

// --- realtime -------------------------------------------------------

/**
 * Live refresh over the EXISTING realtime transport: every store-order
 * notification (`STORE_ORDER_*`) that reaches this user invalidates the store
 * caches, so an open incoming-orders list / tracking screen updates as soon as
 * a customer orders or the store changes a status. Mount on store screens.
 */
export function useOrgStoreRealtime(): void {
  const qc = useQueryClient();
  useEffect(() => {
    const sub = realtimeClient.on('notification.created', (event) => {
      const type = (event.data as { type?: unknown } | null)?.type;
      if (typeof type === 'string' && type.startsWith('STORE_ORDER_')) {
        void qc.invalidateQueries({ queryKey: orgStoreKeys.all });
      }
    });
    return () => sub.unsubscribe();
  }, [qc]);
}
