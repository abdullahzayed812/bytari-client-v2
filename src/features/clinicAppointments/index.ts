/**
 * Clinic Appointments feature — the Pet Owner ↔ Clinic "حجز موعد" booking flow.
 *
 * Pet Owner scope only: book a visit from a Clinic Details screen, view your
 * own appointment list / details, cancel an open request, and respond to a
 * clinic-proposed reschedule. The clinic-side (accept / reject / propose /
 * status) APIs exist on the backend for the future Clinic Dashboard but no UI
 * is wired here.
 */
export {
  petOwnerAppointmentService,
  appointmentKeys,
  type PetOwnerAppointmentService,
} from './api';
export {
  usePetOwnerAppointments,
  usePetOwnerAppointment,
  usePetOwnerAppointmentHistory,
  useBookPetOwnerAppointment,
  useCancelPetOwnerAppointment,
  useRespondToReschedule,
} from './hooks';
export { AppointmentCard, AppointmentStatusBadge, DateTimeField } from './components';
export {
  PetOwnerBookAppointmentScreen,
  PetOwnerAppointmentsScreen,
  PetOwnerAppointmentDetailsScreen,
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
