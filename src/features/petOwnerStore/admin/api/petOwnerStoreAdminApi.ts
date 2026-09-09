import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';
import type { PresignedUpload } from '@/services/files/types';

import type {
  CreatePetStoreCategoryInput,
  CreatePetStoreProductInput,
  ListPetStoreProductsParams,
  Paginated,
  PetStoreAdminProduct,
  PetStoreCategory,
  PetStoreOrder,
  PetStoreOrderStatus,
  UpdatePetStoreCategoryInput,
  UpdatePetStoreProductInput,
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
 * Admin / supervisor Pet Owners Store management — `/admin/pet-owner-store/*`.
 * Every route is server-gated by `pet_store.*` (ADMIN or a PET_OWNER_STORE
 * system-supervisor). Product / category images use the shared presigned-R2
 * flow; storage secrets never reach the app.
 */
export const petOwnerStoreAdminService = {
  // --- products ---------------------------------------------
  async listProducts(
    params: ListPetStoreProductsParams & { page: number; pageSize: number },
  ): Promise<Paginated<PetStoreAdminProduct>> {
    const envelope = await apiClient.requestEnvelope<PetStoreAdminProduct[]>({
      method: 'GET',
      url: '/admin/pet-owner-store/products',
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

  getProduct(productId: string): Promise<PetStoreAdminProduct> {
    return apiClient.get<PetStoreAdminProduct>(`/admin/pet-owner-store/products/${productId}`);
  },

  createProduct(body: CreatePetStoreProductInput): Promise<PetStoreAdminProduct> {
    return apiClient.post<PetStoreAdminProduct>('/admin/pet-owner-store/products', body);
  },

  updateProduct(
    productId: string,
    body: UpdatePetStoreProductInput,
  ): Promise<PetStoreAdminProduct> {
    return apiClient.patch<PetStoreAdminProduct>(
      `/admin/pet-owner-store/products/${productId}`,
      body,
    );
  },

  deactivateProduct(productId: string): Promise<PetStoreAdminProduct> {
    return apiClient.delete<PetStoreAdminProduct>(`/admin/pet-owner-store/products/${productId}`);
  },

  requestProductImageUploadUrl(
    productId: string,
    input: { filename: string; mimeType: string; size: number },
  ): Promise<PresignedUpload> {
    return apiClient.post<PresignedUpload>(
      `/admin/pet-owner-store/products/${productId}/image/upload-url`,
      input,
    );
  },

  registerProductImage(
    productId: string,
    input: { storageKey: string; mimeType: string },
  ): Promise<PetStoreAdminProduct> {
    return apiClient.post<PetStoreAdminProduct>(
      `/admin/pet-owner-store/products/${productId}/images`,
      input,
    );
  },

  removeProductImage(productId: string, imageId: string): Promise<PetStoreAdminProduct> {
    return apiClient.delete<PetStoreAdminProduct>(
      `/admin/pet-owner-store/products/${productId}/images/${imageId}`,
    );
  },

  // --- categories -----------------------------------------
  listCategories(): Promise<PetStoreCategory[]> {
    return apiClient.get<PetStoreCategory[]>('/admin/pet-owner-store/categories');
  },

  createCategory(body: CreatePetStoreCategoryInput): Promise<PetStoreCategory> {
    return apiClient.post<PetStoreCategory>('/admin/pet-owner-store/categories', body);
  },

  updateCategory(categoryId: string, body: UpdatePetStoreCategoryInput): Promise<PetStoreCategory> {
    return apiClient.patch<PetStoreCategory>(
      `/admin/pet-owner-store/categories/${categoryId}`,
      body,
    );
  },

  deleteCategory(categoryId: string): Promise<void> {
    return apiClient.delete<void>(`/admin/pet-owner-store/categories/${categoryId}`);
  },

  requestCategoryImageUploadUrl(
    categoryId: string,
    input: { filename: string; mimeType: string; size: number },
  ): Promise<PresignedUpload> {
    return apiClient.post<PresignedUpload>(
      `/admin/pet-owner-store/categories/${categoryId}/image/upload-url`,
      input,
    );
  },

  registerCategoryImage(
    categoryId: string,
    input: { storageKey: string; mimeType: string },
  ): Promise<PetStoreCategory> {
    return apiClient.post<PetStoreCategory>(
      `/admin/pet-owner-store/categories/${categoryId}/image`,
      input,
    );
  },

  // --- orders --------------------------------------------
  async listOrders(params: {
    page: number;
    pageSize: number;
    status?: PetStoreOrderStatus;
  }): Promise<Paginated<PetStoreOrder>> {
    const envelope = await apiClient.requestEnvelope<PetStoreOrder[]>({
      method: 'GET',
      url: '/admin/pet-owner-store/orders',
      params: { page: params.page, pageSize: params.pageSize, status: params.status },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, params.page, params.pageSize, envelope.data.length),
    };
  },

  getOrder(orderId: string): Promise<PetStoreOrder> {
    return apiClient.get<PetStoreOrder>(`/admin/pet-owner-store/orders/${orderId}`);
  },

  updateOrderStatus(orderId: string, status: PetStoreOrderStatus): Promise<PetStoreOrder> {
    return apiClient.patch<PetStoreOrder>(`/admin/pet-owner-store/orders/${orderId}/status`, {
      status,
    });
  },
};

export type PetOwnerStoreAdminService = typeof petOwnerStoreAdminService;
