import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';
import type { PresignedUpload } from '@/services/files/types';

import type {
  CreateVetStoreCategoryInput,
  CreateVetStoreProductInput,
  ListVetStoreProductsParams,
  Paginated,
  VetStoreAdminProduct,
  VetStoreCategory,
  VetStoreOrder,
  VetStoreOrderStatus,
  UpdateVetStoreCategoryInput,
  UpdateVetStoreProductInput,
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
 * Admin / supervisor Veterinarian Store management — `/admin/veterinarian-store/*`.
 * Every route is server-gated by `veterinarian_store.*` (ADMIN or a
 * VETERINARIAN_STORE system-supervisor). Product / category images use the
 * shared presigned-R2 flow; storage secrets never reach the app.
 */
export const veterinarianStoreAdminService = {
  // --- products ---------------------------------------------
  async listProducts(
    params: ListVetStoreProductsParams & { page: number; pageSize: number },
  ): Promise<Paginated<VetStoreAdminProduct>> {
    const envelope = await apiClient.requestEnvelope<VetStoreAdminProduct[]>({
      method: 'GET',
      url: '/admin/veterinarian-store/products',
      params: {
        page: params.page,
        pageSize: params.pageSize,
        categoryId: params.categoryId || undefined,
        search: params.search || undefined,
        sort: params.sort,
        order: params.order,
        status: params.status,
      },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, params.page, params.pageSize, envelope.data.length),
    };
  },

  getProduct(productId: string): Promise<VetStoreAdminProduct> {
    return apiClient.get<VetStoreAdminProduct>(`/admin/veterinarian-store/products/${productId}`);
  },

  createProduct(body: CreateVetStoreProductInput): Promise<VetStoreAdminProduct> {
    return apiClient.post<VetStoreAdminProduct>('/admin/veterinarian-store/products', body);
  },

  updateProduct(
    productId: string,
    body: UpdateVetStoreProductInput,
  ): Promise<VetStoreAdminProduct> {
    return apiClient.patch<VetStoreAdminProduct>(
      `/admin/veterinarian-store/products/${productId}`,
      body,
    );
  },

  deactivateProduct(productId: string): Promise<VetStoreAdminProduct> {
    return apiClient.delete<VetStoreAdminProduct>(`/admin/veterinarian-store/products/${productId}`);
  },

  requestProductImageUploadUrl(
    productId: string,
    input: { filename: string; mimeType: string; size: number },
  ): Promise<PresignedUpload> {
    return apiClient.post<PresignedUpload>(
      `/admin/veterinarian-store/products/${productId}/image/upload-url`,
      input,
    );
  },

  registerProductImage(
    productId: string,
    input: { storageKey: string; mimeType: string },
  ): Promise<VetStoreAdminProduct> {
    return apiClient.post<VetStoreAdminProduct>(
      `/admin/veterinarian-store/products/${productId}/images`,
      input,
    );
  },

  removeProductImage(productId: string, imageId: string): Promise<VetStoreAdminProduct> {
    return apiClient.delete<VetStoreAdminProduct>(
      `/admin/veterinarian-store/products/${productId}/images/${imageId}`,
    );
  },

  // --- categories -----------------------------------------
  listCategories(): Promise<VetStoreCategory[]> {
    return apiClient.get<VetStoreCategory[]>('/admin/veterinarian-store/categories');
  },

  createCategory(body: CreateVetStoreCategoryInput): Promise<VetStoreCategory> {
    return apiClient.post<VetStoreCategory>('/admin/veterinarian-store/categories', body);
  },

  updateCategory(categoryId: string, body: UpdateVetStoreCategoryInput): Promise<VetStoreCategory> {
    return apiClient.patch<VetStoreCategory>(
      `/admin/veterinarian-store/categories/${categoryId}`,
      body,
    );
  },

  deleteCategory(categoryId: string): Promise<void> {
    return apiClient.delete<void>(`/admin/veterinarian-store/categories/${categoryId}`);
  },

  requestCategoryImageUploadUrl(
    categoryId: string,
    input: { filename: string; mimeType: string; size: number },
  ): Promise<PresignedUpload> {
    return apiClient.post<PresignedUpload>(
      `/admin/veterinarian-store/categories/${categoryId}/image/upload-url`,
      input,
    );
  },

  registerCategoryImage(
    categoryId: string,
    input: { storageKey: string; mimeType: string },
  ): Promise<VetStoreCategory> {
    return apiClient.post<VetStoreCategory>(
      `/admin/veterinarian-store/categories/${categoryId}/image`,
      input,
    );
  },

  // --- orders --------------------------------------------
  async listOrders(params: {
    page: number;
    pageSize: number;
    status?: VetStoreOrderStatus;
  }): Promise<Paginated<VetStoreOrder>> {
    const envelope = await apiClient.requestEnvelope<VetStoreOrder[]>({
      method: 'GET',
      url: '/admin/veterinarian-store/orders',
      params: { page: params.page, pageSize: params.pageSize, status: params.status },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, params.page, params.pageSize, envelope.data.length),
    };
  },

  getOrder(orderId: string): Promise<VetStoreOrder> {
    return apiClient.get<VetStoreOrder>(`/admin/veterinarian-store/orders/${orderId}`);
  },

  updateOrderStatus(orderId: string, status: VetStoreOrderStatus): Promise<VetStoreOrder> {
    return apiClient.patch<VetStoreOrder>(`/admin/veterinarian-store/orders/${orderId}/status`, {
      status,
    });
  },
};

export type VeterinarianStoreAdminService = typeof veterinarianStoreAdminService;
