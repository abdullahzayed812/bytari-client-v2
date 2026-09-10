import type { VeterinaryOfficeProductListFilter } from '../types';

/**
 * Public product-catalog query keys, scoped by organization so two offices
 * never share a cache entry. Separate key space from `veterinaryOfficeProductKeys`
 * (management, in `./queryKeys`) — the two surfaces have different visibility
 * rules and must never share a cache entry.
 *
 *   publicVeterinaryOfficeProductKeys.forOffice(officeId)          → ['public-office-products', officeId]
 *   publicVeterinaryOfficeProductKeys.list(officeId, filter)       → [...forOffice, 'list', filter]
 *   publicVeterinaryOfficeProductKeys.detail(officeId, productId)  → [...forOffice, 'detail', productId]
 */
export const publicVeterinaryOfficeProductKeys = {
  all: ['public-office-products'] as const,
  forOffice: (organizationId: string) =>
    [...publicVeterinaryOfficeProductKeys.all, organizationId] as const,
  list: (organizationId: string, filter: Omit<VeterinaryOfficeProductListFilter, 'page' | 'status'>) =>
    [...publicVeterinaryOfficeProductKeys.forOffice(organizationId), 'list', filter] as const,
  detail: (organizationId: string, productId: string) =>
    [...publicVeterinaryOfficeProductKeys.forOffice(organizationId), 'detail', productId] as const,
};
