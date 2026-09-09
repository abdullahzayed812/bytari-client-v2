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

import { petOwnerStoreService, petStoreKeys } from '../api';
import type { CheckoutInput, Paginated, PetStoreOrder, PetStoreOrderStatus } from '../types';

/** Place an order from the cart. On success the cart is emptied server-side. */
export function usePlacePetOwnerStoreOrder() {
  const qc = useQueryClient();
  return useMutation<PetStoreOrder, ApiError, CheckoutInput>({
    mutationKey: ['pet-owner-store', 'checkout'],
    mutationFn: (input) => petOwnerStoreService.placeOrder(input),
    onSuccess: (order) => {
      qc.setQueryData(petStoreKeys.order(order.id), order);
      void qc.invalidateQueries({ queryKey: petStoreKeys.cart() });
      void qc.invalidateQueries({ queryKey: petStoreKeys.orders() });
    },
  });
}

/** The shopper's own order history. */
export function usePetOwnerStoreOrders(status?: PetStoreOrderStatus) {
  const pageSize = AppConfig.defaultPageSize;
  const query = useInfiniteQuery<
    Paginated<PetStoreOrder>,
    unknown,
    InfiniteData<Paginated<PetStoreOrder>>,
    ReturnType<typeof petStoreKeys.orderList>,
    number
  >({
    queryKey: petStoreKeys.orderList(status),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      petOwnerStoreService.listOrders({ page: pageParam, pageSize, status }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    staleTime: 10_000,
  });

  const orders = useMemo<PetStoreOrder[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;
  return { ...query, orders, total };
}

export function usePetOwnerStoreOrder(orderId: string | undefined) {
  return useQuery<PetStoreOrder, ApiError>({
    queryKey: petStoreKeys.order(orderId ?? 'unknown'),
    queryFn: () => petOwnerStoreService.getOrder(orderId as string),
    enabled: Boolean(orderId),
  });
}
