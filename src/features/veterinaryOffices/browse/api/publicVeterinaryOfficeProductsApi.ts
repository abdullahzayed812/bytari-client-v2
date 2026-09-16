import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type { Paginated, VeterinaryOfficeProduct, VeterinaryOfficeProductListFilter } from '../../types';

function readMeta(meta: unknown, page: number, pageSize: number, count: number): ApiPageMeta {
  const m = (meta ?? {}) as Partial<ApiPageMeta>;
  return {
    page: m.page ?? page,
    pageSize: m.pageSize ?? pageSize,
    total: m.total ?? count,
    totalPages: m.totalPages ?? 1,
  };
}

/**
 * Public product-catalog browse — any authenticated user, not just members.
 * `GET /organizations/discover/:id/office-products*` — the organization must
 * be ACTIVE and VETERINARY_OFFICE, and only ACTIVE products are returned.
 * Separate client from the management API (`veterinaryOfficeProductsApi`)
 * because the visibility rule (and the URL) differs.
 */
export const publicVeterinaryOfficeProductsApi = {
  async list(
    organizationId: string,
    filter: Omit<VeterinaryOfficeProductListFilter, 'status'>,
  ): Promise<Paginated<VeterinaryOfficeProduct>> {
    const envelope = await apiClient.requestEnvelope<VeterinaryOfficeProduct[]>({
      method: 'GET',
      url: `/organizations/discover/${organizationId}/office-products`,
      params: {
        page: filter.page,
        pageSize: filter.pageSize,
        type: filter.productType,
        search: filter.search || undefined,
        sort: filter.sort,
        order: filter.order,
      },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, filter.page, filter.pageSize, envelope.data.length),
    };
  },

  get(organizationId: string, productId: string): Promise<VeterinaryOfficeProduct> {
    return apiClient.get<VeterinaryOfficeProduct>(
      `/organizations/discover/${organizationId}/office-products/${productId}`,
    );
  },
};

export type PublicVeterinaryOfficeProductsApi = typeof publicVeterinaryOfficeProductsApi;
