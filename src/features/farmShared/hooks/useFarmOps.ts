import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { poultryOpsKeys } from '@/features/farm/api';
import type {
  CreateFarmAppointmentInput,
  CreateFarmExpenseInput,
  FarmAppointment,
  FarmAppointmentCategory,
  FarmExpense,
  FarmExpenseSummary,
  FarmProfile,
  Paginated,
  UpdateFarmProfileInput,
} from '@/features/farm/types';
import { ApiError } from '@/services/api';

import { farmOpsApi } from '../api';

const noRetryOn403 = (count: number, error: unknown): boolean =>
  !(error instanceof ApiError && (error.status === 403 || error.status === 404)) && count < 2;

/** Farm Details header extras (image / address / capacity / established / production type). Reused across poultry/sheep/cattle. */
export function useFarmProfile(orgId: string | undefined, options: { enabled?: boolean } = {}) {
  return useQuery<FarmProfile, ApiError>({
    queryKey: poultryOpsKeys.farmProfile(orgId ?? 'unknown'),
    queryFn: () => farmOpsApi.getFarmProfile(orgId as string),
    enabled: Boolean(orgId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 60_000,
  });
}

/** Update the farm-profile header. */
export function useUpdateFarmProfile(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['farm-ops', 'farm-profile', 'update', orgId],
    mutationFn: (body: UpdateFarmProfileInput) => farmOpsApi.updateFarmProfile(orgId, body),
    onSuccess: (data) => {
      qc.setQueryData(poultryOpsKeys.farmProfile(orgId), data);
    },
  });
}

/** "المصاريف" — list + the three summary cards. */
export function useFarmExpenses(
  orgId: string | undefined,
  filter: { category?: string; poultryFlockId?: string; pageSize?: number } = {},
  options: { enabled?: boolean } = {},
) {
  const query = { page: 1, pageSize: filter.pageSize ?? 20, category: filter.category };
  return useQuery<Paginated<FarmExpense>, ApiError>({
    queryKey: poultryOpsKeys.expenseList(orgId ?? 'unknown', query),
    queryFn: () => farmOpsApi.listExpenses(orgId as string, query),
    enabled: Boolean(orgId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
}

export function useFarmExpenseSummary(
  orgId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<FarmExpenseSummary, ApiError>({
    queryKey: poultryOpsKeys.expenseSummary(orgId ?? 'unknown'),
    queryFn: () => farmOpsApi.expenseSummary(orgId as string),
    enabled: Boolean(orgId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
}

/** Record a farm expense. mutate → server success → invalidate (§28). */
export function useCreateFarmExpense(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['farm-ops', 'expense', 'create', orgId],
    mutationFn: (body: CreateFarmExpenseInput) => farmOpsApi.createExpense(orgId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: poultryOpsKeys.expenses(orgId) });
    },
  });
}

export function useFarmExpense(orgId: string | undefined, expenseId: string | undefined) {
  return useQuery<FarmExpense, ApiError>({
    queryKey: poultryOpsKeys.expenseDetail(orgId ?? 'unknown', expenseId ?? 'unknown'),
    queryFn: () => farmOpsApi.getExpense(orgId as string, expenseId as string),
    enabled: Boolean(orgId) && Boolean(expenseId),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
}

// --- appointments --------------------------------------------

export function useFarmAppointments(
  orgId: string | undefined,
  filter: { category?: FarmAppointmentCategory; pageSize?: number } = {},
  options: { enabled?: boolean } = {},
) {
  const query = { page: 1, pageSize: filter.pageSize ?? 50, category: filter.category };
  const q = useQuery<Paginated<FarmAppointment>, ApiError>({
    queryKey: poultryOpsKeys.appointments(orgId ?? 'unknown', query),
    queryFn: () => farmOpsApi.listAppointments(orgId as string, query),
    enabled: Boolean(orgId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
  return { ...q, appointments: q.data?.items ?? [] };
}

export function useCreateFarmAppointment(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['farm-ops', 'appointment', 'create', orgId],
    mutationFn: (body: CreateFarmAppointmentInput) => farmOpsApi.createAppointment(orgId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: poultryOpsKeys.forOrg(orgId) });
    },
  });
}

export function useFarmAppointment(orgId: string | undefined, appointmentId: string | undefined) {
  return useQuery<FarmAppointment, ApiError>({
    queryKey: poultryOpsKeys.appointmentDetail(orgId ?? 'unknown', appointmentId ?? 'unknown'),
    queryFn: () => farmOpsApi.getAppointment(orgId as string, appointmentId as string),
    enabled: Boolean(orgId) && Boolean(appointmentId),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
}
