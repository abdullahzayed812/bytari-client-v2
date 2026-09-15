/**
 * Veterinary Office Dashboard — the seller-style management surface for a
 * veterinarian who owns/manages a VETERINARY_OFFICE organization (reached via
 * "دخول لوحة التحكم" from the "my veterinary organizations" card,
 * `@/features/organizations`). Its own 5-tab shell
 * (`VeterinaryOfficeDashboardShell`/`Tab Bar`), NOT the app's global
 * `(tabs)` bar.
 *
 * Product CRUD/detail/forms are reused unchanged from
 * `@/features/veterinaryOffices` (management screens already existed there);
 * this feature adds only what was genuinely missing: the dashboard home,
 * grid product-management cards with حذف/إخفاء/تعديل, the hidden-products
 * screen, follower broadcast, and the org-scoped conversations screen.
 */
export { veterinaryOfficeDashboardApi, veterinaryOfficeDashboardKeys } from './api';
export { useVeterinaryOfficeDashboard, useSendFollowerBroadcast, useBroadcastImageProvider } from './hooks';
export {
  VeterinaryOfficeDashboardShell,
  VeterinaryOfficeDashboardTabBar,
  type VeterinaryOfficeDashboardTab,
  VeterinaryOfficeProductManageCard,
} from './components';
export {
  VeterinaryOfficeDashboardHomeScreen,
  VeterinaryOfficeProductsManageScreen,
  VeterinaryOfficeHiddenProductsScreen,
  SendFollowerMessageScreen,
  VeterinaryOfficeConversationsScreen,
  VeterinaryOfficeOrdersScreen,
  VeterinaryOfficeReportsScreen,
} from './screens';
export * from './types';
