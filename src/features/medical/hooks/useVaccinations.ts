import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';
import { ApiError } from '@/services/api';

import { medicalKeys, medicalScopeTag, vaccinationsApi } from '../api';
import type { MedicalScope, Paginated, Vaccination } from '../types';

/** An animal's vaccination history — same CLINIC / OWNER split as {@link useMedicalRecords}. */
export function useVaccinations(
  scope: MedicalScope,
  params: { pageSize?: number; enabled?: boolean } = {},
) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const { animalId, organizationId } = scope;
  const tag = medicalScopeTag(organizationId);

  const query = useInfiniteQuery<
    Paginated<Vaccination>,
    unknown,
    InfiniteData<Paginated<Vaccination>>,
    ReturnType<typeof medicalKeys.vaccinationList>,
    number
  >({
    queryKey: medicalKeys.vaccinationList(animalId || 'unknown', tag),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      organizationId
        ? vaccinationsApi.listForClinic(organizationId, animalId, pageParam, pageSize)
        : vaccinationsApi.listForOwner(animalId, pageParam, pageSize),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: Boolean(animalId) && (params.enabled ?? true),
    staleTime: 15_000,
  });

  const vaccinations = useMemo<Vaccination[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, vaccinations, total };
}

/** One vaccination. */
export function useVaccination(
  scope: MedicalScope,
  vaccinationId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  const { animalId, organizationId } = scope;
  return useQuery<Vaccination, ApiError>({
    queryKey: medicalKeys.vaccination(animalId || 'unknown', vaccinationId ?? 'unknown'),
    queryFn: () =>
      organizationId
        ? vaccinationsApi.getForClinic(organizationId, animalId, vaccinationId as string)
        : vaccinationsApi.getForOwner(animalId, vaccinationId as string),
    enabled: Boolean(animalId) && Boolean(vaccinationId) && (options.enabled ?? true),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });
}
