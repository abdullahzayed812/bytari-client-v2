import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';
import type { PresignedUpload } from '@/services/files/types';

import type {
  AdjustVeterinaryOfficeStockInput,
  CreateVeterinaryOfficeProductInput,
  Paginated,
  VeterinaryOfficeProduct,
  VeterinaryOfficeProductListFilter,
  UpdateVeterinaryOfficeProductInput,
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
 * Veterinary Office product management wrappers — 1:1 with the backend
 * routes, always scoped to one VETERINARY_OFFICE organization by the path.
 * This is its own catalog, fully separate from Veterinary Store products
 * (`@/features/veterinaryStore`) and the public browse client
 * (`publicVeterinaryOfficeProductsApi`) — own table, own routes server-side.
 * `organizationId` / `createdByUserId` / `status` (after create) are set by
 * the server, never in a body. `stockQuantity` changes only through
 * `adjustStock`.
 *
 *   GET/POST         /organizations/:orgId/office-products          (`product.read` / `.create`)
 *   GET/PATCH/DELETE  /organizations/:orgId/office-products/:id      (`product.read` / `.update` / `.delete`)
 *   POST             /organizations/:orgId/office-products/:id/stock (`product.inventory.adjust`)
 */
export const veterinaryOfficeProductsApi = {
  async list(
    organizationId: string,
    filter: VeterinaryOfficeProductListFilter,
  ): Promise<Paginated<VeterinaryOfficeProduct>> {
    const envelope = await apiClient.requestEnvelope<VeterinaryOfficeProduct[]>({
      method: 'GET',
      url: `/organizations/${organizationId}/office-products`,
      params: {
        page: filter.page,
        pageSize: filter.pageSize,
        status: filter.status,
        // The backend query param is `type`, the DTO field is `productType`.
        type: filter.productType,
        hidden: filter.hidden,
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
      `/organizations/${organizationId}/office-products/${productId}`,
    );
  },

  create(
    organizationId: string,
    body: CreateVeterinaryOfficeProductInput,
  ): Promise<VeterinaryOfficeProduct> {
    return apiClient.post<VeterinaryOfficeProduct>(
      `/organizations/${organizationId}/office-products`,
      body,
    );
  },

  update(
    organizationId: string,
    productId: string,
    body: UpdateVeterinaryOfficeProductInput,
  ): Promise<VeterinaryOfficeProduct> {
    return apiClient.patch<VeterinaryOfficeProduct>(
      `/organizations/${organizationId}/office-products/${productId}`,
      body,
    );
  },

  /** Soft-delete: sets `status = INACTIVE`. Idempotent. Returns the product. */
  remove(organizationId: string, productId: string): Promise<VeterinaryOfficeProduct> {
    return apiClient.delete<VeterinaryOfficeProduct>(
      `/organizations/${organizationId}/office-products/${productId}`,
    );
  },

  adjustStock(
    organizationId: string,
    productId: string,
    body: AdjustVeterinaryOfficeStockInput,
  ): Promise<VeterinaryOfficeProduct> {
    return apiClient.post<VeterinaryOfficeProduct>(
      `/organizations/${organizationId}/office-products/${productId}/stock`,
      body,
    );
  },

  // --- images (presigned direct-to-R2, mirrors the organization gallery /
  // Pet Owners Store product-image seam) — max 6 images, first → primary. ---

  requestImageUploadUrl(
    organizationId: string,
    productId: string,
    input: { filename: string; mimeType: string; size: number },
  ): Promise<PresignedUpload> {
    return apiClient.post<PresignedUpload>(
      `/organizations/${organizationId}/office-products/${productId}/images/upload-url`,
      input,
    );
  },

  addImage(
    organizationId: string,
    productId: string,
    input: { storageKey: string; mimeType: string },
  ): Promise<VeterinaryOfficeProduct> {
    return apiClient.post<VeterinaryOfficeProduct>(
      `/organizations/${organizationId}/office-products/${productId}/images`,
      input,
    );
  },

  removeImage(
    organizationId: string,
    productId: string,
    imageId: string,
  ): Promise<VeterinaryOfficeProduct> {
    return apiClient.delete<VeterinaryOfficeProduct>(
      `/organizations/${organizationId}/office-products/${productId}/images/${imageId}`,
    );
  },
};

export type VeterinaryOfficeProductsApi = typeof veterinaryOfficeProductsApi;
