import type { OrgStoreOrderStatus } from '../types';

/** Organization Store query keys — one `all` prefix invalidates every store screen. */
export const orgStoreKeys = {
  all: ['organization-store'] as const,

  carts: () => [...orgStoreKeys.all, 'carts'] as const,
  cart: (organizationId: string) => [...orgStoreKeys.all, 'cart', organizationId] as const,

  myOrders: () => [...orgStoreKeys.all, 'my-orders'] as const,
  myOrderList: (filter: { status?: OrgStoreOrderStatus; organizationId?: string }) =>
    [
      ...orgStoreKeys.myOrders(),
      'list',
      { status: filter.status ?? null, organizationId: filter.organizationId ?? null },
    ] as const,
  myOrder: (orderId: string) => [...orgStoreKeys.myOrders(), 'detail', orderId] as const,

  seller: (organizationId: string) => [...orgStoreKeys.all, 'seller', organizationId] as const,
  sellerOrders: (
    organizationId: string,
    filter: { status?: OrgStoreOrderStatus; newOnly?: boolean; search?: string },
  ) =>
    [
      ...orgStoreKeys.seller(organizationId),
      'orders',
      {
        status: filter.status ?? null,
        newOnly: Boolean(filter.newOnly),
        search: filter.search ?? null,
      },
    ] as const,
  sellerSummary: (organizationId: string) =>
    [...orgStoreKeys.seller(organizationId), 'summary'] as const,
  sellerOrder: (organizationId: string, orderId: string) =>
    [...orgStoreKeys.seller(organizationId), 'order', orderId] as const,
};
