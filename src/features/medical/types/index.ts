/**
 * Veterinary medical-record & vaccination contract — Mobile Phase 6. Mirrors
 * `server/src/modules/veterinary-care` exactly (`veterinary-care.types.ts`,
 * `veterinary-care.schemas.ts`, OpenAPI `phase5`). No invented fields.
 *
 * Two access paths, same DTOs:
 *  - CLINIC (organization-scoped, full CRUD):
 *      /organizations/:organizationId/animals/:animalId/medical-records[...]
 *      /organizations/:organizationId/animals/:animalId/vaccinations[...]
 *  - OWNER (animal-scoped, READ-ONLY):
 *      /animals/:animalId/medical-records[...]
 *      /animals/:animalId/vaccinations[...]
 *
 * A clinic reads the animal's COMPLETE history (all clinics' entries) but may
 * update / delete only entries IT recorded (`organizationId` match) — the
 * backend hides the rest behind a 404. `recordedByUserId` and `organizationId`
 * are set by the server from the JWT / route and are never in a request body.
 */

export interface MedicalRecord {
  id: string;
  animalId: string;
  organizationId: string;
  /** The veterinarian who recorded it. UUID — no name-resolution endpoint exists. */
  recordedByUserId: string | null;
  /** `YYYY-MM-DD` (date-only). */
  visitDate: string;
  reason: string | null;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
  /** ISO datetime. */
  createdAt: string;
  updatedAt: string;
}

export interface Vaccination {
  id: string;
  animalId: string;
  organizationId: string;
  recordedByUserId: string | null;
  vaccineName: string;
  /** `YYYY-MM-DD` (date-only). */
  administeredOn: string;
  /** `YYYY-MM-DD` or `null`. May be in the future. */
  nextDueOn: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- request payloads (client sends ONLY these fields) --------------

export interface MedicalRecordInput {
  visitDate?: string;
  reason?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  notes?: string | null;
}

export interface VaccinationInput {
  vaccineName?: string;
  administeredOn?: string;
  nextDueOn?: string | null;
  notes?: string | null;
}

/** Present ⇒ CLINIC (organization) context; absent ⇒ OWNER context. */
export interface MedicalScope {
  animalId: string;
  organizationId?: string;
}

// --- medical history / timeline (Phase 12) ------------------------
//
// Composed read model over medical records + vaccinations — mirrors the backend
// `MedicalTimelineEntryDTO` (`GET /animals/:id/medical-history`, and the
// clinic-scoped `/organizations/:orgId/animals/:id/medical-history`). No new
// data — each entry embeds the full record or vaccination DTO.

export const MEDICAL_TIMELINE_TYPES = ['MEDICAL_RECORD', 'VACCINATION'] as const;
export type MedicalTimelineType = (typeof MEDICAL_TIMELINE_TYPES)[number];

export interface MedicalTimelineEntry {
  type: MedicalTimelineType;
  /** `visitDate` for a record, `administeredOn` for a vaccination (`YYYY-MM-DD`). */
  occurredOn: string;
  organizationId: string;
  recordedByUserId: string | null;
  /** ISO datetime — stable tie-break for same-day entries. */
  createdAt: string;
  medicalRecord?: MedicalRecord;
  vaccination?: Vaccination;
}

// --- list ---------------------------------------------------------

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
