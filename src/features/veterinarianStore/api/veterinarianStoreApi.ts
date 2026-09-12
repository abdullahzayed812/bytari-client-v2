import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type {
  CheckoutInput,
  ListVetStoreProductsParams,
  Paginated,
  VetStoreCart,
  VetStoreCategory,
  VetStoreOrder,
  VetStoreOrderStatus,
  VetStoreProductDetail,
  VetStoreProductListItem,
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
 * Consumer Veterinarian Store wrappers — 1:1 with `/veterinarian-store/*`. Any
 * signed-in user may call these; cart-item / order ownership is enforced
 * server-side. `veterinarianStoreService` is the exported name used across the app.
 */
export const veterinarianStoreService = {
  listCategories(homeOnly = false): Promise<VetStoreCategory[]> {
    return apiClient.get<VetStoreCategory[]>(
      '/veterinarian-store/categories',
      homeOnly ? { homeOnly: 'true' } : undefined,
    );
  },

  async listProducts(
    params: ListVetStoreProductsParams & { page: number; pageSize: number },
  ): Promise<Paginated<VetStoreProductListItem>> {
    const envelope = await apiClient.requestEnvelope<VetStoreProductListItem[]>({
      method: 'GET',
      url: '/veterinarian-store/products',
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

  getProduct(productId: string): Promise<VetStoreProductDetail> {
    return apiClient.get<VetStoreProductDetail>(`/veterinarian-store/products/${productId}`);
  },

  // --- cart ---------------------------------------------------

  getCart(): Promise<VetStoreCart> {
    return apiClient.get<VetStoreCart>('/veterinarian-store/cart');
  },

  addCartItem(productId: string, quantity: number): Promise<VetStoreCart> {
    return apiClient.post<VetStoreCart>('/veterinarian-store/cart/items', { productId, quantity });
  },

  updateCartItem(itemId: string, quantity: number): Promise<VetStoreCart> {
    return apiClient.patch<VetStoreCart>(`/veterinarian-store/cart/items/${itemId}`, { quantity });
  },

  removeCartItem(itemId: string): Promise<VetStoreCart> {
    return apiClient.delete<VetStoreCart>(`/veterinarian-store/cart/items/${itemId}`);
  },

  clearCart(): Promise<VetStoreCart> {
    return apiClient.delete<VetStoreCart>('/veterinarian-store/cart');
  },

  // --- checkout / orders ------------------------------------

  placeOrder(input: CheckoutInput): Promise<VetStoreOrder> {
    return apiClient.post<VetStoreOrder>('/veterinarian-store/orders', input);
  },

  async listOrders(params: {
    page: number;
    pageSize: number;
    status?: VetStoreOrderStatus;
  }): Promise<Paginated<VetStoreOrder>> {
    const envelope = await apiClient.requestEnvelope<VetStoreOrder[]>({
      method: 'GET',
      url: '/veterinarian-store/orders',
      params: { page: params.page, pageSize: params.pageSize, status: params.status },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, params.page, params.pageSize, envelope.data.length),
    };
  },

  getOrder(orderId: string): Promise<VetStoreOrder> {
    return apiClient.get<VetStoreOrder>(`/veterinarian-store/orders/${orderId}`);
  },
};

export type VeterinarianStoreService = typeof veterinarianStoreService;
