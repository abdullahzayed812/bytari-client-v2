import type { ProductListFilter } from '../types';

/**
 * Veterinary-store product query keys (§31/§32). Everything is
 * organization-scoped so one prefix invalidates a store's whole catalogue, and
 * two different stores can never overwrite each other's cache entries.
 *
 *   productKeys.forOrg(orgId)             → ['store-products', orgId]
 *   productKeys.list(orgId, filter)       → ['store-products', orgId, 'list', { …filter }]
 *   productKeys.detail(orgId, productId)  → ['store-products', orgId, 'detail', productId]
 */
export const productKeys = {
  all: ['store-products'] as const,
  forOrg: (organizationId: string) => [...productKeys.all, organizationId] as const,
  list: (organizationId: string, filter: Omit<ProductListFilter, 'page'>) =>
    [...productKeys.forOrg(organizationId), 'list', filter] as const,
  detail: (organizationId: string, productId: string) =>
    [...productKeys.forOrg(organizationId), 'detail', productId] as const,
};
