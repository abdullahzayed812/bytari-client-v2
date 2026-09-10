/**
 * Veterinary Store feature — Mobile Phase 10. Product catalogue management
 * for a VETERINARY_STORE organization's own members, against
 * `server/src/modules/veterinary-store` (`/organizations/:orgId/store-products`).
 *
 * This is a fully separate domain from Veterinary Office products
 * (`@/features/veterinaryOffices`, own `veterinary_office_products` table
 * and `/office-products` routes) and Pet Owner Store products
 * (`@/features/petOwnerStore`) — no shared tables, DTOs, or business logic.
 *
 * Members / supervisors / staff / profile reuse the Phase 4
 * `features/organizations` APIs and screens. Every product route needs
 * `product.read` on that organization.
 *
 * NOT built here (no backend support for THIS catalog — see
 * MOBILE_ARCHITECTURE.md, never mocked): cart, checkout, addresses, delivery,
 * payment, orders / order history / order status.
 */
export { veterinaryStoreProductsApi, veterinaryStoreProductKeys, type VeterinaryStoreProductsApi } from './api';
export {
  useVeterinaryStoreProducts,
  useVeterinaryStoreProduct,
  useCreateVeterinaryStoreProduct,
  useUpdateVeterinaryStoreProduct,
  useDeleteVeterinaryStoreProduct,
  useAdjustVeterinaryStoreStock,
  type UseVeterinaryStoreProductsParams,
} from './hooks';
export {
  VeterinaryStoreProductCard,
  VeterinaryStoreProductCardSkeleton,
  VeterinaryStoreProductForm,
  AdjustVeterinaryStoreStockForm,
  type VeterinaryStoreProductCardProps,
  type VeterinaryStoreProductFormProps,
  type AdjustVeterinaryStoreStockFormProps,
} from './components';
export { VeterinaryStoreProductsScreen, VeterinaryStoreProductDetailScreen, VeterinaryStoreProductFormScreen } from './screens';
export {
  organizationOwnsVeterinaryStoreProducts,
  veterinaryStoreProductTypeIcon,
  VETERINARY_STORE_PRODUCT_TYPE_ICON,
  VETERINARY_STORE_PRODUCT_TYPE_ORDER,
  VETERINARY_STORE_PRODUCT_STATUS_TONE,
  VETERINARY_STORE_PRODUCT_SORT_OPTIONS,
  VETERINARY_STORE_LOW_STOCK_THRESHOLD,
} from './constants';
export {
  buildVeterinaryStoreProductSchema,
  buildAdjustVeterinaryStoreStockSchema,
  veterinaryStoreErrorMessage,
  type VeterinaryStoreProductFormValues,
  type AdjustVeterinaryStoreStockFormValues,
  type VeterinaryStoreTFn,
} from './validation/schemas';
export * from './types';
