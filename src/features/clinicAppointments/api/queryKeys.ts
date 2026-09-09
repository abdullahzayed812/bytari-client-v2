import type { AppointmentStatus } from '../types';

/**
 * Clinic-appointment query keys. One `all` prefix invalidates every list +
 * detail after a booking or a status change.
 *
 *   appointmentKeys.all              → ['clinic-appointments']
 *   appointmentKeys.lists()          → ['clinic-appointments', 'list']
 *   appointmentKeys.list(status)     → ['clinic-appointments', 'list', { status }]
 *   appointmentKeys.detail(id)       → ['clinic-appointments', 'detail', id]
 *   appointmentKeys.history(id)      → ['clinic-appointments', 'detail', id, 'history']
 */
export const appointmentKeys = {
  all: ['clinic-appointments'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (status?: AppointmentStatus) =>
    [...appointmentKeys.lists(), { status: status ?? null }] as const,
  details: () => [...appointmentKeys.all, 'detail'] as const,
  detail: (appointmentId: string) => [...appointmentKeys.details(), appointmentId] as const,
  history: (appointmentId: string) =>
    [...appointmentKeys.detail(appointmentId), 'history'] as const,
};
