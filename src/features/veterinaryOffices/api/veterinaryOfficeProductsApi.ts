import type { Paginated, Product, ProductListFilter } from '@/features/store';
import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

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
 * Public product-catalog browse — any authenticated user, not just members
 * (the Veterinary Offices product screens). `GET /organizations/discover/:id/*`
 * counterpart for products: the organization must be ACTIVE and product-capable
 * (VETERINARY_OFFICE / VETERINARY_STORE), and only ACTIVE products are
 * returned. Same `ProductDTO` shape as `@/features/store`'s management API —
 * a separate client because the visibility rule (and the URL) differs.
 */
export const veterinaryOfficeProductsApi = {
  async list(
    organizationId: string,
    filter: Omit<ProductListFilter, 'status'>,
  ): Promise<Paginated<Product>> {
    const envelope = await apiClient.requestEnvelope<Product[]>({
      method: 'GET',
      url: `/organizations/discover/${organizationId}/products`,
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

  get(organizationId: string, productId: string): Promise<Product> {
    return apiClient.get<Product>(
      `/organizations/discover/${organizationId}/products/${productId}`,
    );
  },
};

export type VeterinaryOfficeProductsApi = typeof veterinaryOfficeProductsApi;
