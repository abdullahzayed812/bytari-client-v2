/**
 * Clinic Dashboard (لوحة العيادة) — the CLINIC organization's home, opened from
 * `MyVeterinaryOrganizationsScreen`. Migrated from legacy `bytari`
 * `app/clinic-dashboard.tsx` onto v2 contracts: stats + effective permissions
 * from `GET /organizations/:id/clinic-dashboard/summary`; every action links to
 * an existing v2 screen (animals, medical, appointments, chat, broadcast,
 * members, supervisors, organization profile).
 */
export { clinicDashboardApi, clinicDashboardKeys, type ClinicDashboardApi } from './api';
export { useClinicDashboard, useClinicPermissions } from './hooks';
export { ClinicDashboardHomeScreen } from './screens';
export type {
  ClinicDashboardPermissions,
  ClinicDashboardSummary,
  ClinicMedicalStats,
  ClinicAppointmentStats,
} from './types';
