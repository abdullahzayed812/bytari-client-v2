/**
 * Organization ↔ animal contract — Mobile Phase 5. Mirrors the backend
 * `server/src/modules/veterinary-care` exactly:
 *
 *   GET    /organizations/:organizationId/animal-access            (list grants)
 *   POST   /organizations/:organizationId/animal-access            (grant)
 *   DELETE /organizations/:organizationId/animal-access/:animalId  (revoke)
 *
 * The relationship modelled here is `animal_clinic_access` — a revocable
 * veterinary-access GRANT held by a CLINIC organization. It is **independent of
 * animal ownership**: the animal stays owned by its Pet Owner. There is no
 * ownership transfer in this flow.
 */

/** `animal_clinic_access.status`. */
export const CLINIC_ACCESS_STATUSES = ['ACTIVE', 'REVOKED'] as const;
export type ClinicAccessStatus = (typeof CLINIC_ACCESS_STATUSES)[number];

/** Backend `animals.species` vocabulary (mirrors Phase 3 `PET_SPECIES`). */
export const ANIMAL_SPECIES = [
  'DOG',
  'CAT',
  'BIRD',
  'RABBIT',
  'REPTILE',
  'FISH',
  'HORSE',
  'OTHER',
] as const;
export type AnimalSpecies = (typeof ANIMAL_SPECIES)[number];

/** Backend `animals.status` — animal-core lifecycle only. */
export const ANIMAL_STATUSES = ['ACTIVE', 'DEACTIVATED'] as const;
export type AnimalStatus = (typeof ANIMAL_STATUSES)[number];

/**
 * One row of `GET /organizations/:organizationId/animal-access`. This is a
 * {@link ClinicAnimalAccess} grant plus the small animal summary the backend
 * joins in — **the only animal data an organization is given**. No breed / sex /
 * date-of-birth / notes / image, and **no owner information** (see §54).
 */
export interface OrganizationAnimalGrant {
  /** The access-grant id (NOT the animal id). */
  id: string;
  animalId: string;
  organizationId: string;
  status: ClinicAccessStatus;
  /** The organization member who granted the access. Not the animal's owner. */
  grantedByUserId: string | null;
  createdAt: string;
  animal: {
    name: string;
    /** Free-form string from the backend; usually an {@link AnimalSpecies}. */
    species: string;
    status: string;
    breed?: string | null;
    /** First gallery photo (signed / public URL), when the owner added one. */
    photoUrl?: string | null;
  };
  /** Current owner's display name (clinic holds an ACTIVE grant). */
  ownerName?: string | null;
}

/** `POST /organizations/:organizationId/animal-access` request body. */
export interface GrantAnimalAccessInput {
  animalId: string;
}

/** `POST /organizations/:organizationId/animal-access` 201 response. */
export interface ClinicAnimalAccess {
  id: string;
  animalId: string;
  organizationId: string;
  status: ClinicAccessStatus;
  grantedByUserId: string | null;
  createdAt: string;
}

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

/**
 * `GET /organizations/:organizationId/animals/:animalId` — the clinic-visible
 * animal profile (server `ClinicAnimalDTO`). Requires
 * `animal.veterinary.access.read` AND the clinic's ACTIVE grant (else 404).
 * Carries **no owner identity**, none of the owner's private notes, and no
 * storage keys — owner contact is never disclosed to an organization.
 */
export interface ClinicAnimalProfile {
  id: string;
  name: string;
  /** CHECK-constrained on `animals.species`, unlike the free-form list-row string. */
  species: AnimalSpecies;
  breed: string | null;
  sex: 'MALE' | 'FEMALE' | 'UNKNOWN';
  dateOfBirth: string | null;
  ageEstimate: 'UNDER_1_YEAR' | 'ONE_TO_3_YEARS' | 'THREE_TO_7_YEARS' | 'OVER_7_YEARS' | null;
  color: string | null;
  distinguishingFeatures: string | null;
  status: AnimalStatus;
  galleryUrls: string[];
  /** This clinic's ACTIVE grant — `null` only when an ADMIN views without one. */
  access: { id: string; grantedAt: string } | null;
  /** Full veterinary-history summary (every clinic's entries). */
  weightKg: number | null;
  isNeutered: boolean | null;
  /** Legacy free-text medical history (ADMIN-maintained). */
  medicalHistory: string | null;
  /** Current owner — shown to a clinic that holds an ACTIVE grant (legacy clinic pet page). */
  owner: { id: string; firstName: string; lastName: string; phone: string | null } | null;
  stats: {
    medicalRecordsCount: number;
    vaccinationsCount: number;
    /** `YYYY-MM-DD` */
    lastVisitDate: string | null;
    /** `YYYY-MM-DD` — earliest upcoming next-due date. */
    nextVaccinationDue: string | null;
  };
}
