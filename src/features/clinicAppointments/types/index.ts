/**
 * Clinic Appointments (Pet Owner ↔ Clinic "حجز موعد") contract.
 *
 * Mirrors `server/src/modules/clinic-appointments` — `clinic-appointment.types.ts`
 * / `clinic-appointment.constants.ts` and OpenAPI `clinicAppointments` — verified
 * against the real implementation, not assumed.
 *
 * Pet Owner scope only. The clinic-side (accept / reject / reschedule / status)
 * APIs exist on the backend for the future Clinic Dashboard but are NOT wired
 * here.
 */

// --- controlled vocabularies (exact backend values) -------------------

export const VISIT_TYPES = ['CHECKUP', 'VACCINATION', 'FOLLOW_UP', 'SURGERY', 'OTHER'] as const;
export type VisitType = (typeof VISIT_TYPES)[number];

export const APPOINTMENT_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'RESCHEDULE_PROPOSED',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** Filter chips on the list screen ("الكل" + the six statuses). */
export const APPOINTMENT_STATUS_FILTERS = ['ALL', ...APPOINTMENT_STATUSES] as const;
export type AppointmentStatusFilter = (typeof APPOINTMENT_STATUS_FILTERS)[number];

export type AppointmentViewerSide = 'PET_OWNER' | 'CLINIC';

export const APPOINTMENT_HISTORY_KINDS = [
  'REQUESTED',
  'CONFIRMED',
  'REJECTED',
  'RESCHEDULE_PROPOSED',
  'RESCHEDULE_ACCEPTED',
  'RESCHEDULE_DECLINED',
  'CANCELLED',
  'COMPLETED',
] as const;
export type AppointmentHistoryKind = (typeof APPOINTMENT_HISTORY_KINDS)[number];

// --- DTOs -----------------------------------------------------------

export interface AppointmentAnimalRef {
  id: string;
  name: string;
  species: string;
  breed: string | null;
}

export interface AppointmentOrgRef {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
}

export interface ClinicAppointment {
  id: string;
  organizationId: string;
  organization: AppointmentOrgRef;
  animalId: string;
  animal: AppointmentAnimalRef;
  petOwnerUserId: string;
  visitType: VisitType;
  /** ISO datetime — the effective appointment slot. */
  scheduledFor: string;
  /** ISO datetime — the clinic's proposed alternative while status is RESCHEDULE_PROPOSED. */
  proposedScheduledFor: string | null;
  note: string | null;
  status: AppointmentStatus;
  decisionReason: string | null;
  decidedByUserId: string | null;
  decidedAt: string | null;
  viewerSide: AppointmentViewerSide;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentHistoryEntry {
  id: string;
  kind: AppointmentHistoryKind;
  actorSide: AppointmentViewerSide;
  actorUserId: string | null;
  fromScheduledFor: string | null;
  toScheduledFor: string | null;
  reason: string | null;
  createdAt: string;
}

// --- request payloads (client sends ONLY these) ----------------------

export interface BookAppointmentInput {
  animalId: string;
  visitType: VisitType;
  /** ISO datetime (preferred date + time combined). */
  scheduledFor: string;
  note?: string | null;
}

// --- list ---------------------------------------------------------

export interface AppointmentListFilter {
  page: number;
  pageSize: number;
  status?: AppointmentStatus;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AppointmentListPage {
  items: ClinicAppointment[];
  meta: PageMeta;
}
