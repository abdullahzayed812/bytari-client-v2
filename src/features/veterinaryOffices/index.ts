/**
 * Veterinary Offices — public browse (Veterinarian Home → "المكاتب البيطرية").
 * Any authenticated user, not just members: list → details → products →
 * product details. Built on the existing organizations discover
 * infrastructure (`@/features/organizations`) and the veterinary-store
 * product DTO (`@/features/store`) — this feature only adds the
 * PUBLIC-catalog API/hooks/screens; product management stays in
 * `@/features/store`.
 */
export {
  veterinaryOfficeProductsApi,
  veterinaryOfficeProductKeys,
  type VeterinaryOfficeProductsApi,
} from './api';
export {
  useVeterinaryOfficeProducts,
  useVeterinaryOfficeProduct,
  type UseVeterinaryOfficeProductsParams,
} from './hooks';
export { VeterinaryProductCard, type VeterinaryProductCardProps } from './components';
export {
  VeterinaryOfficesScreen,
  VeterinaryOfficeDetailsScreen,
  VeterinaryOfficeProductsScreen,
  VeterinaryProductDetailsScreen,
} from './screens';
