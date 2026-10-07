import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type {
  AppointmentListPage,
  AppointmentStatus,
  BookAppointmentInput,
  ClinicAppointment,
} from '../types';

/**
 * Clinic-side appointment wrappers (the Clinic Dashboard). The backend gates
 * every route on `clinic.appointment.read` / `.manage` in the URL's clinic and
 * asserts the appointment belongs to that clinic (else 404) — the client never
 * decides who may act.
 *
 * Contract: `server/src/modules/clinic-appointments/presentation/clinic-appointment.routes.ts`.
 *  - `GET  /organizations/:organizationId/clinic-appointments?page&pageSize&status`
 *  - `POST /organizations/:organizationId/clinic-appointments/:id/confirm`
 *  - `POST /organizations/:organizationId/clinic-appointments/:id/reject   { reason? }`
 *  - `POST /organizations/:organizationId/clinic-appointments/:id/complete`
 *  - `POST /organizations/:organizationId/clinic-appointments/:id/reschedule { proposedScheduledFor, reason? }`
 *  - `POST /organizations/:organizationId/clinic-appointments/by-clinic`   (clinic books; CONFIRMED)
 *  - `POST /organizations/:organizationId/clinic-appointments/:id/remind`  (notify the owner)
 *  - `POST /organizations/:organizationId/clinic-appointments/remind-today`
 *  - `DELETE /organizations/:organizationId/clinic-appointments/:id`       (COMPLETED only)
 */
export const clinicAppointmentService = {
  async list(
    organizationId: string,
    filter: { page: number; pageSize: number; status?: AppointmentStatus },
  ): Promise<AppointmentListPage> {
    const envelope = await apiClient.requestEnvelope<ClinicAppointment[]>({
      method: 'GET',
      url: `/organizations/${organizationId}/clinic-appointments`,
      params: { page: filter.page, pageSize: filter.pageSize, status: filter.status },
    });
    const m = (envelope.meta ?? {}) as Partial<ApiPageMeta>;
    return {
      items: envelope.data,
      meta: {
        page: m.page ?? filter.page,
        pageSize: m.pageSize ?? filter.pageSize,
        total: m.total ?? envelope.data.length,
        totalPages: m.totalPages ?? 1,
      },
    };
  },

  confirm(organizationId: string, appointmentId: string): Promise<ClinicAppointment> {
    return apiClient.post<ClinicAppointment>(
      `/organizations/${organizationId}/clinic-appointments/${appointmentId}/confirm`,
    );
  },

  reject(
    organizationId: string,
    appointmentId: string,
    reason?: string,
  ): Promise<ClinicAppointment> {
    return apiClient.post<ClinicAppointment>(
      `/organizations/${organizationId}/clinic-appointments/${appointmentId}/reject`,
      reason ? { reason } : {},
    );
  },

  proposeReschedule(
    organizationId: string,
    appointmentId: string,
    proposedScheduledFor: string,
  ): Promise<ClinicAppointment> {
    return apiClient.post<ClinicAppointment>(
      `/organizations/${organizationId}/clinic-appointments/${appointmentId}/reschedule`,
      { proposedScheduledFor },
    );
  },

  createByClinic(organizationId: string, input: BookAppointmentInput): Promise<ClinicAppointment> {
    return apiClient.post<ClinicAppointment>(
      `/organizations/${organizationId}/clinic-appointments/by-clinic`,
      input,
    );
  },

  remind(organizationId: string, appointmentId: string): Promise<{ notified: boolean }> {
    return apiClient.post<{ notified: boolean }>(
      `/organizations/${organizationId}/clinic-appointments/${appointmentId}/remind`,
    );
  },

  remindToday(organizationId: string): Promise<{ sent: number }> {
    return apiClient.post<{ sent: number }>(
      `/organizations/${organizationId}/clinic-appointments/remind-today`,
    );
  },

  remove(organizationId: string, appointmentId: string): Promise<{ deleted: boolean }> {
    return apiClient.delete<{ deleted: boolean }>(
      `/organizations/${organizationId}/clinic-appointments/${appointmentId}`,
    );
  },

  complete(organizationId: string, appointmentId: string): Promise<ClinicAppointment> {
    return apiClient.post<ClinicAppointment>(
      `/organizations/${organizationId}/clinic-appointments/${appointmentId}/complete`,
    );
  },
};

export type ClinicAppointmentService = typeof clinicAppointmentService;
