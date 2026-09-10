import type { ProductListFilter } from '@/features/store';

/**
 * Public product-catalog query keys, scoped by organization so two offices
 * never share a cache entry. Separate key space from `@/features/store`'s
 * `productKeys` (management) even though the DTO is identical — the two
 * surfaces have different visibility rules and must never share a cache entry.
 *
 *   veterinaryOfficeProductKeys.forOffice(officeId)          → ['veterinary-office-products', officeId]
 *   veterinaryOfficeProductKeys.list(officeId, filter)       → [...forOffice, 'list', filter]
 *   veterinaryOfficeProductKeys.detail(officeId, productId)  → [...forOffice, 'detail', productId]
 */
export const veterinaryOfficeProductKeys = {
  all: ['veterinary-office-products'] as const,
  forOffice: (organizationId: string) =>
    [...veterinaryOfficeProductKeys.all, organizationId] as const,
  list: (organizationId: string, filter: Omit<ProductListFilter, 'page' | 'status'>) =>
    [...veterinaryOfficeProductKeys.forOffice(organizationId), 'list', filter] as const,
  detail: (organizationId: string, productId: string) =>
    [...veterinaryOfficeProductKeys.forOffice(organizationId), 'detail', productId] as const,
};
