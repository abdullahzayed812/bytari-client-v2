import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { poultryOpsApi, poultryOpsKeys } from '../api';
import type {
  BatchSummary,
  CreateDailyRecordInput,
  UpdateDailyRecordInput,
  CreateHealthEventInput,
  CreatePoultryCaseInput,
  Paginated,
  PoultryCase,
  PoultryCaseStatus,
  PoultryCaseSummary,
  PoultryDailyRecord,
  PoultryHealthEvent,
  PoultryHealthEventKind,
  WeeklySummary,
} from '../types';

const noRetryOn403 = (count: number, error: unknown): boolean =>
  !(error instanceof ApiError && (error.status === 403 || error.status === 404)) && count < 2;

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

/** Record a day's data ("البيانات اليومية"). */
export function useCreateDailyRecord(orgId: string, flockId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['poultry-ops', 'daily-record', 'create', orgId, flockId],
    mutationFn: (body: CreateDailyRecordInput) =>
      poultryOpsApi.createDailyRecord(orgId, flockId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: poultryOpsKeys.forFlock(orgId, flockId) });
    },
  });
}

/** Edit a day's record (the date itself is never editable — server-assigned). */
export function useUpdateDailyRecord(orgId: string, flockId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['poultry-ops', 'daily-record', 'update', orgId, flockId],
    mutationFn: ({ recordId, body }: { recordId: string; body: UpdateDailyRecordInput }) =>
      poultryOpsApi.updateDailyRecord(orgId, flockId, recordId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: poultryOpsKeys.forFlock(orgId, flockId) });
    },
  });
}

export function useDeleteDailyRecord(orgId: string, flockId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['poultry-ops', 'daily-record', 'delete', orgId, flockId],
    mutationFn: (recordId: string) => poultryOpsApi.deleteDailyRecord(orgId, flockId, recordId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: poultryOpsKeys.forFlock(orgId, flockId) });
    },
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

// --- health events (treatments & vaccinations) -------------------

export function useHealthEvents(
  orgId: string | undefined,
  flockId: string | undefined,
  filter: { kind?: PoultryHealthEventKind; pageSize?: number } = {},
  options: { enabled?: boolean } = {},
) {
  const query = { page: 1, pageSize: filter.pageSize ?? 50, kind: filter.kind };
  const q = useQuery<Paginated<PoultryHealthEvent>, ApiError>({
    queryKey: poultryOpsKeys.healthEvents(orgId ?? 'unknown', flockId ?? 'unknown', query),
    queryFn: () => poultryOpsApi.listHealthEvents(orgId as string, flockId as string, query),
    enabled: Boolean(orgId) && Boolean(flockId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
  return { ...q, events: q.data?.items ?? [] };
}

export function useCreateHealthEvent(orgId: string, flockId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['poultry-ops', 'health-event', 'create', orgId, flockId],
    mutationFn: (body: CreateHealthEventInput) =>
      poultryOpsApi.createHealthEvent(orgId, flockId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: poultryOpsKeys.forFlock(orgId, flockId) });
    },
  });
}

// --- individual cases ------------------------------------

export function usePoultryCases(
  orgId: string | undefined,
  flockId: string | undefined,
  filter: { status?: PoultryCaseStatus; pageSize?: number } = {},
  options: { enabled?: boolean } = {},
) {
  const query = { page: 1, pageSize: filter.pageSize ?? 50, status: filter.status };
  const q = useQuery<Paginated<PoultryCase>, ApiError>({
    queryKey: poultryOpsKeys.cases(orgId ?? 'unknown', flockId ?? 'unknown', query),
    queryFn: () => poultryOpsApi.listCases(orgId as string, flockId as string, query),
    enabled: Boolean(orgId) && Boolean(flockId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
  return { ...q, cases: q.data?.items ?? [] };
}

export function useCreatePoultryCase(orgId: string, flockId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['poultry-ops', 'case', 'create', orgId, flockId],
    mutationFn: (body: CreatePoultryCaseInput) => poultryOpsApi.createCase(orgId, flockId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: poultryOpsKeys.forFlock(orgId, flockId) });
    },
  });
}

// --- single-item reads (detail screens) ---------------------------

export function useHealthEvent(
  orgId: string | undefined,
  flockId: string | undefined,
  eventId: string | undefined,
) {
  return useQuery<PoultryHealthEvent, ApiError>({
    queryKey: poultryOpsKeys.healthEventDetail(
      orgId ?? 'unknown',
      flockId ?? 'unknown',
      eventId ?? 'unknown',
    ),
    queryFn: () => poultryOpsApi.getHealthEvent(orgId as string, flockId as string, eventId as string),
    enabled: Boolean(orgId) && Boolean(flockId) && Boolean(eventId),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
}

export function usePoultryCase(
  orgId: string | undefined,
  flockId: string | undefined,
  caseId: string | undefined,
) {
  return useQuery<PoultryCase, ApiError>({
    queryKey: poultryOpsKeys.caseDetail(orgId ?? 'unknown', flockId ?? 'unknown', caseId ?? 'unknown'),
    queryFn: () => poultryOpsApi.getCase(orgId as string, flockId as string, caseId as string),
    enabled: Boolean(orgId) && Boolean(flockId) && Boolean(caseId),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
}
