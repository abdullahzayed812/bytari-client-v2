import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type {
  CheckoutInput,
  ListPetStoreProductsParams,
  Paginated,
  PetStoreCart,
  PetStoreCategory,
  PetStoreOrder,
  PetStoreOrderStatus,
  PetStoreProductDetail,
  PetStoreProductListItem,
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
 * Consumer Pet Owners Store wrappers — 1:1 with `/pet-owner-store/*`. Any
 * signed-in user may call these; cart-item / order ownership is enforced
 * server-side. `petOwnerStoreService` is the exported name used across the app.
 */
export const petOwnerStoreService = {
  listCategories(homeOnly = false): Promise<PetStoreCategory[]> {
    return apiClient.get<PetStoreCategory[]>(
      '/pet-owner-store/categories',
      homeOnly ? { homeOnly: 'true' } : undefined,
    );
  },

  async listProducts(
    params: ListPetStoreProductsParams & { page: number; pageSize: number },
  ): Promise<Paginated<PetStoreProductListItem>> {
    const envelope = await apiClient.requestEnvelope<PetStoreProductListItem[]>({
      method: 'GET',
      url: '/pet-owner-store/products',
      params: {
        page: params.page,
        pageSize: params.pageSize,
        categoryId: params.categoryId || undefined,
        search: params.search || undefined,
        sort: params.sort,
        order: params.order,
      },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, params.page, params.pageSize, envelope.data.length),
    };
  },

  getProduct(productId: string): Promise<PetStoreProductDetail> {
    return apiClient.get<PetStoreProductDetail>(`/pet-owner-store/products/${productId}`);
  },

  // --- cart ---------------------------------------------------

  getCart(): Promise<PetStoreCart> {
    return apiClient.get<PetStoreCart>('/pet-owner-store/cart');
  },

  addCartItem(productId: string, quantity: number): Promise<PetStoreCart> {
    return apiClient.post<PetStoreCart>('/pet-owner-store/cart/items', { productId, quantity });
  },

  updateCartItem(itemId: string, quantity: number): Promise<PetStoreCart> {
    return apiClient.patch<PetStoreCart>(`/pet-owner-store/cart/items/${itemId}`, { quantity });
  },

  removeCartItem(itemId: string): Promise<PetStoreCart> {
    return apiClient.delete<PetStoreCart>(`/pet-owner-store/cart/items/${itemId}`);
  },

  clearCart(): Promise<PetStoreCart> {
    return apiClient.delete<PetStoreCart>('/pet-owner-store/cart');
  },

  // --- checkout / orders ------------------------------------

  placeOrder(input: CheckoutInput): Promise<PetStoreOrder> {
    return apiClient.post<PetStoreOrder>('/pet-owner-store/orders', input);
  },

  async listOrders(params: {
    page: number;
    pageSize: number;
    status?: PetStoreOrderStatus;
  }): Promise<Paginated<PetStoreOrder>> {
    const envelope = await apiClient.requestEnvelope<PetStoreOrder[]>({
      method: 'GET',
      url: '/pet-owner-store/orders',
      params: { page: params.page, pageSize: params.pageSize, status: params.status },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, params.page, params.pageSize, envelope.data.length),
    };
  },

  getOrder(orderId: string): Promise<PetStoreOrder> {
    return apiClient.get<PetStoreOrder>(`/pet-owner-store/orders/${orderId}`);
  },
};

export type PetOwnerStoreService = typeof petOwnerStoreService;
