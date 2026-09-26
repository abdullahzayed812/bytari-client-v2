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

import { cattleFarmApi, cattleKeys } from '../api';
import type {
  CattleBatch,
  CattleBatchSummary,
  CattleCase,
  CattleCaseSummary,
  CattleDailyRecord,
  CattleHealthEvent,
  CattleWeeklySummary,
  CreateCattleBatchInput,
  CreateCattleCaseInput,
  CreateCattleDailyRecordInput,
  UpdateCattleDailyRecordInput,
  CreateCattleHealthEventInput,
  LivestockBatchStatus,
  Paginated,
  UpdateCattleBatchInput,
} from '../types';

const noRetryOn403 = (count: number, error: unknown): boolean =>
  !(error instanceof ApiError && (error.status === 403 || error.status === 404)) && count < 2;

export interface UseCattleBatchesParams {
  status?: LivestockBatchStatus;
  pageSize?: number;
  enabled?: boolean;
}

/** A FARM's cattle batches. Requires `farm.cattle_batch.read` server-side. Mirrors `useSheepBatches`. */
export function useCattleBatches(organizationId: string | undefined, params: UseCattleBatchesParams = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = { status: params.status, pageSize };

  const query = useInfiniteQuery<
    Paginated<CattleBatch>,
    unknown,
    InfiniteData<Paginated<CattleBatch>>,
    ReturnType<typeof cattleKeys.list>,
    number
  >({
    queryKey: cattleKeys.list(organizationId ?? 'unknown', filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      cattleFarmApi.list(organizationId as string, { page: pageParam, pageSize, status: params.status }),
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    enabled: Boolean(organizationId) && (params.enabled ?? true),
    staleTime: 15_000,
  });

  const batches = useMemo<CattleBatch[]>(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.meta.total ?? 0;
  return { ...query, batches, total };
}

export function useCattleBatch(
  organizationId: string | undefined,
  batchId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<CattleBatch, ApiError>({
    queryKey: cattleKeys.detail(organizationId ?? 'unknown', batchId ?? 'unknown'),
    queryFn: () => cattleFarmApi.get(organizationId as string, batchId as string),
    enabled: Boolean(organizationId) && Boolean(batchId) && (options.enabled ?? true),
    retry: noRetryOn403,
  });
}

export function useCreateCattleBatch(organizationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['cattle', 'batch', 'create', organizationId],
    mutationFn: (body: CreateCattleBatchInput) => cattleFarmApi.create(organizationId, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: cattleKeys.forOrg(organizationId) }),
  });
}

export function useUpdateCattleBatch(organizationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['cattle', 'batch', 'update', organizationId],
    mutationFn: ({ batchId, body }: { batchId: string; body: UpdateCattleBatchInput }) =>
      cattleFarmApi.update(organizationId, batchId, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: cattleKeys.forOrg(organizationId) }),
  });
}

export function useDeleteCattleBatch(organizationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['cattle', 'batch', 'delete', organizationId],
    mutationFn: ({ batchId }: { batchId: string }) => cattleFarmApi.remove(organizationId, batchId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: cattleKeys.forOrg(organizationId) }),
  });
}

// --- ops: summary / weekly / daily / health / case --------------

export function useCattleBatchSummary(
  orgId: string | undefined,
  batchId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<CattleBatchSummary, ApiError>({
    queryKey: cattleKeys.batchSummary(orgId ?? 'unknown', batchId ?? 'unknown'),
    queryFn: () => cattleFarmApi.batchSummary(orgId as string, batchId as string),
    enabled: Boolean(orgId) && Boolean(batchId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
}

export function useCattleWeeklySummary(
  orgId: string | undefined,
  batchId: string | undefined,
  weekOf?: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery<CattleWeeklySummary, ApiError>({
    queryKey: cattleKeys.weeklySummary(orgId ?? 'unknown', batchId ?? 'unknown', weekOf),
    queryFn: () => cattleFarmApi.weeklySummary(orgId as string, batchId as string, weekOf),
    enabled: Boolean(orgId) && Boolean(batchId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
}

export function useCattleDailyRecords(
  orgId: string | undefined,
  batchId: string | undefined,
  options: { pageSize?: number; enabled?: boolean } = {},
) {
  const pageSize = options.pageSize ?? AppConfig.defaultPageSize;
  const filter = { page: 1, pageSize };
  return useQuery<Paginated<CattleDailyRecord>, ApiError>({
    queryKey: cattleKeys.dailyRecords(orgId ?? 'unknown', batchId ?? 'unknown', filter),
    queryFn: () => cattleFarmApi.listDailyRecords(orgId as string, batchId as string, filter),
    enabled: Boolean(orgId) && Boolean(batchId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
}

export function useCreateCattleDailyRecord(orgId: string, batchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['cattle', 'daily-record', 'create', orgId, batchId],
    mutationFn: (body: CreateCattleDailyRecordInput) => cattleFarmApi.createDailyRecord(orgId, batchId, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: cattleKeys.forBatch(orgId, batchId) }),
  });
}

export function useUpdateCattleDailyRecord(orgId: string, batchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['cattle', 'daily-record', 'update', orgId, batchId],
    mutationFn: ({ recordId, body }: { recordId: string; body: UpdateCattleDailyRecordInput }) =>
      cattleFarmApi.updateDailyRecord(orgId, batchId, recordId, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: cattleKeys.forBatch(orgId, batchId) }),
  });
}

export function useDeleteCattleDailyRecord(orgId: string, batchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['cattle', 'daily-record', 'delete', orgId, batchId],
    mutationFn: (recordId: string) => cattleFarmApi.deleteDailyRecord(orgId, batchId, recordId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: cattleKeys.forBatch(orgId, batchId) }),
  });
}

export function useCattleCaseSummary(
  orgId: string | undefined,
  batchId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<CattleCaseSummary, ApiError>({
    queryKey: cattleKeys.caseSummary(orgId ?? 'unknown', batchId ?? 'unknown'),
    queryFn: () => cattleFarmApi.caseSummary(orgId as string, batchId as string),
    enabled: Boolean(orgId) && Boolean(batchId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 30_000,
  });
}

export function useCattleHealthEvents(
  orgId: string | undefined,
  batchId: string | undefined,
  filter: { kind?: string; pageSize?: number } = {},
  options: { enabled?: boolean } = {},
) {
  const query = { page: 1, pageSize: filter.pageSize ?? 50, kind: filter.kind };
  const q = useQuery<Paginated<CattleHealthEvent>, ApiError>({
    queryKey: cattleKeys.healthEvents(orgId ?? 'unknown', batchId ?? 'unknown', query),
    queryFn: () => cattleFarmApi.listHealthEvents(orgId as string, batchId as string, query),
    enabled: Boolean(orgId) && Boolean(batchId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
  return { ...q, events: q.data?.items ?? [] };
}

export function useCreateCattleHealthEvent(orgId: string, batchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['cattle', 'health-event', 'create', orgId, batchId],
    mutationFn: (body: CreateCattleHealthEventInput) => cattleFarmApi.createHealthEvent(orgId, batchId, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: cattleKeys.forBatch(orgId, batchId) }),
  });
}

export function useCattleHealthEvent(
  orgId: string | undefined,
  batchId: string | undefined,
  eventId: string | undefined,
) {
  return useQuery<CattleHealthEvent, ApiError>({
    queryKey: cattleKeys.healthEventDetail(orgId ?? 'unknown', batchId ?? 'unknown', eventId ?? 'unknown'),
    queryFn: () => cattleFarmApi.getHealthEvent(orgId as string, batchId as string, eventId as string),
    enabled: Boolean(orgId) && Boolean(batchId) && Boolean(eventId),
    retry: noRetryOn403,
  });
}

export function useCattleCases(
  orgId: string | undefined,
  batchId: string | undefined,
  filter: { status?: string; pageSize?: number } = {},
  options: { enabled?: boolean } = {},
) {
  const query = { page: 1, pageSize: filter.pageSize ?? 50, status: filter.status };
  const q = useQuery<Paginated<CattleCase>, ApiError>({
    queryKey: cattleKeys.cases(orgId ?? 'unknown', batchId ?? 'unknown', query),
    queryFn: () => cattleFarmApi.listCases(orgId as string, batchId as string, query),
    enabled: Boolean(orgId) && Boolean(batchId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
  return { ...q, cases: q.data?.items ?? [] };
}

export function useCreateCattleCase(orgId: string, batchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['cattle', 'case', 'create', orgId, batchId],
    mutationFn: (body: CreateCattleCaseInput) => cattleFarmApi.createCase(orgId, batchId, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: cattleKeys.forBatch(orgId, batchId) }),
  });
}

export function useCattleCase(orgId: string | undefined, batchId: string | undefined, caseId: string | undefined) {
  return useQuery<CattleCase, ApiError>({
    queryKey: cattleKeys.caseDetail(orgId ?? 'unknown', batchId ?? 'unknown', caseId ?? 'unknown'),
    queryFn: () => cattleFarmApi.getCase(orgId as string, batchId as string, caseId as string),
    enabled: Boolean(orgId) && Boolean(batchId) && Boolean(caseId),
    retry: noRetryOn403,
  });
}
