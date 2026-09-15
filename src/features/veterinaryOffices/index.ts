/**
 * Veterinary Offices feature (Veterinarian Home → "المكاتب البيطرية").
 *
 * Public browse (any authenticated user, not just members): list → details →
 * products → product details, built on the existing organizations discover
 * infrastructure (`@/features/organizations`).
 *
 * Management (the office's own members): its own product catalogue CRUD +
 * inventory, mirroring `@/features/veterinaryStore` but fully separate — own
 * `veterinary_office_products` table, own `/office-products` routes, own
 * `VeterinaryOfficeProduct` DTO. No shared tables, DTOs, or business logic
 * with Veterinary Store products.
 */
export {
  publicVeterinaryOfficeProductsApi,
  publicVeterinaryOfficeProductKeys,
  type PublicVeterinaryOfficeProductsApi,
  veterinaryOfficeProductsApi,
  veterinaryOfficeProductKeys,
  type VeterinaryOfficeProductsApi,
} from './api';
export {
  usePublicVeterinaryOfficeProducts,
  usePublicVeterinaryOfficeProduct,
  type UsePublicVeterinaryOfficeProductsParams,
  useVeterinaryOfficeProducts,
  useVeterinaryOfficeProduct,
  type UseVeterinaryOfficeProductsParams,
  useCreateVeterinaryOfficeProduct,
  useUpdateVeterinaryOfficeProduct,
  useDeleteVeterinaryOfficeProduct,
  useAdjustVeterinaryOfficeStock,
} from './hooks';
export {
  PublicVeterinaryOfficeProductCard,
  type PublicVeterinaryOfficeProductCardProps,
  VeterinaryOfficeProductCard,
  type VeterinaryOfficeProductCardProps,
  VeterinaryOfficeProductCardSkeleton,
  VeterinaryOfficeProductForm,
  type VeterinaryOfficeProductFormProps,
  AdjustVeterinaryOfficeStockForm,
  type AdjustVeterinaryOfficeStockFormProps,
} from './components';
export {
  VeterinaryOfficesScreen,
  VeterinaryOfficeDetailsScreen,
  PublicVeterinaryOfficeProductsScreen,
  PublicVeterinaryOfficeProductDetailsScreen,
  VeterinaryOfficeProductsScreen,
  VeterinaryOfficeProductFormScreen,
  VeterinaryOfficeProductDetailScreen,
} from './screens';
export {
  organizationOwnsVeterinaryOfficeProducts,
  veterinaryOfficeProductTypeIcon,
  VETERINARY_OFFICE_PRODUCT_TYPE_ICON,
  VETERINARY_OFFICE_PRODUCT_TYPE_ORDER,
  VETERINARY_OFFICE_PRODUCT_STATUS_TONE,
  VETERINARY_OFFICE_PRODUCT_SORT_OPTIONS,
  VETERINARY_OFFICE_LOW_STOCK_THRESHOLD,
} from './constants';
export {
  buildVeterinaryOfficeProductSchema,
  buildAdjustVeterinaryOfficeStockSchema,
  veterinaryOfficeErrorMessage,
  type VeterinaryOfficeProductFormValues,
  type AdjustVeterinaryOfficeStockFormValues,
  type VeterinaryOfficeTFn,
} from './validation/schemas';
export { formatProductPrice } from './utils';
export * from './types';
