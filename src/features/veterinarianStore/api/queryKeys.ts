import type { ListVetStoreProductsParams, VetStoreOrderStatus } from '../types';

/**
 * Veterinarian Store query keys. One `all` prefix invalidates the whole store.
 * The admin surface uses its own `admin` sub-prefix so a catalogue edit can
 * refresh both the management list and the consumer catalogue in one call.
 */
export const vetStoreKeys = {
  all: ['veterinarian-store'] as const,

  categories: (homeOnly = false) => [...vetStoreKeys.all, 'categories', { homeOnly }] as const,

  products: () => [...vetStoreKeys.all, 'products'] as const,
  productList: (filter: ListVetStoreProductsParams) =>
    [...vetStoreKeys.products(), 'list', filter] as const,
  product: (productId: string) => [...vetStoreKeys.products(), 'detail', productId] as const,

  cart: () => [...vetStoreKeys.all, 'cart'] as const,

  orders: () => [...vetStoreKeys.all, 'orders'] as const,
  orderList: (status?: VetStoreOrderStatus) =>
    [...vetStoreKeys.orders(), 'list', { status: status ?? null }] as const,
  order: (orderId: string) => [...vetStoreKeys.orders(), 'detail', orderId] as const,

  admin: () => [...vetStoreKeys.all, 'admin'] as const,
  adminProducts: () => [...vetStoreKeys.admin(), 'products'] as const,
  adminProduct: (productId: string) => [...vetStoreKeys.adminProducts(), productId] as const,
  adminCategories: () => [...vetStoreKeys.admin(), 'categories'] as const,
  adminOrders: (status?: VetStoreOrderStatus) =>
    [...vetStoreKeys.admin(), 'orders', { status: status ?? null }] as const,
  adminOrder: (orderId: string) => [...vetStoreKeys.admin(), 'order', orderId] as const,
};
