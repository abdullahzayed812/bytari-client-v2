/**
 * Clinic Appointments feature — the Pet Owner ↔ Clinic "حجز موعد" booking flow.
 *
 * Pet Owner side: book a visit from a Clinic Details screen, view your own
 * appointment list / details, cancel an open request, and respond to a
 * clinic-proposed reschedule. Clinic side (Clinic Dashboard): list the
 * clinic's appointments and confirm / reject / complete them. The clinic's
 * "propose a reschedule" API exists on the backend but has no UI yet.
 */
export {
  petOwnerAppointmentService,
  clinicAppointmentService,
  appointmentKeys,
  type PetOwnerAppointmentService,
  type ClinicAppointmentService,
} from './api';
export {
  usePetOwnerAppointments,
  usePetOwnerAppointment,
  usePetOwnerAppointmentHistory,
  useBookPetOwnerAppointment,
  useCancelPetOwnerAppointment,
  useRespondToReschedule,
  useClinicAppointments,
  useClinicAppointmentAction,
  type ClinicAppointmentAction,
} from './hooks';
export { AppointmentCard, AppointmentStatusBadge, DateTimeField } from './components';
export {
  PetOwnerBookAppointmentScreen,
  PetOwnerAppointmentsScreen,
  PetOwnerAppointmentDetailsScreen,
  ClinicAppointmentsScreen,
} from './screens';
export {
  APPOINTMENT_STATUS_TONE,
  VISIT_TYPE_ICON,
  formatAppointmentDate,
  formatAppointmentTime,
  formatAppointmentDateTime,
} from './constants';
export {
  VISIT_TYPES,
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_FILTERS,
  type VisitType,
  type AppointmentStatus,
  type AppointmentStatusFilter,
  type ClinicAppointment,
  type AppointmentHistoryEntry,
  type BookAppointmentInput,
} from './types';
