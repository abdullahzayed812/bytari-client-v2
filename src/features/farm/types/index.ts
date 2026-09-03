/**
 * Farm join-code & poultry contract — Mobile Phase 7. Mirrors
 * `server/src/modules/farms` exactly (`farm.constants.ts`, `farm.types.ts`,
 * `farm.schemas.ts`, OpenAPI `phase6`). No invented fields.
 *
 * A Farm is an Organization of type `FARM` (Phase 3/4). This module adds only:
 *  - the Farm-ID join flow (`POST /organizations/join`,
 *    `GET`/`POST /organizations/:id/join-code[/regenerate]`)
 *  - the poultry domain (`/organizations/:id/poultry/flocks[/:flockId]`)
 * Members / veterinarians / supervisors reuse the Phase 4 organization APIs.
 */

export const POULTRY_BIRD_TYPES = ['CHICKEN', 'DUCK', 'TURKEY', 'QUAIL', 'GOOSE', 'OTHER'] as const;
export type PoultryBirdType = (typeof POULTRY_BIRD_TYPES)[number];

export const POULTRY_FLOCK_STATUSES = ['ACTIVE', 'CLOSED'] as const;
export type PoultryFlockStatus = (typeof POULTRY_FLOCK_STATUSES)[number];

/** `GET`/`POST /organizations/:id/join-code[/regenerate]` response. */
export interface FarmJoinCode {
  joinCode: string;
}

/** `PoultryFlock` DTO — the backend returns every field here. */
export interface PoultryFlock {
  id: string;
  organizationId: string;
  name: string;
  birdType: PoultryBirdType;
  birdCount: number;
  /** `YYYY-MM-DD` (date-only). */
  arrivalDate: string;
  status: PoultryFlockStatus;
  notes: string | null;
  /** Per-farm sequential batch number ("الدفعة رقم N"). */
  batchNumber: number | null;
  /** Birds placed at the start of the batch — the mortality denominator. */
  initialBirdCount: number | null;
  /** Latest recorded average bird weight, grams. Backend `numeric` → string. */
  averageWeightGrams: string | null;
  /** Optional planned sale price, used for the profit estimate. `numeric` → string. */
  targetPricePerKg: string | null;
  expectedSaleDate: string | null;
  /** The farm member who registered the flock. UUID — no name-resolution endpoint. */
  createdByUserId: string | null;
  /** ISO datetime, set when the flock is CLOSED. */
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- request payloads (client sends ONLY these fields) --------------
export interface CreatePoultryFlockInput {
  name: string;
  birdType: PoultryBirdType;
  birdCount: number;
  arrivalDate: string;
  notes?: string | null;
  initialBirdCount?: number | null;
  averageWeightGrams?: number | null;
  targetPricePerKg?: number | null;
  expectedSaleDate?: string | null;
}

export interface UpdatePoultryFlockInput {
  name?: string;
  birdType?: PoultryBirdType;
  birdCount?: number;
  arrivalDate?: string;
  status?: PoultryFlockStatus;
  notes?: string | null;
  initialBirdCount?: number | null;
  averageWeightGrams?: number | null;
  targetPricePerKg?: number | null;
  expectedSaleDate?: string | null;
}

export interface JoinFarmInput {
  joinCode: string;
}

export interface PoultryListFilter {
  page: number;
  pageSize: number;
  status?: PoultryFlockStatus;
  birdType?: PoultryBirdType;
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

export * from './poultryOps';
