import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { veterinarianStoreService, vetStoreKeys } from '../api';
import type { CheckoutInput, Paginated, VetStoreOrder, VetStoreOrderStatus } from '../types';

/** Place an order from the cart. On success the cart is emptied server-side. */
export function usePlaceVeterinarianStoreOrder() {
  const qc = useQueryClient();
  return useMutation<VetStoreOrder, ApiError, CheckoutInput>({
    mutationKey: ['veterinarian-store', 'checkout'],
    mutationFn: (input) => veterinarianStoreService.placeOrder(input),
    onSuccess: (order) => {
      qc.setQueryData(vetStoreKeys.order(order.id), order);
      void qc.invalidateQueries({ queryKey: vetStoreKeys.cart() });
      void qc.invalidateQueries({ queryKey: vetStoreKeys.orders() });
    },
  });
}

/** The shopper's own order history. */
export function useVeterinarianStoreOrders(status?: VetStoreOrderStatus) {
  const pageSize = AppConfig.defaultPageSize;
  const query = useInfiniteQuery<
    Paginated<VetStoreOrder>,
    unknown,
    InfiniteData<Paginated<VetStoreOrder>>,
    ReturnType<typeof vetStoreKeys.orderList>,
    number
  >({
    queryKey: vetStoreKeys.orderList(status),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      veterinarianStoreService.listOrders({ page: pageParam, pageSize, status }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    staleTime: 10_000,
  });

  const orders = useMemo<VetStoreOrder[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;
  return { ...query, orders, total };
}

export function useVeterinarianStoreOrder(orderId: string | undefined) {
  return useQuery<VetStoreOrder, ApiError>({
    queryKey: vetStoreKeys.order(orderId ?? 'unknown'),
    queryFn: () => veterinarianStoreService.getOrder(orderId as string),
    enabled: Boolean(orderId),
  });
}
