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

/** For when the exact `dateOfBirth` isn't known (e.g. a found / rescued animal). */
export const PET_AGE_ESTIMATES = [
  'UNDER_1_YEAR',
  'ONE_TO_3_YEARS',
  'THREE_TO_7_YEARS',
  'OVER_7_YEARS',
] as const;
export type PetAgeEstimate = (typeof PET_AGE_ESTIMATES)[number];

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
  /**
   * The backend always returns these — optional here only so the many
   * pre-existing `Pet` test fixtures across unrelated features don't all need
   * updating; real responses always populate them (`galleryUrls` as `[]`, not
   * `undefined`, when empty).
   */
  color?: string | null;
  distinguishingFeatures?: string | null;
  ageEstimate?: PetAgeEstimate | null;
  /** Resolved R2 photo URLs — the client never builds them. */
  galleryUrls?: string[];
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
  color?: string | null;
  distinguishingFeatures?: string | null;
  ageEstimate?: PetAgeEstimate | null;
}

export interface UpdatePetInput {
  name?: string;
  species?: PetSpecies;
  breed?: string | null;
  sex?: PetSex;
  dateOfBirth?: string | null;
  notes?: string | null;
  color?: string | null;
  distinguishingFeatures?: string | null;
  ageEstimate?: PetAgeEstimate | null;
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

// --- ownership transfer requests (request/acceptance) ----------------
//
// Mirrors `server/src/modules/animals` `transfer-request.types.ts`. There is
// no instant transfer — the current owner proposes a transfer, and the
// recipient must ACCEPT before ownership actually moves; a REJECTED/CANCELLED
// request never touches ownership. "My requests" splits into `sent` (I'm the
// owner who proposed) and `received` (I'm the proposed new owner) via two
// separate endpoints, never a single list filtered client-side.

export const TRANSFER_REQUEST_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'] as const;
export type TransferRequestStatus = (typeof TRANSFER_REQUEST_STATUSES)[number];

export interface TransferRequestUserSummary {
  id: string;
  firstName: string;
  lastName: string;
}

export interface TransferRequestAnimalSummary {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
}

export interface AnimalTransferRequest {
  id: string;
  animal: TransferRequestAnimalSummary;
  fromUser: TransferRequestUserSummary;
  toUser: TransferRequestUserSummary;
  status: TransferRequestStatus;
  reason: string | null;
  responseReason: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransferRequestInput {
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
