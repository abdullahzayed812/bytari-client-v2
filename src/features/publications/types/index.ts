/**
 * Animal-publication contract — Lost / Adoption / Mating. Mirrors
 * `server/src/modules/animals` publication code exactly (`publication.constants.ts`,
 * `publication.types.ts`, `publication.schemas.ts`, OpenAPI `phase7`). No
 * invented fields.
 *
 *   owner   → POST   /animals/:animalId/publications          (starts PENDING)
 *   owner   → GET    /animals/:animalId/publications[/:id]     (every status)
 *   anyone  → GET    /animal-publications[/:id]                (APPROVED only, ALL users, not scoped to caller)
 *   anyone (not the owner) → POST /animal-publications/:id/interactions
 *
 * Each kind collects a genuinely different field set — `CreatePublicationInput`
 * is a discriminated union on `kind`, matching the backend's Zod
 * discriminated union exactly. `contactName` / `contactPhone` ARE included in
 * the public projection — explicit, per-listing contact info the owner
 * chose to publish, never the account's private phone.
 */

export const PUBLICATION_KINDS = ['LOST', 'ADOPTION', 'MATING'] as const;
export type PublicationKind = (typeof PUBLICATION_KINDS)[number];

export const PUBLICATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

/** Self-declared, listing-time claims — not a verified medical record. */
export const HEALTH_STATUSES = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'] as const;
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export const VACCINATION_STATUSES = ['COMPLETE', 'PARTIAL', 'NONE'] as const;
export type VaccinationStatus = (typeof VACCINATION_STATUSES)[number];

export const PUBLICATION_INTERACTION_TYPES = ['REQUEST', 'SIGHTING'] as const;
export type PublicationInteractionType = (typeof PUBLICATION_INTERACTION_TYPES)[number];

export const AGE_ESTIMATES = [
  'UNDER_1_YEAR',
  'ONE_TO_3_YEARS',
  'THREE_TO_7_YEARS',
  'OVER_7_YEARS',
] as const;
export type AgeEstimate = (typeof AGE_ESTIMATES)[number];

/** The animal summary joined onto a publication. */
export interface PublicationAnimal {
  id: string;
  name: string;
  /** Free-form from the backend; usually a Phase 3 species value. */
  species: string;
  breed: string | null;
  sex: string;
  dateOfBirth: string | null;
  color: string | null;
  distinguishingFeatures: string | null;
  ageEstimate: AgeEstimate | null;
  galleryUrls: string[];
}

/** Listing fields shared by both the owner/moderation view and the public view. */
export interface PublicationListingFields {
  contactName: string;
  contactPhone: string;
  /** ADOPTION / MATING only. */
  city: string | null;
  extraNotes: string | null;
  /** ADOPTION / MATING only — self-declared, not a verified medical record. */
  healthStatus: HealthStatus | null;
  /** ADOPTION / MATING only. */
  vaccinationStatus: VaccinationStatus | null;
  /** ADOPTION only. */
  isSterilized: boolean | null;
  /** LOST only. */
  lostDate: string | null;
  /** LOST only, `HH:MM`. */
  lostTime: string | null;
  /** LOST only. */
  lostGovernorate: string | null;
  /** LOST only. */
  lostDistrict: string | null;
  /** LOST only. */
  lostLocationDetail: string | null;
  /** LOST only, freeform. */
  healthNotes: string | null;
}

/**
 * Owner / moderation view — `GET /animals/:animalId/publications[/:id]` and
 * the `POST` response. Carries the status + rejection reason the public view
 * omits.
 */
export interface AnimalPublication extends PublicationListingFields {
  id: string;
  animalId: string;
  kind: PublicationKind;
  status: PublicationStatus;
  note: string | null;
  createdByUserId: string;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Public-browse projection — `GET /animal-publications[/:id]`. APPROVED only,
 * from ALL users (never scoped to the caller). Omits the publisher's account
 * identity and moderation metadata.
 */
export interface PublicPublication extends PublicationListingFields {
  id: string;
  kind: PublicationKind;
  note: string | null;
  publishedAt: string;
  animal: PublicationAnimal;
}

/**
 * "My listings" projection — `GET /animal-publications/mine`. The caller's OWN
 * listings of EVERY status (owner id derived server-side from the session).
 * The public shape plus the moderation fields, so the owner can see PENDING /
 * REJECTED listings and why one was rejected.
 */
export interface MyPublication extends PublicPublication {
  animalId: string;
  status: PublicationStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- request payloads (client sends ONLY these fields) --------------

export interface CreateLostPublicationInput {
  kind: 'LOST';
  note?: string;
  contactName: string;
  contactPhone: string;
  lostDate: string;
  lostTime?: string;
  lostGovernorate: string;
  lostDistrict: string;
  lostLocationDetail?: string;
  healthNotes?: string;
}

export interface CreateAdoptionPublicationInput {
  kind: 'ADOPTION';
  note: string;
  extraNotes?: string;
  contactName: string;
  contactPhone: string;
  city: string;
  healthStatus: HealthStatus;
  vaccinationStatus: VaccinationStatus;
  isSterilized: boolean;
}

export interface CreateMatingPublicationInput {
  kind: 'MATING';
  note?: string;
  extraNotes?: string;
  contactName: string;
  contactPhone: string;
  city: string;
  healthStatus: HealthStatus;
  vaccinationStatus: VaccinationStatus;
}

export type CreatePublicationInput =
  CreateLostPublicationInput | CreateAdoptionPublicationInput | CreateMatingPublicationInput;

// --- interactions ("طلب التبني" / "طلب تزاوج" / "ابلاغ عن مشاهدة") -----

export interface PublicationInteraction {
  id: string;
  publicationId: string;
  type: PublicationInteractionType;
  requesterUserId: string;
  message: string | null;
  createdAt: string;
}

export interface CreateInteractionInput {
  type: PublicationInteractionType;
  message?: string;
}

// --- list -----------------------------------------------------------
export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}
