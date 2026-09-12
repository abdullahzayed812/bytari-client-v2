import { useMemo } from 'react';

import { useVeterinarianStoreCart } from './useVeterinarianStoreCart';

export interface VeterinarianStoreSummary {
  /** Total units across all cart lines — drives the store header badge. */
  itemCount: number;
  subtotalAmount: string;
  currency: string;
  isLoading: boolean;
}

/**
 * Small facade over the cart query for anything that only needs the summary
 * (the store header cart badge, the checkout CTA). Backed by the React Query
 * cache — no separate global store.
 */
export function useVeterinarianStore(): VeterinarianStoreSummary {
  const cart = useVeterinarianStoreCart();
  return useMemo(
    () => ({
      itemCount: cart.data?.itemCount ?? 0,
      subtotalAmount: cart.data?.subtotalAmount ?? '0.00',
      currency: cart.data?.currency ?? 'SAR',
      isLoading: cart.isLoading,
    }),
    [cart.data, cart.isLoading],
  );
}
