import { apiClient } from '@/services/api';
import type { PageMeta as ApiPageMeta } from '@/services/api';

import type { AppointmentListPage, AppointmentStatus, ClinicAppointment } from '../types';

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

  complete(organizationId: string, appointmentId: string): Promise<ClinicAppointment> {
    return apiClient.post<ClinicAppointment>(
      `/organizations/${organizationId}/clinic-appointments/${appointmentId}/complete`,
    );
  },
};

export type ClinicAppointmentService = typeof clinicAppointmentService;
