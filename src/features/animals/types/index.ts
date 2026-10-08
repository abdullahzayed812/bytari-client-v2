/**
 * Clinic ↔ pet contract. Mirrors `server/src/modules/veterinary-care`:
 *
 *   GET /organizations/:organizationId/clinic-pets?search   (Recent / All Pets)
 *   GET /organizations/:organizationId/clinic-pets/lookup?code  (open by ID / QR)
 *   GET /organizations/:organizationId/animals/:animalId    (clinic pet profile)
 *
 * There is NO link / grant: a pet belongs to its owner and exists independently
 * of clinics. A clinic opens it by the owner's short public ID, and the pets a
 * clinic "has" are exactly those it created its own records for. Every clinic
 * read is limited to that clinic's own records.
 */

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

/** One row of `GET /organizations/:organizationId/clinic-pets` (newest activity first). */
export interface ClinicPet {
  animalId: string;
  /** Short public pet ID (stored form, e.g. `K7M4QXR`). */
  publicCode: string;
  animal: {
    name: string;
    /** Free-form string from the backend; usually an {@link AnimalSpecies}. */
    species: string;
    status: string;
    breed?: string | null;
    /** First gallery photo (signed / public URL), when the owner added one. */
    photoUrl?: string | null;
  };
  /** Current owner's display name. */
  ownerName?: string | null;
  /** This clinic's first / latest record for the pet. */
  firstActivityAt: string;
  lastActivityAt: string;
}

/** `GET /organizations/:organizationId/clinic-pets/lookup?code=` */
export interface ClinicPetLookup {
  animalId: string;
  publicCode: string;
  name: string;
  species: string;
  breed: string | null;
  photoUrl: string | null;
  /** This clinic already has its own records for the pet. */
  workedWith: boolean;
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
 * pet profile (server `ClinicAnimalDTO`). Requires
 * `animal.veterinary.access.read`. Never the owner's private notes or storage
 * keys; `stats` / `relationship` cover THIS clinic's own records only.
 */
export interface ClinicAnimalProfile {
  id: string;
  /** Short public pet ID. */
  publicCode: string;
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
  /** This clinic's first / latest record — `null` until it adds something. */
  relationship: { firstActivityAt: string; lastActivityAt: string } | null;
  weightKg: number | null;
  isNeutered: boolean | null;
  /** Legacy free-text medical history (ADMIN-maintained). */
  medicalHistory: string | null;
  /** Current owner (legacy clinic pet page: call / chat the owner). */
  owner: { id: string; firstName: string; lastName: string; phone: string | null } | null;
  /** Counts over THIS clinic's own records only. */
  stats: {
    medicalRecordsCount: number;
    vaccinationsCount: number;
    /** `YYYY-MM-DD` */
    lastVisitDate: string | null;
    /** `YYYY-MM-DD` — earliest upcoming next-due date. */
    nextVaccinationDue: string | null;
  };
}
