import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/services/api';

import { organizationStoreService, orgStoreKeys } from '../api';
import type { OrgStoreCart, OrgStoreCartSummary } from '../types';

/** The shopper's cart for ONE clinic / office store. */
export function useOrgStoreCart(
  organizationId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<OrgStoreCart, ApiError>({
    queryKey: orgStoreKeys.cart(organizationId ?? 'unknown'),
    queryFn: () => organizationStoreService.getCart(organizationId as string),
    enabled: Boolean(organizationId) && (options.enabled ?? true),
    staleTime: 5_000,
  });
}

/** Every non-empty clinic / office cart of the shopper. */
export function useOrgStoreCarts(options: { enabled?: boolean } = {}) {
  return useQuery<OrgStoreCartSummary[], ApiError>({
    queryKey: orgStoreKeys.carts(),
    queryFn: () => organizationStoreService.listCarts(),
    enabled: options.enabled ?? true,
    staleTime: 5_000,
  });
}

/**
 * Cart mutations for one store. Each returns the recomputed cart, written
 * straight into the cache so the cart button badge + cart screen update.
 */
export function useOrgStoreCartMutations(organizationId: string) {
  const qc = useQueryClient();
  const write = (cart: OrgStoreCart): void => {
    qc.setQueryData(orgStoreKeys.cart(organizationId), cart);
    void qc.invalidateQueries({ queryKey: orgStoreKeys.carts() });
  };

  const addItem = useMutation<OrgStoreCart, ApiError, { productId: string; quantity: number }>({
    mutationFn: ({ productId, quantity }) =>
      organizationStoreService.addCartItem(organizationId, productId, quantity),
    onSuccess: write,
  });
  const updateItem = useMutation<OrgStoreCart, ApiError, { itemId: string; quantity: number }>({
    mutationFn: ({ itemId, quantity }) =>
      organizationStoreService.updateCartItem(organizationId, itemId, quantity),
    onSuccess: write,
  });
  const removeItem = useMutation<OrgStoreCart, ApiError, string>({
    mutationFn: (itemId) => organizationStoreService.removeCartItem(organizationId, itemId),
    onSuccess: write,
  });
  const clear = useMutation<OrgStoreCart, ApiError, void>({
    mutationFn: () => organizationStoreService.clearCart(organizationId),
    onSuccess: write,
  });
  return { addItem, updateItem, removeItem, clear };
}
