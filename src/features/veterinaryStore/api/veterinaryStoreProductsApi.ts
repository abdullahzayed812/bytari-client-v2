import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';
import type { PresignedUpload } from '@/services/files/types';

import type {
  AdjustVeterinaryStoreStockInput,
  CreateVeterinaryStoreProductInput,
  Paginated,
  VeterinaryStoreProduct,
  VeterinaryStoreProductListFilter,
  UpdateVeterinaryStoreProductInput,
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
 * Veterinary Store product wrappers — 1:1 with the backend routes, always
 * scoped to one VETERINARY_STORE organization by the path. This is its own
 * catalog, fully separate from Veterinary Office products
 * (`@/features/veterinaryOffices`) and Pet Owner Store products
 * (`@/features/petOwnerStore`) — own table, own routes, own DTO server-side.
 * `organizationId` / `createdByUserId` / `status` (after create) are set by the
 * server, never in a body. `stockQuantity` changes only through `adjustStock`.
 *
 *   GET/POST         /organizations/:orgId/store-products          (`product.read` / `.create`)
 *   GET/PATCH/DELETE  /organizations/:orgId/store-products/:id      (`product.read` / `.update` / `.delete`)
 *   POST             /organizations/:orgId/store-products/:id/stock (`product.inventory.adjust`)
 */
export const veterinaryStoreProductsApi = {
  async list(organizationId: string, filter: VeterinaryStoreProductListFilter): Promise<Paginated<VeterinaryStoreProduct>> {
    const envelope = await apiClient.requestEnvelope<VeterinaryStoreProduct[]>({
      method: 'GET',
      url: `/organizations/${organizationId}/store-products`,
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

  get(organizationId: string, productId: string): Promise<VeterinaryStoreProduct> {
    return apiClient.get<VeterinaryStoreProduct>(`/organizations/${organizationId}/store-products/${productId}`);
  },

  create(organizationId: string, body: CreateVeterinaryStoreProductInput): Promise<VeterinaryStoreProduct> {
    return apiClient.post<VeterinaryStoreProduct>(`/organizations/${organizationId}/store-products`, body);
  },

  update(organizationId: string, productId: string, body: UpdateVeterinaryStoreProductInput): Promise<VeterinaryStoreProduct> {
    return apiClient.patch<VeterinaryStoreProduct>(`/organizations/${organizationId}/store-products/${productId}`, body);
  },

  /** Soft-delete: sets `status = INACTIVE`. Idempotent. Returns the product. */
  remove(organizationId: string, productId: string): Promise<VeterinaryStoreProduct> {
    return apiClient.delete<VeterinaryStoreProduct>(`/organizations/${organizationId}/store-products/${productId}`);
  },

  adjustStock(organizationId: string, productId: string, body: AdjustVeterinaryStoreStockInput): Promise<VeterinaryStoreProduct> {
    return apiClient.post<VeterinaryStoreProduct>(
      `/organizations/${organizationId}/store-products/${productId}/stock`,
      body,
    );
  },

  requestImageUploadUrl(
    organizationId: string,
    productId: string,
    input: { filename: string; mimeType: string; size: number },
  ): Promise<PresignedUpload> {
    return apiClient.post<PresignedUpload>(
      `/organizations/${organizationId}/store-products/${productId}/images/upload-url`,
      input,
    );
  },

  addImage(
    organizationId: string,
    productId: string,
    input: { storageKey: string; mimeType: string },
  ): Promise<VeterinaryStoreProduct> {
    return apiClient.post<VeterinaryStoreProduct>(
      `/organizations/${organizationId}/store-products/${productId}/images`,
      input,
    );
  },

  removeImage(organizationId: string, productId: string, imageId: string): Promise<VeterinaryStoreProduct> {
    return apiClient.delete<VeterinaryStoreProduct>(
      `/organizations/${organizationId}/store-products/${productId}/images/${imageId}`,
    );
  },
};

export type VeterinaryStoreProductsApi = typeof veterinaryStoreProductsApi;
