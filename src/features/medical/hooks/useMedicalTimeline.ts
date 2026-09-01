import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';

import { medicalHistoryApi, medicalKeys, medicalScopeTag } from '../api';
import type { MedicalScope, MedicalTimelineEntry, MedicalTimelineType, Paginated } from '../types';

/**
 * The animal's composed medical history (records + vaccinations, newest first,
 * backend-ordered). CLINIC context reads via `/organizations/:orgId/...`
 * (`medical_record.read` + veterinary access); OWNER context via
 * `/animals/:animalId/...` (current owner / ADMIN). Optional `type` filter is a
 * backend param — no client-side filtering.
 */
export function useMedicalTimeline(
  scope: MedicalScope,
  params: { type?: MedicalTimelineType; pageSize?: number; enabled?: boolean } = {},
) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const { animalId, organizationId } = scope;
  const tag = medicalScopeTag(organizationId);
  const type = params.type;

  const query = useInfiniteQuery<
    Paginated<MedicalTimelineEntry>,
    unknown,
    InfiniteData<Paginated<MedicalTimelineEntry>>,
    ReturnType<typeof medicalKeys.timelineList>,
    number
  >({
    queryKey: medicalKeys.timelineList(animalId || 'unknown', tag, type ?? 'ALL'),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      organizationId
        ? medicalHistoryApi.listForClinic(organizationId, animalId, pageParam, pageSize, type)
        : medicalHistoryApi.listForOwner(animalId, pageParam, pageSize, type),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: Boolean(animalId) && (params.enabled ?? true),
    staleTime: 15_000,
  });

  const entries = useMemo<MedicalTimelineEntry[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, entries, total };
}
