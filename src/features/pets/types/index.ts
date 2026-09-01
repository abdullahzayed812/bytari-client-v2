/**
 * Pet (backend "Animal") contract. Mirrors `server/src/modules/animals`
 * (`animal.types.ts`, `animal.schemas.ts`, `animal.constants.ts`) and OpenAPI
 * `phase4` — verified against the real implementation, not assumed.
 *
 * The backend has NO image field on an animal (§11) — `PetImage` renders a
 * placeholder and stays upload-ready for a future phase.
 */

// --- controlled vocabularies (exact backend values, §12) ---------------
export const PET_SPECIES = [
  'DOG',
  'CAT',
  'BIRD',
  'RABBIT',
  'REPTILE',
  'FISH',
  'HORSE',
  'OTHER',
] as const;
export type PetSpecies = (typeof PET_SPECIES)[number];

export const PET_SEXES = ['MALE', 'FEMALE', 'UNKNOWN'] as const;
export type PetSex = (typeof PET_SEXES)[number];

/** Animal-core lifecycle only. Listing workflows (lost/adoption/mating) are later phases. */
export const PET_STATUSES = ['ACTIVE', 'DEACTIVATED'] as const;
export type PetStatus = (typeof PET_STATUSES)[number];

// --- DTO (list item, detail, create/update/deactivate response) --------
export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  sex: PetSex;
  /** `YYYY-MM-DD` or `null`. */
  dateOfBirth: string | null;
  notes: string | null;
  status: PetStatus;
  /** The user who created the animal (immutable). */
  createdBy: string;
  /** Resolved current owner. Backend-derived — the client never sets it. */
  currentOwnerUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- request payloads (client sends ONLY these fields) ----------------
export interface CreatePetInput {
  name: string;
  species: PetSpecies;
  breed?: string | null;
  sex?: PetSex;
  dateOfBirth?: string | null;
  notes?: string | null;
}

export interface UpdatePetInput {
  name?: string;
  species?: PetSpecies;
  breed?: string | null;
  sex?: PetSex;
  dateOfBirth?: string | null;
  notes?: string | null;
}

// --- ownership (Phase 12) --------------------------------------------
//
// Mirrors `server/src/modules/animals` `OwnershipRecordDTO`. The backend's
// `owner` projection also carries `email`; the app deliberately does not read
// or store it — only the name is needed and it is already resolvable via
// `GET /users/:id`.

export interface OwnerSummary {
  id: string;
  firstName: string;
  lastName: string;
}

export interface OwnershipRecord {
  id: string;
  animalId: string;
  ownerUserId: string;
  owner: OwnerSummary | null;
  /** ISO datetime. */
  startedAt: string;
  /** ISO datetime or `null` (the current owner). */
  endedAt: string | null;
  isCurrent: boolean;
  /** The user who performed the transfer that opened this record. */
  transferredBy: string | null;
  transferReason: string | null;
}

/**
 * `POST /animals/:animalId/ownership/transfer`. The backend requires the caller
 * to be the current owner (or ADMIN); the recipient must be an ACTIVE user in
 * the system and not already the owner. There is NO request / acceptance step.
 */
export interface TransferOwnershipInput {
  toUserId: string;
  reason?: string;
}

// --- list -----------------------------------------------------------
export interface PetListFilter {
  page: number;
  pageSize: number;
  status?: PetStatus;
  species?: PetSpecies;
  search?: string;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PetListPage {
  items: Pet[];
  meta: PageMeta;
}
