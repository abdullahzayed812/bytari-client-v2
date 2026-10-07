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

// --- legacy-parity vocabularies (exact backend values) -----------------

/** Legacy شديدة / متوسطة / خفيفة. */
export const MEDICAL_RECORD_SEVERITIES = ['SEVERE', 'MODERATE', 'MILD'] as const;
export type MedicalRecordSeverity = (typeof MEDICAL_RECORD_SEVERITIES)[number];

/** Legacy مراجعة_سريعة / فحص_شامل / تحليل / ملف (+ untyped → GENERAL). */
export const MEDICAL_RECORD_TYPES = [
  'GENERAL',
  'QUICK_REVIEW',
  'FULL_EXAM',
  'LAB',
  'FILE',
] as const;
export type MedicalRecordType = (typeof MEDICAL_RECORD_TYPES)[number];

/** Legacy vaccination status (overdue is derived, never stored). */
export const VACCINATION_STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED'] as const;
export type VaccinationStatus = (typeof VACCINATION_STATUSES)[number];

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
  symptoms: string | null;
  severity: MedicalRecordSeverity | null;
  labNotes: string | null;
  recordType: MedicalRecordType;
  isDraft: boolean;
  /** R2 key of the prescription photo; {@link prescriptionUrl} is its signed URL. */
  prescriptionKey: string | null;
  prescriptionUrl: string | null;
  /** R2 keys of attached images / PDFs; {@link attachmentUrls} are signed URLs (same order). */
  attachmentKeys: string[];
  attachmentUrls: string[];
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
  status: VaccinationStatus;
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
  symptoms?: string | null;
  severity?: MedicalRecordSeverity | null;
  labNotes?: string | null;
  recordType?: MedicalRecordType;
  isDraft?: boolean;
  prescriptionKey?: string | null;
  attachmentKeys?: string[];
}

export interface VaccinationInput {
  vaccineName?: string;
  administeredOn?: string;
  nextDueOn?: string | null;
  status?: VaccinationStatus;
  notes?: string | null;
}

// --- reminders (legacy pet_reminders) --------------------------------

export const REMINDER_TYPES = ['CHECKUP', 'VACCINATION', 'MEDICATION', 'OTHER'] as const;
export type ReminderType = (typeof REMINDER_TYPES)[number];

export interface AnimalReminder {
  id: string;
  animalId: string;
  organizationId: string;
  recordedByUserId: string | null;
  title: string;
  description: string | null;
  /** YYYY-MM-DD */
  reminderDate: string;
  reminderType: ReminderType;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderInput {
  title?: string;
  description?: string | null;
  reminderDate?: string;
  reminderType?: ReminderType;
  isCompleted?: boolean;
}

// --- quick-review templates -------------------------------------------

export const QUICK_REVIEW_TEMPLATE_TYPES = [
  'VACCINE',
  'TREATMENT',
  'DIAGNOSIS',
  'GENERAL',
] as const;
export type QuickReviewTemplateType = (typeof QUICK_REVIEW_TEMPLATE_TYPES)[number];

export interface QuickReviewTemplate {
  id: string;
  organizationId: string;
  name: string;
  templateType: QuickReviewTemplateType;
  defaultDiagnosis: string | null;
  defaultTreatment: string | null;
  defaultNotes: string | null;
  intervalDays: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuickReviewTemplateInput {
  name?: string;
  templateType?: QuickReviewTemplateType;
  defaultDiagnosis?: string | null;
  defaultTreatment?: string | null;
  defaultNotes?: string | null;
  intervalDays?: number | null;
}

// --- clinic-wide lists ("التطعيمات" / "التذكيرات" screens) -----------------

export interface ClinicListAnimal {
  id: string;
  name: string;
  species: string;
  breed: string | null;
}
export interface ClinicListOwner {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}
export interface ClinicVaccinationItem {
  vaccination: Vaccination;
  animal: ClinicListAnimal;
  owner: ClinicListOwner | null;
  isOverdue: boolean;
}
export interface ClinicReminderItem {
  reminder: AnimalReminder;
  animal: ClinicListAnimal;
  owner: ClinicListOwner | null;
  isOverdue: boolean;
}
export const CLINIC_VACCINATION_FILTERS = [
  'ALL',
  'DUE_TODAY',
  'OVERDUE',
  'SCHEDULED',
  'COMPLETED',
  'CANCELLED',
] as const;
export type ClinicVaccinationFilter = (typeof CLINIC_VACCINATION_FILTERS)[number];
export const CLINIC_REMINDER_FILTERS = ['ALL', 'TODAY', 'PENDING', 'OVERDUE', 'COMPLETED'] as const;
export type ClinicReminderFilter = (typeof CLINIC_REMINDER_FILTERS)[number];

/** `POST …/medical-records/attachments/upload-url` response. */
export interface MedicalAttachmentPresign {
  storageKey: string;
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresInSeconds: number;
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
