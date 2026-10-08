/**
 * Animals feature — the clinic side of pets. A CLINIC opens any registered pet
 * by the owner's short public ID / QR (no link is created); its Recent / All
 * Pets are the pets it created its own records for (`/clinic-pets`), and every
 * read is limited to that clinic's own records.
 *
 * This is NOT ownership — the pet stays owned by its Pet Owner (whose
 * experience lives in `features/pets`).
 */
export { organizationAnimalsApi, orgAnimalKeys, type OrganizationAnimalsApi } from './api';
export {
  useOrganizationAnimals,
  useClinicAnimalProfile,
  useOrganizationAnimalSearch,
  useClinicPetLookup,
} from './hooks';
export {
  AnimalCard,
  AnimalCardSkeleton,
  ClinicAnimalPicker,
  type AnimalCardProps,
} from './components';
export {
  OrganizationAnimalsScreen,
  OrganizationAnimalDetailScreen,
  OpenClinicPetScreen,
} from './screens';
export {
  VETERINARY_ANIMAL_ORG_TYPES,
  organizationManagesAnimals,
  animalSpeciesIcon,
  ANIMAL_SPECIES_ICON,
  ANIMAL_STATUS_TONE,
} from './constants';
export * from './types';
