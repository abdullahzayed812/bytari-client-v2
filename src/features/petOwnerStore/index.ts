/**
 * Pet Owners Store — the platform-run consumer storefront (Pet Owner mode's 3rd
 * bottom tab). Talks to `server/src/modules/pet-owner-store` via
 * `petOwnerStoreService`. Consumer browse / cart / checkout / order history need
 * only authentication.
 *
 * Admin catalogue + order management lives under `./admin` and is wired into the
 * Management Centre. The future Veterinarians Store will reuse the same
 * cart/checkout/order shapes with its own `VetStore*` screens and naming.
 */
export { petOwnerStoreService, petStoreKeys, type PetOwnerStoreService } from './api';
export {
  usePetOwnerStore,
  usePetOwnerStoreCategories,
  usePetOwnerStoreProducts,
  usePetOwnerStoreProduct,
  usePetOwnerStoreCart,
  usePetOwnerStoreCartMutations,
  usePlacePetOwnerStoreOrder,
  usePetOwnerStoreOrders,
  usePetOwnerStoreOrder,
  type PetOwnerStoreSummary,
} from './hooks';
export {
  PetOwnerStoreHomeScreen,
  PetOwnerStoreProductsScreen,
  PetOwnerStoreProductDetailsScreen,
  PetOwnerStoreCartScreen,
  PetOwnerStoreCheckoutScreen,
  PetOwnerStoreOrderConfirmationScreen,
  PetOwnerStoreOrdersScreen,
} from './screens';
export * from './types';
