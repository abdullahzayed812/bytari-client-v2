/**
 * Pets feature (backend "Animals") — Mobile Phase 3. Pet Owner CRUD:
 * list · detail · create · edit · archive. Ownership is entirely backend-derived
 * and enforced. No medical / vaccination / adoption / mating / lost data.
 */
export {
  petsApi,
  petKeys,
  transferRequestsApi,
  transferRequestKeys,
  type PetsApi,
  type TransferRequestsApi,
  type TransferRequestListPage,
} from './api';
export {
  usePets,
  usePet,
  useCreatePet,
  useUpdatePet,
  useDeactivatePet,
  usePetOwnershipHistory,
  useSentTransferRequests,
  useReceivedTransferRequests,
  useCreateTransferRequest,
  useAcceptTransferRequest,
  useRejectTransferRequest,
  useCancelTransferRequest,
  type UsePetsParams,
} from './hooks';
export {
  PetCard,
  PetCardSkeleton,
  PetShowcaseCard,
  FeatureCard,
  PetImage,
  PetForm,
  PetFormLayout,
  FutureSectionRow,
  type PetCardProps,
  type PetShowcaseCardProps,
  type FeatureCardProps,
  type PetFormProps,
  type PetImageProps,
} from './components';
export {
  PetsLandingScreen,
  MyPetsScreen,
  PetDetailsScreen,
  AddPetScreen,
  EditPetScreen,
  OwnershipHistoryScreen,
  TransferRequestsScreen,
} from './screens';
export { petAge, SPECIES_ICON, SPECIES_OPTIONS, SEX_OPTIONS, type PetAge } from './constants';
export {
  buildPetSchema,
  toCreateInput,
  buildTransferRequestSchema,
  transferRequestErrorMessage,
  type PetFormValues,
  type TransferRequestFormValues,
} from './validation/schemas';
export type {
  Pet,
  PetSpecies,
  PetSex,
  PetStatus,
  CreatePetInput,
  UpdatePetInput,
  PetListFilter,
  PetListPage,
  PageMeta,
  OwnershipRecord,
  OwnerSummary,
  TransferRequestStatus,
  AnimalTransferRequest,
  CreateTransferRequestInput,
} from './types';
export { PET_SPECIES, PET_SEXES, PET_STATUSES, TRANSFER_REQUEST_STATUSES } from './types';
