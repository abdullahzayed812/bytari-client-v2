import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/services/api';

import { adminApi, adminKeys } from '../api';
import type {
  Paginated,
  PoultrySupervisionFarm,
  PoultrySupervisionLinkInput,
  PoultrySupervisionListParams,
  PoultrySupervisionSection,
  PoultrySupervisionSummary,
  PoultrySupervisionVeterinarianRow,
} from '../types';

/** `GET /admin/poultry-supervisors/summary` — the four metric cards (per governorate). */
export function usePoultrySupervisionSummary(governorate?: string, enabled = true) {
  return useQuery<PoultrySupervisionSummary, ApiError>({
    queryKey: adminKeys.poultrySupervisors.summary(governorate),
    queryFn: () => adminApi.poultrySupervisionSummary(governorate),
    enabled,
    staleTime: 15_000,
  });
}

/**
 * One PAGE of a section (`linked-farms` / `unlinked-farms` / `veterinarians`)
 * — the screen uses numbered pagination, so this is a plain paged query that
 * keeps the previous page on screen while the next loads.
 */
export function usePoultrySupervisionPage<T>(
  section: PoultrySupervisionSection,
  params: PoultrySupervisionListParams,
  enabled = true,
) {
  return useQuery<Paginated<T>, ApiError>({
    queryKey: adminKeys.poultrySupervisors.list(section, { ...params }),
    queryFn: () => adminApi.listPoultrySupervision<T>(section, params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

/** Picker options for the link form — up to 100 unlinked farms / approved vets (the sheet searches them). */
export function usePoultrySupervisionOptions(enabled: boolean) {
  const farms = useQuery<Paginated<PoultrySupervisionFarm>, ApiError>({
    queryKey: adminKeys.poultrySupervisors.options('farms'),
    queryFn: () =>
      adminApi.listPoultrySupervision<PoultrySupervisionFarm>('unlinked-farms', {
        page: 1,
        pageSize: 100,
      }),
    enabled,
  });
  const vets = useQuery<Paginated<PoultrySupervisionVeterinarianRow>, ApiError>({
    queryKey: adminKeys.poultrySupervisors.options('vets'),
    queryFn: () =>
      adminApi.listPoultrySupervision<PoultrySupervisionVeterinarianRow>('veterinarians', {
        page: 1,
        pageSize: 100,
      }),
    enabled,
  });
  return { farms, vets };
}

function useInvalidateSupervision() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: adminKeys.poultrySupervisors.all });
    void qc.invalidateQueries({ queryKey: adminKeys.farms.all });
  };
}

export function useLinkPoultrySupervisor() {
  const invalidate = useInvalidateSupervision();
  return useMutation({
    mutationFn: (input: PoultrySupervisionLinkInput & { organizationId: string }) =>
      adminApi.linkPoultrySupervisor(input),
    onSuccess: invalidate,
  });
}

export function useReplacePoultrySupervisor() {
  const invalidate = useInvalidateSupervision();
  return useMutation({
    mutationFn: ({
      membershipId,
      ...input
    }: PoultrySupervisionLinkInput & { membershipId: string }) =>
      adminApi.replacePoultrySupervisor(membershipId, input),
    onSuccess: invalidate,
  });
}

export function useUnlinkPoultrySupervisor() {
  const invalidate = useInvalidateSupervision();
  return useMutation({
    mutationFn: (membershipId: string) => adminApi.unlinkPoultrySupervisor(membershipId),
    onSuccess: invalidate,
  });
}
