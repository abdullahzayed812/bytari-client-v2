import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { medicalKeys, medicalRecordsApi, medicalScopeTag } from '../api';
import type { MedicalRecord, MedicalScope, Paginated } from '../types';

/**
 * An animal's medical-record history. CLINIC context (with `organizationId`)
 * reads via `/organizations/:orgId/...` and requires `medical_record.read` +
 * veterinary access; OWNER context reads via `/animals/:animalId/...` and is
 * allowed only for the animal's current owner (or ADMIN). Same DTO either way.
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
      organizationId
        ? medicalRecordsApi.listForClinic(organizationId, animalId, pageParam, pageSize)
        : medicalRecordsApi.listForOwner(animalId, pageParam, pageSize),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: Boolean(animalId) && (params.enabled ?? true),
    staleTime: 15_000,
  });

  const records = useMemo<MedicalRecord[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, records, total };
}

/** One medical record. Backend returns `404` for an unknown id or (on write paths) another clinic's record. */
export function useMedicalRecord(
  scope: MedicalScope,
  recordId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  const { animalId, organizationId } = scope;
  return useQuery<MedicalRecord, ApiError>({
    queryKey: medicalKeys.record(animalId || 'unknown', recordId ?? 'unknown'),
    queryFn: () =>
      organizationId
        ? medicalRecordsApi.getForClinic(organizationId, animalId, recordId as string)
        : medicalRecordsApi.getForOwner(animalId, recordId as string),
    enabled: Boolean(animalId) && Boolean(recordId) && (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}
