/**
 * Veterinarian Store — the platform-run consumer storefront (Veterinarian
 * mode's 3rd bottom tab). Talks to `server/src/modules/veterinarian-store`
 * via `veterinarianStoreService`. Mirrors the Pet Owners Store
 * (`@/features/petOwnerStore`) cart/checkout/order shapes with its own
 * dedicated catalogue, tables and screens. Consumer browse / cart / checkout
 * / order history need only authentication.
 *
 * Admin catalogue + order management lives under `./admin` and is wired into
 * the Management Centre.
 */
export { veterinarianStoreService, vetStoreKeys, type VeterinarianStoreService } from './api';
export {
  useVeterinarianStore,
  useVeterinarianStoreCategories,
  useVeterinarianStoreProducts,
  useVeterinarianStoreProduct,
  useVeterinarianStoreCart,
  useVeterinarianStoreCartMutations,
  usePlaceVeterinarianStoreOrder,
  useVeterinarianStoreOrders,
  useVeterinarianStoreOrder,
  type VeterinarianStoreSummary,
} from './hooks';
export {
  VeterinarianStoreHomeScreen,
  VeterinarianStoreProductsScreen,
  VeterinarianStoreProductDetailsScreen,
  VeterinarianStoreCartScreen,
  VeterinarianStoreCheckoutScreen,
  VeterinarianStoreOrderConfirmationScreen,
  VeterinarianStoreOrdersScreen,
} from './screens';
export * from './types';
