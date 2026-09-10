/**
 * Store feature — Mobile Phase 10, extended to Veterinary Offices. Product
 * catalogue management for a product-owning organization's own members,
 * against `server/src/modules/veterinary-store` (`/organizations/:orgId/products`).
 *
 * A product-owning organization is VETERINARY_STORE or VETERINARY_OFFICE —
 * members / supervisors / staff / profile reuse the Phase 4
 * `features/organizations` APIs and screens. Every product route needs
 * `product.read` on that organization. Public/consumer browse (any
 * authenticated user) lives in `features/veterinaryOffices`.
 *
 * NOT built here (no backend support for THIS catalog — see
 * MOBILE_ARCHITECTURE.md, never mocked): Pet Owner Store (a wholly separate
 * platform catalog), cart, checkout, addresses, delivery, payment, orders /
 * order history / order status.
 */
export { productsApi, productKeys, type ProductsApi } from './api';
export {
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useAdjustStock,
  type UseProductsParams,
} from './hooks';
export {
  ProductCard,
  ProductCardSkeleton,
  ProductForm,
  AdjustStockForm,
  type ProductCardProps,
  type ProductFormProps,
  type AdjustStockFormProps,
} from './components';
export { ProductsScreen, ProductDetailScreen, ProductFormScreen } from './screens';
export {
  PRODUCT_ORG_TYPES,
  organizationOwnsProducts,
  productTypeIcon,
  PRODUCT_TYPE_ICON,
  PRODUCT_TYPE_ORDER,
  PRODUCT_STATUS_TONE,
  PRODUCT_SORT_OPTIONS,
  LOW_STOCK_THRESHOLD,
} from './constants';
export {
  buildProductSchema,
  buildAdjustStockSchema,
  storeErrorMessage,
  type ProductFormValues,
  type AdjustStockFormValues,
  type StoreTFn,
} from './validation/schemas';
export * from './types';
