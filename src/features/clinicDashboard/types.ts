/**
 * Clinic Dashboard contract — mirrors
 * `server/src/modules/veterinary-care/application/clinic-dashboard.service.ts`.
 *
 *   GET /organizations/:organizationId/clinic-dashboard/summary
 */

/**
 * The caller's effective permissions in this clinic, computed by the backend
 * from organization RBAC (role ∪ supervisor grants; OWNER / ADMIN override).
 * UI hint only — every action is re-authorized by its own route.
 */
export interface ClinicDashboardPermissions {
  canViewAnimals: boolean;
  canManageAnimalAccess: boolean;
  canViewMedicalRecords: boolean;
  canCreateMedicalRecords: boolean;
  canViewVaccinations: boolean;
  canCreateVaccinations: boolean;
  canViewAppointments: boolean;
  canManageAppointments: boolean;
  canSendBroadcast: boolean;
  canViewMembers: boolean;
  canViewSupervisors: boolean;
  canEditOrganization: boolean;
}

export interface ClinicMedicalStats {
  medicalRecordsCount: number;
  medicalRecordsToday: number;
  vaccinationsCount: number;
  vaccinationsDueToday: number;
  remindersCount: number;
  remindersToday: number;
  /** Distinct animals per source (legacy quick-access counters). */
  medicalAnimals: number;
  vaccinationAnimals: number;
  reminderAnimals: number;
  totalDistinctAnimals: number;
  visitorsToday: number;
}

export interface ClinicAppointmentStats {
  todayCount: number;
  pendingCount: number;
  upcomingCount: number;
  appointmentAnimals: number;
}

/** A section is `null` when the caller may not read the list it summarises. */
export interface ClinicDashboardSummary {
  permissions: ClinicDashboardPermissions;
  animals: { activeCount: number } | null;
  medical: ClinicMedicalStats | null;
  appointments: ClinicAppointmentStats | null;
  followersCount: number;
  rating: number | null;
  reviewsCount: number;
}
