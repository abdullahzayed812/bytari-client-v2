/**
 * Publications feature — Mobile Phase 8. The animal community: Lost / Adoption /
 * Mating listings, against `server/src/modules/animals` publication routes.
 *
 * One reusable model + PENDING → APPROVED / REJECTED lifecycle. Owners publish
 * their own animal (backend derives ownership; the publication starts PENDING
 * and is not public until an admin / ANIMAL supervisor approves it). Any
 * authenticated user browses APPROVED listings — no owner PII, no contact
 * details, no images (the backend model has none). No edit / delete / close /
 * "mark found" endpoint exists — see MOBILE_ARCHITECTURE.md. Moderation is the
 * admin dashboard's job (out of scope). No chat / realtime / notifications.
 */
export { publicationsApi, publicationKeys, type PublicationsApi } from './api';
export {
  usePublicPublications,
  usePublicPublication,
  useAnimalPublications,
  useAnimalPublication,
  useCreatePublication,
} from './hooks';
export {
  PublicationCard,
  PublicationCardSkeleton,
  PublicationKindBadge,
  PublicationStatusBadge,
  PublicationForm,
  type PublicationCardProps,
  type PublicationFormProps,
} from './components';
export { PublicationsBrowseScreen, PublicationDetailScreen, PublishAnimalScreen } from './screens';
export {
  PUBLICATION_KIND_META,
  PUBLICATION_KIND_TONE,
  PUBLICATION_STATUS_TONE,
  publicationKindFromSlug,
  publicationKindSlug,
  publicationSpeciesIcon,
} from './constants';
export {
  buildPublicationSchema,
  publicationErrorMessage,
  type PublicationFormValues,
  type PublicationTFn,
} from './validation/schemas';
export * from './types';
