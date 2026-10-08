import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { medicalKeys, medicalRecordsApi, medicalScopeTag } from '../api';
import type { MedicalRecord, MedicalScope, Paginated } from '../types';

/**
 * THIS clinic's medical records for an animal (`medical_record.read`). Clinic
 * context only — records are clinic-private, so without an `organizationId`
 * the query never runs.
 */
export function useMedicalRecords(
  scope: MedicalScope,
  params: { pageSize?: number; enabled?: boolean } = {},
) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const { animalId, organizationId } = scope;
  const tag = medicalScopeTag(organizationId);

  const query = useInfiniteQuery<
    Paginated<MedicalRecord>,
    unknown,
    InfiniteData<Paginated<MedicalRecord>>,
    ReturnType<typeof medicalKeys.recordList>,
    number
  >({
    queryKey: medicalKeys.recordList(animalId || 'unknown', tag),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      medicalRecordsApi.listForClinic(organizationId as string, animalId, pageParam, pageSize),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: Boolean(animalId) && Boolean(organizationId) && (params.enabled ?? true),
    staleTime: 15_000,
  });

  const records = useMemo<MedicalRecord[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, records, total };
}

/** One of THIS clinic's medical records — `404` for an unknown id or another clinic's record. */
export function useMedicalRecord(
  scope: MedicalScope,
  recordId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  const { animalId, organizationId } = scope;
  return useQuery<MedicalRecord, ApiError>({
    queryKey: medicalKeys.record(animalId || 'unknown', recordId ?? 'unknown'),
    queryFn: () =>
      medicalRecordsApi.getForClinic(organizationId as string, animalId, recordId as string),
    enabled:
      Boolean(animalId) &&
      Boolean(organizationId) &&
      Boolean(recordId) &&
      (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}
