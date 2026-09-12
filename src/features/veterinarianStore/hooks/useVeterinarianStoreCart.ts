import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { veterinarianStoreService, vetStoreKeys } from '../api';
import type { VetStoreCart } from '../types';

/** The signed-in shopper's cart (created server-side on first read). */
export function useVeterinarianStoreCart(options: { enabled?: boolean } = {}) {
  return useQuery<VetStoreCart>({
    queryKey: vetStoreKeys.cart(),
    queryFn: () => veterinarianStoreService.getCart(),
    staleTime: 5_000,
    enabled: options.enabled ?? true,
  });
}

/**
 * Cart mutations. Each returns the full recomputed cart, which we write straight
 * into the cache so the header badge + cart screen update without a refetch.
 */
export function useVeterinarianStoreCartMutations() {
  const qc = useQueryClient();
  const write = (cart: VetStoreCart): void => {
    qc.setQueryData(vetStoreKeys.cart(), cart);
  };

  const addItem = useMutation({
    mutationKey: ['veterinarian-store', 'cart', 'add'],
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      veterinarianStoreService.addCartItem(productId, quantity),
    onSuccess: write,
  });

  const updateItem = useMutation({
    mutationKey: ['veterinarian-store', 'cart', 'update'],
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      veterinarianStoreService.updateCartItem(itemId, quantity),
    onSuccess: write,
  });

  const removeItem = useMutation({
    mutationKey: ['veterinarian-store', 'cart', 'remove'],
    mutationFn: (itemId: string) => veterinarianStoreService.removeCartItem(itemId),
    onSuccess: write,
  });

  const clear = useMutation({
    mutationKey: ['veterinarian-store', 'cart', 'clear'],
    mutationFn: () => veterinarianStoreService.clearCart(),
    onSuccess: write,
  });

  return { addItem, updateItem, removeItem, clear };
}
