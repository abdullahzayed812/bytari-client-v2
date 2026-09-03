import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { poultryOpsApi, poultryOpsKeys } from '../api';
import type {
  BatchSummary,
  CreateFarmExpenseInput,
  FarmExpense,
  FarmExpenseSummary,
  FarmProfile,
  Paginated,
  PoultryCaseSummary,
  PoultryDailyRecord,
  UpdateFarmProfileInput,
  WeeklySummary,
} from '../types';

const noRetryOn403 = (count: number, error: unknown): boolean =>
  !(error instanceof ApiError && (error.status === 403 || error.status === 404)) && count < 2;

/** Farm Details header extras (image / address / capacity / established / category). */
export function useFarmProfile(orgId: string | undefined, options: { enabled?: boolean } = {}) {
  return useQuery<FarmProfile, ApiError>({
    queryKey: poultryOpsKeys.farmProfile(orgId ?? 'unknown'),
    queryFn: () => poultryOpsApi.getFarmProfile(orgId as string),
    enabled: Boolean(orgId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 60_000,
  });
}

/** The "الدفعة رقم N" card — server-computed. */
export function useBatchSummary(
  orgId: string | undefined,
  flockId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<BatchSummary, ApiError>({
    queryKey: poultryOpsKeys.batchSummary(orgId ?? 'unknown', flockId ?? 'unknown'),
    queryFn: () => poultryOpsApi.batchSummary(orgId as string, flockId as string),
    enabled: Boolean(orgId) && Boolean(flockId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
}

/** The "ملخص الأسبوع" card — server-computed from the week's daily records. */
export function useWeeklySummary(
  orgId: string | undefined,
  flockId: string | undefined,
  weekOf?: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery<WeeklySummary, ApiError>({
    queryKey: poultryOpsKeys.weeklySummary(orgId ?? 'unknown', flockId ?? 'unknown', weekOf),
    queryFn: () => poultryOpsApi.weeklySummary(orgId as string, flockId as string, weekOf),
    enabled: Boolean(orgId) && Boolean(flockId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
}

/** The "البيانات اليومية" list. */
export function useDailyRecords(
  orgId: string | undefined,
  flockId: string | undefined,
  options: { pageSize?: number; enabled?: boolean } = {},
) {
  const pageSize = options.pageSize ?? AppConfig.defaultPageSize;
  const filter = { page: 1, pageSize };
  return useQuery<Paginated<PoultryDailyRecord>, ApiError>({
    queryKey: poultryOpsKeys.dailyRecords(orgId ?? 'unknown', flockId ?? 'unknown', filter),
    queryFn: () => poultryOpsApi.listDailyRecords(orgId as string, flockId as string, filter),
    enabled: Boolean(orgId) && Boolean(flockId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 15_000,
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
    queryFn: () => poultryOpsApi.listExpenses(orgId as string, query),
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
    queryFn: () => poultryOpsApi.expenseSummary(orgId as string),
    enabled: Boolean(orgId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
}

export function usePoultryCaseSummary(
  orgId: string | undefined,
  flockId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<PoultryCaseSummary, ApiError>({
    queryKey: poultryOpsKeys.caseSummary(orgId ?? 'unknown', flockId ?? 'unknown'),
    queryFn: () => poultryOpsApi.caseSummary(orgId as string, flockId as string),
    enabled: Boolean(orgId) && Boolean(flockId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 30_000,
  });
}

/** Record a farm expense. mutate → server success → invalidate (§28). */
export function useCreateFarmExpense(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['poultry-ops', 'expense', 'create', orgId],
    mutationFn: (body: CreateFarmExpenseInput) => poultryOpsApi.createExpense(orgId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: poultryOpsKeys.expenses(orgId) });
    },
  });
}

/** Update the farm-profile header. */
export function useUpdateFarmProfile(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['poultry-ops', 'farm-profile', 'update', orgId],
    mutationFn: (body: UpdateFarmProfileInput) => poultryOpsApi.updateFarmProfile(orgId, body),
    onSuccess: (data) => {
      qc.setQueryData(poultryOpsKeys.farmProfile(orgId), data);
    },
  });
}
