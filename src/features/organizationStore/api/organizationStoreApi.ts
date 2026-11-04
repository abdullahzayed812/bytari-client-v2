import type { Conversation } from '@/features/chat/types';
import { apiClient } from '@/services/api';
import type { PageMeta } from '@/services/api';

import type {
  OrgStoreCart,
  OrgStoreCartSummary,
  OrgStoreCheckoutInput,
  OrgStoreOrder,
  OrgStoreOrdersSummary,
  OrgStoreOrderStatus,
  OrgStoreType,
  Paginated,
} from '../types';

function readMeta(meta: unknown, page: number, pageSize: number, count: number): PageMeta {
  const m = (meta ?? {}) as Partial<PageMeta>;
  return {
    page: m.page ?? page,
    pageSize: m.pageSize ?? pageSize,
    total: m.total ?? count,
    totalPages: m.totalPages ?? 1,
  };
}

const cartBase = (organizationId: string) => `/organization-store/organizations/${organizationId}`;

/**
 * Clinic / Veterinary Office store wrappers — 1:1 with the server routes.
 * Customer calls need only authentication (ownership enforced server-side);
 * seller calls are authorized per organization (`store.order.read|manage`).
 */
export const organizationStoreService = {
  // --- customer: carts ----------------------------------------------
  listCarts(): Promise<OrgStoreCartSummary[]> {
    return apiClient.get<OrgStoreCartSummary[]>('/organization-store/carts');
  },
  getCart(organizationId: string): Promise<OrgStoreCart> {
    return apiClient.get<OrgStoreCart>(`${cartBase(organizationId)}/cart`);
  },
  addCartItem(organizationId: string, productId: string, quantity: number): Promise<OrgStoreCart> {
    return apiClient.post<OrgStoreCart>(`${cartBase(organizationId)}/cart/items`, {
      productId,
      quantity,
    });
  },
  updateCartItem(organizationId: string, itemId: string, quantity: number): Promise<OrgStoreCart> {
    return apiClient.patch<OrgStoreCart>(`${cartBase(organizationId)}/cart/items/${itemId}`, {
      quantity,
    });
  },
  removeCartItem(organizationId: string, itemId: string): Promise<OrgStoreCart> {
    return apiClient.delete<OrgStoreCart>(`${cartBase(organizationId)}/cart/items/${itemId}`);
  },
  clearCart(organizationId: string): Promise<OrgStoreCart> {
    return apiClient.delete<OrgStoreCart>(`${cartBase(organizationId)}/cart`);
  },

  // --- customer: orders ---------------------------------------------
  placeOrder(organizationId: string, input: OrgStoreCheckoutInput): Promise<OrgStoreOrder> {
    return apiClient.post<OrgStoreOrder>(`${cartBase(organizationId)}/orders`, input);
  },
  async listMyOrders(params: {
    page: number;
    pageSize: number;
    status?: OrgStoreOrderStatus;
    organizationId?: string;
    organizationType?: OrgStoreType;
  }): Promise<Paginated<OrgStoreOrder>> {
    const envelope = await apiClient.requestEnvelope<OrgStoreOrder[]>({
      method: 'GET',
      url: '/organization-store/orders',
      params: {
        page: params.page,
        pageSize: params.pageSize,
        status: params.status,
        organizationId: params.organizationId,
        organizationType: params.organizationType,
      },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, params.page, params.pageSize, envelope.data.length),
    };
  },
  getMyOrder(orderId: string): Promise<OrgStoreOrder> {
    return apiClient.get<OrgStoreOrder>(`/organization-store/orders/${orderId}`);
  },
  /** Customer ↔ store chat opened from an order the caller placed (reused if it exists). */
  openMyOrderConversation(orderId: string): Promise<Conversation> {
    return apiClient.post<Conversation>(`/organization-store/orders/${orderId}/conversation`);
  },
  cancelMyOrder(orderId: string, note?: string | null): Promise<OrgStoreOrder> {
    return apiClient.post<OrgStoreOrder>(`/organization-store/orders/${orderId}/cancel`, {
      note: note || null,
    });
  },

  // --- seller --------------------------------------------------------
  async listIncomingOrders(
    organizationId: string,
    params: {
      page: number;
      pageSize: number;
      status?: OrgStoreOrderStatus;
      newOnly?: boolean;
      search?: string;
    },
  ): Promise<Paginated<OrgStoreOrder>> {
    const envelope = await apiClient.requestEnvelope<OrgStoreOrder[]>({
      method: 'GET',
      url: `/organizations/${organizationId}/store-orders`,
      params: {
        page: params.page,
        pageSize: params.pageSize,
        status: params.status,
        newOnly: params.newOnly ? 'true' : undefined,
        search: params.search || undefined,
      },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, params.page, params.pageSize, envelope.data.length),
    };
  },
  incomingOrdersSummary(organizationId: string): Promise<OrgStoreOrdersSummary> {
    return apiClient.get<OrgStoreOrdersSummary>(
      `/organizations/${organizationId}/store-orders/summary`,
    );
  },
  getIncomingOrder(organizationId: string, orderId: string): Promise<OrgStoreOrder> {
    return apiClient.get<OrgStoreOrder>(`/organizations/${organizationId}/store-orders/${orderId}`);
  },
  /** The store opens its chat with THIS order's customer (`store.order.read`). */
  openIncomingOrderConversation(organizationId: string, orderId: string): Promise<Conversation> {
    return apiClient.post<Conversation>(
      `/organizations/${organizationId}/store-orders/${orderId}/conversation`,
    );
  },
  updateIncomingOrderStatus(
    organizationId: string,
    orderId: string,
    status: OrgStoreOrderStatus,
    note?: string | null,
  ): Promise<OrgStoreOrder> {
    return apiClient.patch<OrgStoreOrder>(
      `/organizations/${organizationId}/store-orders/${orderId}/status`,
      { status, note: note || null },
    );
  },
};

export type OrganizationStoreService = typeof organizationStoreService;
