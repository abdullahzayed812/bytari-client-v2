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

import { sheepFarmApi, sheepKeys } from '../api';
import type {
  CreateSheepBatchInput,
  CreateSheepCaseInput,
  CreateSheepDailyRecordInput,
  CreateSheepHealthEventInput,
  LivestockBatchStatus,
  Paginated,
  SheepBatch,
  SheepBatchSummary,
  SheepCase,
  SheepCaseSummary,
  SheepDailyRecord,
  SheepHealthEvent,
  SheepWeeklySummary,
  UpdateSheepBatchInput,
} from '../types';

const noRetryOn403 = (count: number, error: unknown): boolean =>
  !(error instanceof ApiError && (error.status === 403 || error.status === 404)) && count < 2;

export interface UseSheepBatchesParams {
  status?: LivestockBatchStatus;
  pageSize?: number;
  enabled?: boolean;
}

/** A FARM's sheep batches. Requires `farm.sheep_batch.read` server-side. Mirrors `usePoultryFlocks`. */
export function useSheepBatches(organizationId: string | undefined, params: UseSheepBatchesParams = {}) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = { status: params.status, pageSize };

  const query = useInfiniteQuery<
    Paginated<SheepBatch>,
    unknown,
    InfiniteData<Paginated<SheepBatch>>,
    ReturnType<typeof sheepKeys.list>,
    number
  >({
    queryKey: sheepKeys.list(organizationId ?? 'unknown', filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      sheepFarmApi.list(organizationId as string, { page: pageParam, pageSize, status: params.status }),
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    enabled: Boolean(organizationId) && (params.enabled ?? true),
    staleTime: 15_000,
  });

  const batches = useMemo<SheepBatch[]>(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.meta.total ?? 0;
  return { ...query, batches, total };
}

export function useSheepBatch(
  organizationId: string | undefined,
  batchId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<SheepBatch, ApiError>({
    queryKey: sheepKeys.detail(organizationId ?? 'unknown', batchId ?? 'unknown'),
    queryFn: () => sheepFarmApi.get(organizationId as string, batchId as string),
    enabled: Boolean(organizationId) && Boolean(batchId) && (options.enabled ?? true),
    retry: noRetryOn403,
  });
}

export function useCreateSheepBatch(organizationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['sheep', 'batch', 'create', organizationId],
    mutationFn: (body: CreateSheepBatchInput) => sheepFarmApi.create(organizationId, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: sheepKeys.forOrg(organizationId) }),
  });
}

export function useUpdateSheepBatch(organizationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['sheep', 'batch', 'update', organizationId],
    mutationFn: ({ batchId, body }: { batchId: string; body: UpdateSheepBatchInput }) =>
      sheepFarmApi.update(organizationId, batchId, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: sheepKeys.forOrg(organizationId) }),
  });
}

export function useDeleteSheepBatch(organizationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['sheep', 'batch', 'delete', organizationId],
    mutationFn: ({ batchId }: { batchId: string }) => sheepFarmApi.remove(organizationId, batchId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: sheepKeys.forOrg(organizationId) }),
  });
}

// --- ops: summary / weekly / daily / health / case --------------

export function useSheepBatchSummary(
  orgId: string | undefined,
  batchId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<SheepBatchSummary, ApiError>({
    queryKey: sheepKeys.batchSummary(orgId ?? 'unknown', batchId ?? 'unknown'),
    queryFn: () => sheepFarmApi.batchSummary(orgId as string, batchId as string),
    enabled: Boolean(orgId) && Boolean(batchId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
}

export function useSheepWeeklySummary(
  orgId: string | undefined,
  batchId: string | undefined,
  weekOf?: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery<SheepWeeklySummary, ApiError>({
    queryKey: sheepKeys.weeklySummary(orgId ?? 'unknown', batchId ?? 'unknown', weekOf),
    queryFn: () => sheepFarmApi.weeklySummary(orgId as string, batchId as string, weekOf),
    enabled: Boolean(orgId) && Boolean(batchId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
}

export function useSheepDailyRecords(
  orgId: string | undefined,
  batchId: string | undefined,
  options: { pageSize?: number; enabled?: boolean } = {},
) {
  const pageSize = options.pageSize ?? AppConfig.defaultPageSize;
  const filter = { page: 1, pageSize };
  return useQuery<Paginated<SheepDailyRecord>, ApiError>({
    queryKey: sheepKeys.dailyRecords(orgId ?? 'unknown', batchId ?? 'unknown', filter),
    queryFn: () => sheepFarmApi.listDailyRecords(orgId as string, batchId as string, filter),
    enabled: Boolean(orgId) && Boolean(batchId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
}

export function useCreateSheepDailyRecord(orgId: string, batchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['sheep', 'daily-record', 'create', orgId, batchId],
    mutationFn: (body: CreateSheepDailyRecordInput) => sheepFarmApi.createDailyRecord(orgId, batchId, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: sheepKeys.forBatch(orgId, batchId) }),
  });
}

export function useSheepCaseSummary(
  orgId: string | undefined,
  batchId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<SheepCaseSummary, ApiError>({
    queryKey: sheepKeys.caseSummary(orgId ?? 'unknown', batchId ?? 'unknown'),
    queryFn: () => sheepFarmApi.caseSummary(orgId as string, batchId as string),
    enabled: Boolean(orgId) && Boolean(batchId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 30_000,
  });
}

export function useSheepHealthEvents(
  orgId: string | undefined,
  batchId: string | undefined,
  filter: { kind?: string; pageSize?: number } = {},
  options: { enabled?: boolean } = {},
) {
  const query = { page: 1, pageSize: filter.pageSize ?? 50, kind: filter.kind };
  const q = useQuery<Paginated<SheepHealthEvent>, ApiError>({
    queryKey: sheepKeys.healthEvents(orgId ?? 'unknown', batchId ?? 'unknown', query),
    queryFn: () => sheepFarmApi.listHealthEvents(orgId as string, batchId as string, query),
    enabled: Boolean(orgId) && Boolean(batchId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
  return { ...q, events: q.data?.items ?? [] };
}

export function useCreateSheepHealthEvent(orgId: string, batchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['sheep', 'health-event', 'create', orgId, batchId],
    mutationFn: (body: CreateSheepHealthEventInput) => sheepFarmApi.createHealthEvent(orgId, batchId, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: sheepKeys.forBatch(orgId, batchId) }),
  });
}

export function useSheepHealthEvent(
  orgId: string | undefined,
  batchId: string | undefined,
  eventId: string | undefined,
) {
  return useQuery<SheepHealthEvent, ApiError>({
    queryKey: sheepKeys.healthEventDetail(orgId ?? 'unknown', batchId ?? 'unknown', eventId ?? 'unknown'),
    queryFn: () => sheepFarmApi.getHealthEvent(orgId as string, batchId as string, eventId as string),
    enabled: Boolean(orgId) && Boolean(batchId) && Boolean(eventId),
    retry: noRetryOn403,
  });
}

export function useSheepCases(
  orgId: string | undefined,
  batchId: string | undefined,
  filter: { status?: string; pageSize?: number } = {},
  options: { enabled?: boolean } = {},
) {
  const query = { page: 1, pageSize: filter.pageSize ?? 50, status: filter.status };
  const q = useQuery<Paginated<SheepCase>, ApiError>({
    queryKey: sheepKeys.cases(orgId ?? 'unknown', batchId ?? 'unknown', query),
    queryFn: () => sheepFarmApi.listCases(orgId as string, batchId as string, query),
    enabled: Boolean(orgId) && Boolean(batchId) && (options.enabled ?? true),
    retry: noRetryOn403,
    staleTime: 15_000,
  });
  return { ...q, cases: q.data?.items ?? [] };
}

export function useCreateSheepCase(orgId: string, batchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['sheep', 'case', 'create', orgId, batchId],
    mutationFn: (body: CreateSheepCaseInput) => sheepFarmApi.createCase(orgId, batchId, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: sheepKeys.forBatch(orgId, batchId) }),
  });
}

export function useSheepCase(orgId: string | undefined, batchId: string | undefined, caseId: string | undefined) {
  return useQuery<SheepCase, ApiError>({
    queryKey: sheepKeys.caseDetail(orgId ?? 'unknown', batchId ?? 'unknown', caseId ?? 'unknown'),
    queryFn: () => sheepFarmApi.getCase(orgId as string, batchId as string, caseId as string),
    enabled: Boolean(orgId) && Boolean(batchId) && Boolean(caseId),
    retry: noRetryOn403,
  });
}
