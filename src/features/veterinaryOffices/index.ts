/**
 * Veterinary Offices feature (Veterinarian Home → "المكاتب البيطرية").
 *
 * One feature module, two clearly-separated subfolders:
 *  - `./browse`    — public discovery (any authenticated user, not just
 *    members): list → details → products → product details, built on the
 *    existing organizations discover infrastructure (`@/features/organizations`).
 *  - `./dashboard` — the office's own members: product catalogue CRUD +
 *    inventory management, plus the full seller-style Dashboard (home, hidden
 *    products, follower broadcast, conversations, orders/reports stubs).
 *    Mirrors `@/features/veterinaryStore` but fully separate — own
 *    `veterinary_office_products` table, own `/office-products` routes, own
 *    `VeterinaryOfficeProduct` DTO. No shared tables, DTOs, or business logic
 *    with Veterinary Store products.
 *
 * Shared, type-only modules (types/constants/validation/utils/dev-data) stay
 * at this root since both subfolders — and a few external deep-importers
 * (e.g. `OrganizationDetailsScreen`) — depend on their exact paths.
 */
export {
  publicVeterinaryOfficeProductsApi,
  publicVeterinaryOfficeProductKeys,
  type PublicVeterinaryOfficeProductsApi,
  usePublicVeterinaryOfficeProducts,
  usePublicVeterinaryOfficeProduct,
  type UsePublicVeterinaryOfficeProductsParams,
  PublicVeterinaryOfficeProductCard,
  type PublicVeterinaryOfficeProductCardProps,
  VeterinaryOfficesScreen,
  VeterinaryOfficeDetailsScreen,
  PublicVeterinaryOfficeProductsScreen,
  PublicVeterinaryOfficeProductDetailsScreen,
} from './browse';
export {
  veterinaryOfficeProductsApi,
  veterinaryOfficeProductKeys,
  type VeterinaryOfficeProductsApi,
  veterinaryOfficeDashboardApi,
  veterinaryOfficeDashboardKeys,
  useVeterinaryOfficeProducts,
  useVeterinaryOfficeProduct,
  type UseVeterinaryOfficeProductsParams,
  useCreateVeterinaryOfficeProduct,
  useUpdateVeterinaryOfficeProduct,
  useDeleteVeterinaryOfficeProduct,
  useAdjustVeterinaryOfficeStock,
  useRemoveVeterinaryOfficeProductImage,
  useVeterinaryOfficeProductImagePresignProvider,
  useVeterinaryOfficeDashboard,
  useSendFollowerBroadcast,
  useBroadcastImageProvider,
  VeterinaryOfficeProductCard,
  type VeterinaryOfficeProductCardProps,
  VeterinaryOfficeProductCardSkeleton,
  VeterinaryOfficeProductForm,
  type VeterinaryOfficeProductFormProps,
  AdjustVeterinaryOfficeStockForm,
  type AdjustVeterinaryOfficeStockFormProps,
  VeterinaryOfficeDashboardShell,
  VeterinaryOfficeDashboardTabBar,
  type VeterinaryOfficeDashboardTab,
  VeterinaryOfficeProductManageCard,
  VeterinaryOfficeProductsScreen,
  VeterinaryOfficeProductFormScreen,
  VeterinaryOfficeProductDetailScreen,
  VeterinaryOfficeDashboardHomeScreen,
  VeterinaryOfficeProductsManageScreen,
  VeterinaryOfficeHiddenProductsScreen,
  SendFollowerMessageScreen,
  VeterinaryOfficeConversationsScreen,
  VeterinaryOfficeOrdersScreen,
  VeterinaryOfficeReportsScreen,
  type VeterinaryOfficeDashboardSummary,
  type SendFollowerBroadcastInput,
  type BroadcastImageUploadUrlInput,
  type BroadcastImageUploadUrlResult,
} from './dashboard';
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
