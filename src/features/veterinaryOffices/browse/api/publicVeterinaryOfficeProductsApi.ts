import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type {
  OfficeProductSearchHit,
  Paginated,
  VeterinaryOfficeProduct,
  VeterinaryOfficeProductFacets,
  VeterinaryOfficeProductListFilter,
} from '../../types';

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
        brand: filter.brand || undefined,
        country: filter.country || undefined,
        sort: filter.sort,
        order: filter.order,
      },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, filter.page, filter.pageSize, envelope.data.length),
    };
  },

  /**
   * Search products across EVERY public veterinary office —
   * `GET /office-products/search`. Each hit says which office sells it.
   */
  async searchAll(filter: {
    page: number;
    pageSize: number;
    search?: string;
    productType?: VeterinaryOfficeProductListFilter['productType'];
    brand?: string;
    country?: string;
    sort?: 'name' | 'price' | 'createdAt';
    order?: 'asc' | 'desc';
  }): Promise<Paginated<OfficeProductSearchHit>> {
    const envelope = await apiClient.requestEnvelope<OfficeProductSearchHit[]>({
      method: 'GET',
      url: '/office-products/search',
      params: {
        page: filter.page,
        pageSize: filter.pageSize,
        search: filter.search || undefined,
        type: filter.productType,
        brand: filter.brand,
        country: filter.country,
        sort: filter.sort,
        order: filter.order,
      },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, filter.page, filter.pageSize, envelope.data.length),
    };
  },

  /** Distinct brands / countries across every public office (cross-office search filter). */
  facetsAll(): Promise<VeterinaryOfficeProductFacets> {
    return apiClient.get<VeterinaryOfficeProductFacets>('/office-products/facets');
  },

  /** Distinct brands / countries of the office's visible products (filter chips). */
  facets(organizationId: string): Promise<VeterinaryOfficeProductFacets> {
    return apiClient.get<VeterinaryOfficeProductFacets>(
      `/organizations/discover/${organizationId}/office-products/facets`,
    );
  },

  get(organizationId: string, productId: string): Promise<VeterinaryOfficeProduct> {
    return apiClient.get<VeterinaryOfficeProduct>(
      `/organizations/discover/${organizationId}/office-products/${productId}`,
    );
  },
};

export type PublicVeterinaryOfficeProductsApi = typeof publicVeterinaryOfficeProductsApi;
