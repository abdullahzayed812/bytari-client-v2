import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type {
  AdjustStockInput,
  CreateProductInput,
  Paginated,
  Product,
  ProductListFilter,
  UpdateProductInput,
} from '../types';

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
 * Veterinary-store product wrappers — 1:1 with the backend routes, always
 * scoped to one VETERINARY_STORE organization by the path.
 * `organizationId` / `createdByUserId` / `status` (after create) are set by the
 * server, never in a body. `stockQuantity` changes only through `adjustStock`.
 *
 *   GET/POST         /organizations/:orgId/products          (`product.read` / `.create`)
 *   GET/PATCH/DELETE  /organizations/:orgId/products/:id      (`product.read` / `.update` / `.delete`)
 *   POST             /organizations/:orgId/products/:id/stock (`product.inventory.adjust`)
 */
export const productsApi = {
  async list(organizationId: string, filter: ProductListFilter): Promise<Paginated<Product>> {
    const envelope = await apiClient.requestEnvelope<Product[]>({
      method: 'GET',
      url: `/organizations/${organizationId}/products`,
      params: {
        page: filter.page,
        pageSize: filter.pageSize,
        status: filter.status,
        // The backend query param is `type`, the DTO field is `productType`.
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
    return apiClient.get<Product>(`/organizations/${organizationId}/products/${productId}`);
  },

  create(organizationId: string, body: CreateProductInput): Promise<Product> {
    return apiClient.post<Product>(`/organizations/${organizationId}/products`, body);
  },

  update(organizationId: string, productId: string, body: UpdateProductInput): Promise<Product> {
    return apiClient.patch<Product>(`/organizations/${organizationId}/products/${productId}`, body);
  },

  /** Soft-delete: sets `status = INACTIVE`. Idempotent. Returns the product. */
  remove(organizationId: string, productId: string): Promise<Product> {
    return apiClient.delete<Product>(`/organizations/${organizationId}/products/${productId}`);
  },

  adjustStock(organizationId: string, productId: string, body: AdjustStockInput): Promise<Product> {
    return apiClient.post<Product>(
      `/organizations/${organizationId}/products/${productId}/stock`,
      body,
    );
  },
};

export type ProductsApi = typeof productsApi;
