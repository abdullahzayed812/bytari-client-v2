/**
 * Organization Store — the Clinic Store and the Veterinary Office Store:
 * per-store cart, Cash-on-Delivery checkout, the customer's order history +
 * tracking, and the seller's incoming orders. Talks to
 * `server/src/modules/organization-store`. Products stay in
 * `@/features/veterinaryOffices` (one catalogue for offices and clinics).
 *
 * Kept separate from the platform stores (`@/features/petOwnerStore`,
 * `@/features/veterinarianStore`) — those keep their own carts / orders.
 */
export { organizationStoreService, orgStoreKeys, type OrganizationStoreService } from './api';
export * from './hooks';
export {
  OrgStoreAddToCart,
  OrgStoreCartButton,
  OrgStoreOrderStatusBadge,
  OrgStoreOrderCard,
} from './components';
export * from './screens';
export * from './types';
export { formatOrgStoreMoney, orgStoreErrorMessage } from './utils';
