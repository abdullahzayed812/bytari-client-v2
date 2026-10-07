import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import type { ApiError } from '@/services/api';

import { appointmentKeys, clinicAppointmentService } from '../api';
import type {
  AppointmentListPage,
  AppointmentStatus,
  BookAppointmentInput,
  ClinicAppointment,
} from '../types';

/** The clinic's incoming appointments (Clinic Dashboard), optionally one status. */
export function useClinicAppointments(organizationId: string, status?: AppointmentStatus) {
  const pageSize = AppConfig.defaultPageSize;

  const query = useInfiniteQuery<
    AppointmentListPage,
    ApiError,
    InfiniteData<AppointmentListPage>,
    ReturnType<typeof appointmentKeys.clinicList>,
    number
  >({
    queryKey: appointmentKeys.clinicList(organizationId, status),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      clinicAppointmentService.list(organizationId, { page: pageParam, pageSize, status }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: Boolean(organizationId),
    staleTime: 10_000,
  });

  const appointments = useMemo<ClinicAppointment[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  return { ...query, appointments };
}

export type ClinicAppointmentAction =
  | { kind: 'confirm'; appointmentId: string }
  | { kind: 'reject'; appointmentId: string; reason?: string }
  | { kind: 'complete'; appointmentId: string }
  | { kind: 'reschedule'; appointmentId: string; proposedScheduledFor: string }
  | { kind: 'remind'; appointmentId: string }
  | { kind: 'delete'; appointmentId: string };

/**
 * Confirm / reject / complete one of the clinic's appointments. Refreshes every
 * appointment list + detail (both sides share the `clinic-appointments` prefix)
 * and the dashboard's counts.
 */
export function useClinicAppointmentAction(organizationId: string) {
  const qc = useQueryClient();
  return useMutation<ClinicAppointment | null, ApiError, ClinicAppointmentAction>({
    mutationKey: ['clinic-appointments', 'clinic-action', organizationId],
    mutationFn: (action) => {
      switch (action.kind) {
        case 'confirm':
          return clinicAppointmentService.confirm(organizationId, action.appointmentId);
        case 'reject':
          return clinicAppointmentService.reject(
            organizationId,
            action.appointmentId,
            action.reason,
          );
        case 'complete':
          return clinicAppointmentService.complete(organizationId, action.appointmentId);
        case 'reschedule':
          return clinicAppointmentService.proposeReschedule(
            organizationId,
            action.appointmentId,
            action.proposedScheduledFor,
          );
        case 'remind':
          return clinicAppointmentService
            .remind(organizationId, action.appointmentId)
            .then(() => null);
        case 'delete':
          return clinicAppointmentService
            .remove(organizationId, action.appointmentId)
            .then(() => null);
      }
    },
    onSuccess: (appointment) => {
      if (appointment) qc.setQueryData(appointmentKeys.detail(appointment.id), appointment);
      void qc.invalidateQueries({ queryKey: appointmentKeys.all });
      void qc.invalidateQueries({ queryKey: ['clinic-dashboard', 'summary', organizationId] });
    },
  });
}

/** The clinic books a visit for one of its animals (legacy createAppointment). */
export function useCreateClinicAppointment(organizationId: string) {
  const qc = useQueryClient();
  return useMutation<ClinicAppointment, ApiError, BookAppointmentInput>({
    mutationKey: ['clinic-appointments', 'by-clinic', organizationId],
    mutationFn: (input) => clinicAppointmentService.createByClinic(organizationId, input),
    onSuccess: (appointment) => {
      qc.setQueryData(appointmentKeys.detail(appointment.id), appointment);
      void qc.invalidateQueries({ queryKey: appointmentKeys.all });
      void qc.invalidateQueries({ queryKey: ['clinic-dashboard', 'summary', organizationId] });
    },
  });
}

/** "تذكير مواعيد اليوم" (legacy sendTodayAppointmentsNotification). */
export function useRemindTodayAppointments(organizationId: string) {
  return useMutation<{ sent: number }, ApiError, void>({
    mutationKey: ['clinic-appointments', 'remind-today', organizationId],
    mutationFn: () => clinicAppointmentService.remindToday(organizationId),
  });
}
