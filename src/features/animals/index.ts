/**
 * Animals feature — Mobile Phase 5. Organization-side animal management: the
 * animals a CLINIC organization has veterinary access to (list · detail ·
 * grant · revoke), against `/organizations/:organizationId/animal-access`.
 *
 * This is NOT ownership — the animal stays owned by its Pet Owner (whose
 * experience lives in `features/pets`, unchanged). No medical records,
 * vaccinations, treatments, or appointments here — later phases; the detail
 * screen only carries disabled placeholders for them.
 */
export { organizationAnimalsApi, orgAnimalKeys, type OrganizationAnimalsApi } from './api';
export {
  useOrganizationAnimals,
  useOrganizationAnimal,
  useGrantOrganizationAnimalAccess,
  useRevokeOrganizationAnimalAccess,
} from './hooks';
export { AnimalCard, AnimalCardSkeleton, type AnimalCardProps } from './components';
export {
  OrganizationAnimalsScreen,
  OrganizationAnimalDetailScreen,
  GrantAnimalAccessScreen,
} from './screens';
export {
  VETERINARY_ANIMAL_ORG_TYPES,
  organizationManagesAnimals,
  animalSpeciesIcon,
  ANIMAL_SPECIES_ICON,
  CLINIC_ACCESS_STATUS_TONE,
  ANIMAL_STATUS_TONE,
} from './constants';
export {
  buildGrantAnimalAccessSchema,
  grantAnimalAccessErrorMessage,
  type GrantAnimalAccessFormValues,
  type OrgAnimalsTFn,
} from './validation/schemas';
export * from './types';
