/**
 * Store feature — Mobile Phase 10. Veterinary Store product-catalogue
 * management for that store's own members, against
 * `server/src/modules/veterinary-store` (`/organizations/:orgId/products`).
 *
 * A Veterinary Store is an Organization of type `VETERINARY_STORE` — members /
 * supervisors / staff / profile reuse the Phase 4 `features/organizations` APIs
 * and screens. Every product route needs `product.read` on that organization;
 * there is NO public / consumer browse.
 *
 * NOT built (no backend support — see MOBILE_ARCHITECTURE.md, never mocked):
 * Pet Owner Store, consumer product browse, categories, product images, cart,
 * checkout, addresses, delivery, payment, orders / order history / order status.
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
  VETERINARY_STORE_ORG_TYPE,
  organizationIsVeterinaryStore,
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
