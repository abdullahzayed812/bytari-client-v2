import type { VeterinaryStoreProductListFilter } from '../types';

/**
 * Veterinary-store product query keys (§31/§32). Everything is
 * organization-scoped so one prefix invalidates a store's whole catalogue, and
 * two different stores can never overwrite each other's cache entries.
 *
 *   veterinaryStoreProductKeys.forOrg(orgId)             → ['store-products', orgId]
 *   veterinaryStoreProductKeys.list(orgId, filter)       → ['store-products', orgId, 'list', { …filter }]
 *   veterinaryStoreProductKeys.detail(orgId, productId)  → ['store-products', orgId, 'detail', productId]
 */
export const veterinaryStoreProductKeys = {
  all: ['store-products'] as const,
  forOrg: (organizationId: string) => [...veterinaryStoreProductKeys.all, organizationId] as const,
  list: (organizationId: string, filter: Omit<VeterinaryStoreProductListFilter, 'page'>) =>
    [...veterinaryStoreProductKeys.forOrg(organizationId), 'list', filter] as const,
  detail: (organizationId: string, productId: string) =>
    [...veterinaryStoreProductKeys.forOrg(organizationId), 'detail', productId] as const,
};
