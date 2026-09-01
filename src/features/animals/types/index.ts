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
  };
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
