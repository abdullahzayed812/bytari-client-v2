import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type {
  AppointmentHistoryEntry,
  AppointmentListFilter,
  AppointmentListPage,
  BookAppointmentInput,
  ClinicAppointment,
} from '../types';

function readMeta(meta: unknown, page: number, pageSize: number, count: number): ApiPageMeta {
  const m = (meta ?? {}) as Partial<ApiPageMeta>;
  return {
    page: m.page ?? page,
    pageSize: m.pageSize ?? pageSize,
    total: m.total ?? count,
    totalPages: m.totalPages ?? 1,
  };
}

/**
 * Pet Owner clinic-appointment wrappers. No token / ownership logic — the API
 * client attaches auth; the backend derives + enforces that the appointment
 * belongs to the caller.
 *
 * Contract: `server/src/modules/clinic-appointments/presentation/clinic-appointment.routes.ts`.
 *  - `POST /organizations/:organizationId/clinic-appointments`     → 201; book a visit
 *  - `GET  /clinic-appointments?page&pageSize&status`              → the caller's own appointments
 *  - `GET  /clinic-appointments/:id`                               → owner-or-clinic; else 404
 *  - `GET  /clinic-appointments/:id/history`                       → history timeline
 *  - `POST /clinic-appointments/:id/cancel`                        → owner withdraws
 *  - `POST /clinic-appointments/:id/reschedule-response { accept } → accept/decline a proposal
 */
export const petOwnerAppointmentService = {
  book(organizationId: string, input: BookAppointmentInput): Promise<ClinicAppointment> {
    return apiClient.post<ClinicAppointment>(
      `/organizations/${organizationId}/clinic-appointments`,
      input,
    );
  },

  async list(filter: AppointmentListFilter): Promise<AppointmentListPage> {
    const envelope = await apiClient.requestEnvelope<ClinicAppointment[]>({
      method: 'GET',
      url: '/clinic-appointments',
      params: { page: filter.page, pageSize: filter.pageSize, status: filter.status },
    });
    return {
      items: envelope.data,
      meta: readMeta(envelope.meta, filter.page, filter.pageSize, envelope.data.length),
    };
  },

  get(appointmentId: string): Promise<ClinicAppointment> {
    return apiClient.get<ClinicAppointment>(`/clinic-appointments/${appointmentId}`);
  },

  history(appointmentId: string): Promise<AppointmentHistoryEntry[]> {
    return apiClient.get<AppointmentHistoryEntry[]>(
      `/clinic-appointments/${appointmentId}/history`,
    );
  },

  cancel(appointmentId: string): Promise<ClinicAppointment> {
    return apiClient.post<ClinicAppointment>(`/clinic-appointments/${appointmentId}/cancel`);
  },

  respondToReschedule(appointmentId: string, accept: boolean): Promise<ClinicAppointment> {
    return apiClient.post<ClinicAppointment>(
      `/clinic-appointments/${appointmentId}/reschedule-response`,
      { accept },
    );
  },
};

export type PetOwnerAppointmentService = typeof petOwnerAppointmentService;
