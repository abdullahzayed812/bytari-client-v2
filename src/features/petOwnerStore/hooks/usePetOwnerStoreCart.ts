import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { petOwnerStoreService, petStoreKeys } from '../api';
import type { PetStoreCart } from '../types';

/** The signed-in shopper's cart (created server-side on first read). */
export function usePetOwnerStoreCart(options: { enabled?: boolean } = {}) {
  return useQuery<PetStoreCart>({
    queryKey: petStoreKeys.cart(),
    queryFn: () => petOwnerStoreService.getCart(),
    staleTime: 5_000,
    enabled: options.enabled ?? true,
  });
}

/**
 * Cart mutations. Each returns the full recomputed cart, which we write straight
 * into the cache so the header badge + cart screen update without a refetch.
 */
export function usePetOwnerStoreCartMutations() {
  const qc = useQueryClient();
  const write = (cart: PetStoreCart): void => {
    qc.setQueryData(petStoreKeys.cart(), cart);
  };

  const addItem = useMutation({
    mutationKey: ['pet-owner-store', 'cart', 'add'],
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      petOwnerStoreService.addCartItem(productId, quantity),
    onSuccess: write,
  });

  const updateItem = useMutation({
    mutationKey: ['pet-owner-store', 'cart', 'update'],
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      petOwnerStoreService.updateCartItem(itemId, quantity),
    onSuccess: write,
  });

  const removeItem = useMutation({
    mutationKey: ['pet-owner-store', 'cart', 'remove'],
    mutationFn: (itemId: string) => petOwnerStoreService.removeCartItem(itemId),
    onSuccess: write,
  });

  const clear = useMutation({
    mutationKey: ['pet-owner-store', 'cart', 'clear'],
    mutationFn: () => petOwnerStoreService.clearCart(),
    onSuccess: write,
  });

  return { addItem, updateItem, removeItem, clear };
}
