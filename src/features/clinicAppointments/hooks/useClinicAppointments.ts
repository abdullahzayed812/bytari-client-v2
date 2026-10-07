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
import type { AppointmentListPage, AppointmentStatus, ClinicAppointment } from '../types';

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
  | { kind: 'complete'; appointmentId: string };

/**
 * Confirm / reject / complete one of the clinic's appointments. Refreshes every
 * appointment list + detail (both sides share the `clinic-appointments` prefix)
 * and the dashboard's counts.
 */
export function useClinicAppointmentAction(organizationId: string) {
  const qc = useQueryClient();
  return useMutation<ClinicAppointment, ApiError, ClinicAppointmentAction>({
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
      }
    },
    onSuccess: (appointment) => {
      qc.setQueryData(appointmentKeys.detail(appointment.id), appointment);
      void qc.invalidateQueries({ queryKey: appointmentKeys.all });
      void qc.invalidateQueries({ queryKey: ['clinic-dashboard', 'summary', organizationId] });
    },
  });
}
