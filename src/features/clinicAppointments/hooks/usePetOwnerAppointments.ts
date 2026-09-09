import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { appointmentKeys, petOwnerAppointmentService } from '../api';
import type {
  AppointmentHistoryEntry,
  AppointmentListPage,
  AppointmentStatus,
  BookAppointmentInput,
  ClinicAppointment,
} from '../types';

/**
 * The authenticated Pet Owner's appointments. Owner-scoped by the backend
 * (`GET /clinic-appointments` only ever returns the caller's own). Infinite
 * query so the list can append pages and pull-to-refresh; `status` narrows it
 * to one filter chip.
 */
export function usePetOwnerAppointments(status?: AppointmentStatus) {
  const pageSize = AppConfig.defaultPageSize;

  const query = useInfiniteQuery<
    AppointmentListPage,
    unknown,
    InfiniteData<AppointmentListPage>,
    ReturnType<typeof appointmentKeys.list>,
    number
  >({
    queryKey: appointmentKeys.list(status),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      petOwnerAppointmentService.list({ page: pageParam, pageSize, status }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    staleTime: 10_000,
  });

  const appointments = useMemo<ClinicAppointment[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, appointments, total };
}

export function usePetOwnerAppointment(appointmentId: string | undefined) {
  return useQuery<ClinicAppointment, ApiError>({
    queryKey: appointmentKeys.detail(appointmentId ?? 'unknown'),
    queryFn: () => petOwnerAppointmentService.get(appointmentId as string),
    enabled: Boolean(appointmentId),
  });
}

export function usePetOwnerAppointmentHistory(appointmentId: string | undefined) {
  return useQuery<AppointmentHistoryEntry[], ApiError>({
    queryKey: appointmentKeys.history(appointmentId ?? 'unknown'),
    queryFn: () => petOwnerAppointmentService.history(appointmentId as string),
    enabled: Boolean(appointmentId),
  });
}

/** Book a visit with a clinic. On success the caller's appointment lists refresh. */
export function useBookPetOwnerAppointment(organizationId: string) {
  const qc = useQueryClient();
  return useMutation<ClinicAppointment, ApiError, BookAppointmentInput>({
    mutationKey: ['clinic-appointments', 'book', organizationId],
    mutationFn: (input) => petOwnerAppointmentService.book(organizationId, input),
    onSuccess: (appointment) => {
      qc.setQueryData(appointmentKeys.detail(appointment.id), appointment);
      void qc.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

export function useCancelPetOwnerAppointment(appointmentId: string) {
  const qc = useQueryClient();
  return useMutation<ClinicAppointment, ApiError, void>({
    mutationKey: ['clinic-appointments', 'cancel', appointmentId],
    mutationFn: () => petOwnerAppointmentService.cancel(appointmentId),
    onSuccess: (appointment) => {
      qc.setQueryData(appointmentKeys.detail(appointment.id), appointment);
      void qc.invalidateQueries({ queryKey: appointmentKeys.lists() });
      void qc.invalidateQueries({ queryKey: appointmentKeys.history(appointment.id) });
    },
  });
}

/** Accept (→ CONFIRMED) or decline (→ CANCELLED) the clinic's proposed reschedule. */
export function useRespondToReschedule(appointmentId: string) {
  const qc = useQueryClient();
  return useMutation<ClinicAppointment, ApiError, boolean>({
    mutationKey: ['clinic-appointments', 'reschedule-response', appointmentId],
    mutationFn: (accept) => petOwnerAppointmentService.respondToReschedule(appointmentId, accept),
    onSuccess: (appointment) => {
      qc.setQueryData(appointmentKeys.detail(appointment.id), appointment);
      void qc.invalidateQueries({ queryKey: appointmentKeys.lists() });
      void qc.invalidateQueries({ queryKey: appointmentKeys.history(appointment.id) });
    },
  });
}
