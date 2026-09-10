import type { VeterinaryOfficeProductListFilter } from '../types';

/**
 * Veterinary Office product management query keys. Everything is
 * organization-scoped so one prefix invalidates an office's whole catalogue,
 * and two different offices can never overwrite each other's cache entries.
 * Separate key space from `publicVeterinaryOfficeProductKeys` (public browse,
 * in `./publicQueryKeys`).
 *
 *   veterinaryOfficeProductKeys.forOrg(orgId)             → ['office-products', orgId]
 *   veterinaryOfficeProductKeys.list(orgId, filter)       → ['office-products', orgId, 'list', { …filter }]
 *   veterinaryOfficeProductKeys.detail(orgId, productId)  → ['office-products', orgId, 'detail', productId]
 */
export const veterinaryOfficeProductKeys = {
  all: ['office-products'] as const,
  forOrg: (organizationId: string) => [...veterinaryOfficeProductKeys.all, organizationId] as const,
  list: (organizationId: string, filter: Omit<VeterinaryOfficeProductListFilter, 'page'>) =>
    [...veterinaryOfficeProductKeys.forOrg(organizationId), 'list', filter] as const,
  detail: (organizationId: string, productId: string) =>
    [...veterinaryOfficeProductKeys.forOrg(organizationId), 'detail', productId] as const,
};
