import type { ListPetStoreProductsParams, PetStoreOrderStatus } from '../types';

/**
 * Pet Owners Store query keys. One `all` prefix invalidates the whole store.
 * The admin surface uses its own `admin` sub-prefix so a catalogue edit can
 * refresh both the management list and the consumer catalogue in one call.
 */
export const petStoreKeys = {
  all: ['pet-owner-store'] as const,

  categories: (homeOnly = false) => [...petStoreKeys.all, 'categories', { homeOnly }] as const,

  products: () => [...petStoreKeys.all, 'products'] as const,
  productList: (filter: ListPetStoreProductsParams) =>
    [...petStoreKeys.products(), 'list', filter] as const,
  product: (productId: string) => [...petStoreKeys.products(), 'detail', productId] as const,

  cart: () => [...petStoreKeys.all, 'cart'] as const,

  orders: () => [...petStoreKeys.all, 'orders'] as const,
  orderList: (status?: PetStoreOrderStatus) =>
    [...petStoreKeys.orders(), 'list', { status: status ?? null }] as const,
  order: (orderId: string) => [...petStoreKeys.orders(), 'detail', orderId] as const,

  admin: () => [...petStoreKeys.all, 'admin'] as const,
  adminProducts: () => [...petStoreKeys.admin(), 'products'] as const,
  adminProduct: (productId: string) => [...petStoreKeys.adminProducts(), productId] as const,
  adminCategories: () => [...petStoreKeys.admin(), 'categories'] as const,
  adminOrders: (status?: PetStoreOrderStatus) =>
    [...petStoreKeys.admin(), 'orders', { status: status ?? null }] as const,
  adminOrder: (orderId: string) => [...petStoreKeys.admin(), 'order', orderId] as const,
};
