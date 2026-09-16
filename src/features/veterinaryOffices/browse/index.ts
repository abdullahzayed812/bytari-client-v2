/**
 * Veterinary Offices — public browse (any authenticated user, not just
 * members): list → details → products → product details. Built on the
 * existing organizations discover infrastructure (`@/features/organizations`).
 * Management/dashboard is the sibling `../dashboard` subfolder.
 */
export {
  publicVeterinaryOfficeProductsApi,
  publicVeterinaryOfficeProductKeys,
  type PublicVeterinaryOfficeProductsApi,
} from './api';
export {
  usePublicVeterinaryOfficeProducts,
  usePublicVeterinaryOfficeProduct,
  type UsePublicVeterinaryOfficeProductsParams,
} from './hooks';
export {
  PublicVeterinaryOfficeProductCard,
  type PublicVeterinaryOfficeProductCardProps,
} from './components';
export {
  VeterinaryOfficesScreen,
  VeterinaryOfficeDetailsScreen,
  PublicVeterinaryOfficeProductsScreen,
  PublicVeterinaryOfficeProductDetailsScreen,
} from './screens';
