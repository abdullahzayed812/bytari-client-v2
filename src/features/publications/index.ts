/**
 * Publications feature — the animal community: Lost / Adoption / Mating
 * listings, against `server/src/modules/animals` publication routes.
 *
 * One reusable model + PENDING → APPROVED / REJECTED lifecycle. Owners publish
 * their own animal (backend derives ownership; the publication starts PENDING
 * and is not public until an admin / ANIMAL supervisor approves it). Any
 * authenticated user browses APPROVED listings from ALL owners (never scoped
 * to the caller) — contact info IS included (explicit, per-listing, not the
 * account's private phone), and photos are real (the animal's own gallery).
 */
export {
  publicationsApi,
  adminPublicationsApi,
  publicationKeys,
  type PublicationsApi,
  type AdminPublicationsApi,
} from './api';
export {
  usePublicPublications,
  useMyPublications,
  usePublicPublication,
  useAnimalPublications,
  useAnimalPublication,
  useCreatePublication,
  useDeletePublication,
  useCreatePublicationInteraction,
  useAdminAnimalPublications,
  useAdminApprovePublication,
  useAdminRejectPublication,
} from './hooks';
export {
  AnimalCard,
  PublicationCardSkeleton,
  PublicationKindBadge,
  PublicationStatusBadge,
  PublicationForm,
  PublicationListingFieldsForm,
  AnimalProfileFields,
  type AnimalCardProps,
  type PublicationFormProps,
  type PublicationListingFieldsFormProps,
  type AnimalProfileFieldsProps,
} from './components';
export {
  PublicationsBrowseScreen,
  PublicationDetailScreen,
  PublishAnimalScreen,
  CreatePublicationScreen,
} from './screens';
export {
  PUBLICATION_KIND_META,
  PUBLICATION_KIND_TONE,
  PUBLICATION_STATUS_TONE,
  KIND_INTERACTION,
  publicationKindFromSlug,
  publicationKindSlug,
  publicationSpeciesIcon,
} from './constants';
export {
  buildListingSchema,
  buildAnimalProfileSchema,
  listingValuesToInput,
  publicationErrorMessage,
  type PublicationTFn,
} from './validation/schemas';
export * from './types';
