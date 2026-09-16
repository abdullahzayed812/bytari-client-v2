/**
 * Veterinary Office Dashboard — the seller-style management surface for a
 * veterinarian who owns/manages a VETERINARY_OFFICE organization (reached via
 * "دخول لوحة التحكم" from the "my veterinary organizations" card,
 * `@/features/organizations`). Its own 5-tab shell
 * (`VeterinaryOfficeDashboardShell`/`Tab Bar`), NOT the app's global
 * `(tabs)` bar. Also owns the product management CRUD screens (add/edit/
 * detail/list) — the sibling `../browse` subfolder is public discovery only.
 */
export {
  veterinaryOfficeProductsApi,
  type VeterinaryOfficeProductsApi,
  veterinaryOfficeProductKeys,
  veterinaryOfficeDashboardApi,
  veterinaryOfficeDashboardKeys,
} from './api';
export {
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
} from './hooks';
export {
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
} from './components';
export {
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
} from './screens';
export * from './types';
